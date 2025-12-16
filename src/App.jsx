import { useState, useRef, useEffect } from 'react'
import html2canvas from 'html2canvas'
import './index.css'
import Camera from './components/Camera'
import PolaroidFrame from './components/PolaroidFrame'
import RecentGallery from './components/RecentGallery'
import InstallPrompt from './components/InstallPrompt'
import { applyPolaroidFilter } from './utils/filters'
import { useRecentPhotos } from './hooks/useRecentPhotos'
import { wasCameraAccessGranted } from './hooks/useCamera'

function App() {
  const [mode, setMode] = useState('camera'); // camera, developing, result
  const [photo, setPhoto] = useState(null);
  const [caption, setCaption] = useState('');
  const [font, setFont] = useState('Special Elite'); // Default retro font

  // Enforce 2-line limit and character count
  const handleCaptionChange = (e) => {
    const val = e.target.value;
    const lines = val.split('\n');

    // Allow if:
    // 1. Max 2 lines (length <= 2)
    // 2. Max chars 50 (stricter limit to prevent wrapping overflow)
    if (lines.length <= 2 && val.length <= 50) {
      setCaption(val);
    }
  };
  const [filterEnabled, setFilterEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(() => wasCameraAccessGranted());
  const [currentPhotoId, setCurrentPhotoId] = useState(null);
  const [triggerVisualFlash, setTriggerVisualFlash] = useState(false);
  const [timestampMode, setTimestampMode] = useState('overlay'); // 'off', 'overlay', 'text'
  const [capturedTimestamp, setCapturedTimestamp] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const frameRef = useRef(null);

  const { photos, addPhoto, updatePhoto, removePhoto, clearPhotos } = useRecentPhotos();

  // Check if user has used camera before - Removed legacy check

  const fonts = [
    { name: 'Typewriter', value: 'Special Elite' },
    { name: 'Handwritten', value: 'Caveat' }, // Need to add this to index.html
    { name: 'Clean', value: 'Inter' } // Need to add this to index.html
  ];

  const handleCapture = (imageSrc) => {
    setPhoto(imageSrc);
    setCapturedTimestamp(new Date());
    setCurrentPhotoId(null); // Reset session ID for new photo
    setMode('developing');

    // Visual wait (10s)
    setTimeout(() => {
      setMode('result');
    }, 10000);
  };

  // Unified save function for both Auto-save and User Download
  const saveCurrentPolaroid = async (download = false) => {
    if (!photo) return;

    try {
      // Manually create the polaroid image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const width = 1000;
      const height = 1200;
      const padding = 60;
      const bottomPadding = 200;

      canvas.width = width;
      canvas.height = height;

      // 1. Draw Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Image
      const img = new Image();
      img.src = photo;
      await new Promise(resolve => img.onload = resolve);

      const imgSize = width - (padding * 2);

      // Draw raw image first
      ctx.drawImage(img, padding, padding, imgSize, imgSize);

      // 3. Apply Pixel Filter
      if (filterEnabled) {
        try {
          const imageData = ctx.getImageData(padding, padding, imgSize, imgSize);
          const filteredData = applyPolaroidFilter(imageData);
          ctx.putImageData(filteredData, padding, padding);
        } catch (e) {
          // Fallback
          ctx.save();
          ctx.filter = 'sepia(0.4) contrast(1.2) brightness(1.1) saturate(0.8)';
          ctx.drawImage(img, padding, padding, imgSize, imgSize);
          ctx.restore();
        }
      }

      // 4. Draw Caption
      const fontMap = {
        'Special Elite': 'Special Elite',
        'Caveat': 'Caveat',
        'Inter': 'sans-serif'
      };
      const fontFamily = fontMap[font] || 'Special Elite';

      if (caption) {
        ctx.fillStyle = '#333333';
        ctx.font = `40px "${fontFamily}"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Split caption into lines (max 2)
        const words = caption.split(' ');
        let lines = [];
        let currentLine = words[0];

        // Basic line breaking
        for (let i = 1; i < words.length; i++) {
          if (!currentLine) {
            currentLine = words[i];
            continue;
          }
          const testLine = currentLine + " " + words[i];
          const metrics = ctx.measureText(testLine);
          if (metrics.width < width - 100) { // 50px padding on each side
            currentLine = testLine;
          } else {
            lines.push(currentLine);
            currentLine = words[i];
          }
        }
        lines.push(currentLine);

        // Limit to 2 lines
        if (lines.length > 2) {
          // If we really messed up wrapping, force truncate or just take first 2
          lines = lines.slice(0, 2);
        }

        // Draw lines
        const lineHeight = 50;
        const startY = imgSize + padding + 80; // Increased spacing (was 50)

        lines.forEach((line, index) => {
          // If 2 lines, shift first one up slightly to center the group
          const yOffset = lines.length > 1 ? (index * lineHeight) - (lineHeight * 0.5) : 0;
          ctx.fillText(line, width / 2, startY + yOffset);
        });
      }

      // 5. Draw Timestamp
      const timestampToUse = capturedTimestamp || new Date();
      if (timestampMode === 'overlay') {
        const dateStr = timestampToUse.toLocaleDateString().replace(/\//g, '.'); // 12.12.2025
        const timeStr = timestampToUse.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        const timestampText = `${dateStr} ${timeStr}`;

        ctx.font = '32px "Courier New", monospace'; // Increased from 24px
        ctx.fillStyle = '#ff9966'; // Burnt orange/digital look
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4; // Softer shadow for "Saved" look
        ctx.textAlign = 'right';
        ctx.fillText(timestampText, imgSize + padding - 20, imgSize + padding - 20);
        ctx.shadowBlur = 0; // Reset
      } else if (timestampMode === 'text') {
        const dateStr = timestampToUse.toLocaleDateString();
        const timeStr = timestampToUse.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const timestampText = `${dateStr} • ${timeStr}`;

        // Match user's font but smaller
        ctx.font = `24px "${fontFamily}"`; // Same font as caption, slightly smaller
        ctx.fillStyle = '#666666';
        ctx.textAlign = 'center';

        // Always position at bottom of white border
        const yPos = height - 40; // Bottom of white border

        ctx.fillText(timestampText, width / 2, yPos);
      }

      const finalImage = canvas.toDataURL('image/jpeg', 0.8);

      // Save/Update in Storage (Auto-save)
      if (currentPhotoId) {
        updatePhoto(currentPhotoId, {
          data: finalImage,
          raw: photo, // Keep raw for re-editing
          caption,
          filterEnabled,
          font,
          timestampMode,
          timestamp: new Date().toISOString()
        });
      } else {
        const newId = await addPhoto({
          data: finalImage,
          raw: photo,
          caption,
          filterEnabled,
          font,
          timestampMode,
          timestamp: new Date().toISOString()
        });
        setCurrentPhotoId(newId);
      }

      // 5. Download / Share if requested
      if (download) {
        canvas.toBlob(async (blob) => {
          const timestamp = Date.now();
          const safeCaption = caption ? caption.replace(/[^a-z0-9]/gi, '_').toLowerCase() : '';
          const filename = safeCaption ? `digitalpolaroid_${safeCaption}.jpg` : `digitalpolaroid_${timestamp}.jpg`;
          const file = new File([blob], filename, { type: 'image/jpeg' });

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({ files: [file] });
            } catch (err) {
              if (err.name !== 'AbortError') saveAsDownload(canvas, filename);
            }
          } else {
            saveAsDownload(canvas, filename);
          }
        }, 'image/jpeg', 0.9);
      }
    } catch (err) {
      console.error("Error generating polaroid:", err);
    }
  };

  const handleSave = () => saveCurrentPolaroid(true);

  // Toggle Timestamp Mode
  const toggleTimestampMode = () => {
    const modes = ['overlay', 'text', 'off'];
    const nextIndex = (modes.indexOf(timestampMode) + 1) % modes.length;
    setTimestampMode(modes[nextIndex]);
  };

  // Auto-save effect: Trigger when entering result mode or changing caption/settings
  useEffect(() => {
    if (mode === 'result' && photo) {
      const timer = setTimeout(() => {
        saveCurrentPolaroid(false);
      }, 1000); // Debounce 1s
      return () => clearTimeout(timer);
    }
  }, [mode, photo, caption, filterEnabled, font, timestampMode, currentPhotoId]);

  const saveAsDownload = (canvas, filename) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/jpeg', 0.9);
    link.click();
  };

  const enableCamera = () => {
    setCameraEnabled(true);
    localStorage.setItem('has_used_camera', 'true');
  };

  const reset = () => {
    setPhoto(null);
    setCaption('');
    setMode('camera');
    // Keep camera enabled so we don't show the welcome screen again
  };

  const handleSelectRecent = (recentPhoto) => {
    // If we have proper structure
    if (recentPhoto.raw) {
      setPhoto(recentPhoto.raw);
      setCaption(recentPhoto.caption || '');
      if (recentPhoto.font) setFont(recentPhoto.font);
      if (recentPhoto.filterEnabled !== undefined) setFilterEnabled(recentPhoto.filterEnabled);
    } else {
      // Legacy: treat as raw, but it's likely already framed. 
      // Best effort: load it, clear caption (since it's baked in)
      setPhoto(recentPhoto.data);
      setCaption('');
    }
    // Always set ID to enable updates instead of duplication
    setCurrentPhotoId(recentPhoto.id);
    setMode('result');
  };

  const handleFlash = () => {
    setTriggerVisualFlash(true);
    setTimeout(() => setTriggerVisualFlash(false), 300);
  };

  // Update current time every second for live timestamps
  useEffect(() => {
    if (mode === 'camera' && timestampMode === 'text') {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
    }
  }, [mode, timestampMode]);

  const getCurrentTimestampDisplay = () => {
    const timeToDisplay = (mode === 'result' && capturedTimestamp) ? capturedTimestamp : currentTime;

    if (timestampMode === 'text') {
      return `${timeToDisplay.toLocaleDateString()} • ${timeToDisplay.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    }
    return 'Ready to snap';
  };

  return (
    <main>
      <header style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Digital Polaroid</h1>
        {!('ontouchstart' in window || navigator.maxTouchPoints > 0) && (
          <p style={{ color: '#666', fontSize: '0.8rem', margin: '0.5rem 0 0 0' }}>
            Works best on mobile devices
          </p>
        )}
      </header>

      {mode === 'camera' && !cameraEnabled && (
        <div style={{ width: '100%', maxWidth: '400px', paddingBottom: '80px' }}>
          <PolaroidFrame caption="Ready to snap">
            <div style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '1.5rem',
              textAlign: 'center',
              gap: '1rem',
              overflow: 'hidden'
            }}>
              <div style={{ fontSize: '3rem', marginTop: '0.5rem' }}>📷</div>
              <h2 style={{
                color: 'white',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                margin: 0
              }}>
                Welcome to Digital Polaroid
              </h2>
              <p style={{
                color: '#aaa',
                fontSize: '0.9rem',
                lineHeight: '1.5',
                margin: 0,
                maxWidth: '280px'
              }}>
                Tap below to begin capturing memories
              </p>
              <button
                onClick={enableCamera}
                style={{
                  padding: '0.8rem 1.6rem',
                  background: 'var(--color-accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginTop: '0.5rem'
                }}
                onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
              >
                Turn on camera
              </button>

              <div style={{ marginTop: '1rem', padding: '0 1rem' }}>
                <p style={{ color: '#666', fontSize: '0.75rem', margin: 0 }}>
                  <strong>iOS Tip:</strong> To skip asking for permission:
                  <br />Tap 'AA' &gt; Website Settings &gt; Camera &gt; Allow
                </p>
              </div>

            </div>
          </PolaroidFrame>

          {/* Timestamp Toggle (Outside Frame) */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
            <button
              onClick={toggleTimestampMode}
              style={{
                background: '#333',
                color: 'white',
                border: '1px solid #444',
                borderRadius: '20px',
                padding: '0.5rem 1rem',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer'
              }}
            >
              <span>{timestampMode === 'off' ? '📅' : (timestampMode === 'overlay' ? '📼' : 'Aa')}</span>
              <span>Timestamp: {timestampMode === 'off' ? 'Off' : (timestampMode === 'overlay' ? 'Overlay' : 'Text')}</span>
            </button>
          </div>

          <RecentGallery
            photos={photos}
            onSelect={handleSelectRecent}
            onClear={clearPhotos}
          />
        </div>
      )}

      {mode === 'camera' && cameraEnabled && (
        <div style={{ width: '100%', maxWidth: '400px', paddingBottom: '80px' }}>
          <PolaroidFrame caption={timestampMode === 'text' ? getCurrentTimestampDisplay() : "Ready to snap"}>
            <Camera
              onCapture={handleCapture}
              filterEnabled={filterEnabled}
              onToggleFilter={() => setFilterEnabled(!filterEnabled)}
              shouldStart={cameraEnabled}
              onFlash={handleFlash}
              timestampMode={timestampMode}
            />
          </PolaroidFrame>

          {/* Timestamp Toggle (Outside Frame) */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
            <button
              onClick={toggleTimestampMode}
              style={{
                background: '#333',
                color: 'white',
                border: '1px solid #444',
                borderRadius: '20px',
                padding: '0.5rem 1rem',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer'
              }}
            >
              <span>{timestampMode === 'off' ? '📅' : (timestampMode === 'overlay' ? '📼' : 'Aa')}</span>
              <span>Timestamp: {timestampMode === 'off' ? 'Off' : (timestampMode === 'overlay' ? 'Overlay' : 'Text')}</span>
            </button>
          </div>

          <RecentGallery
            photos={photos}
            onSelect={handleSelectRecent}
            onClear={clearPhotos}
          />
        </div>
      )}

      {mode === 'developing' && (
        <div style={{ width: '100%', maxWidth: '400px', animation: 'pulse 2s infinite' }}>
          <PolaroidFrame caption="Developing...">
            <div style={{
              width: '100%',
              height: '100%',
              background: '#111',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <img
                src={photo}
                alt="Developing"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'brightness(0) blur(10px)',
                  animation: 'develop 10s forwards ease-in-out'
                }}
              />
            </div>
          </PolaroidFrame>
        </div>
      )}

      {mode === 'result' && (
        <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '80px' }}>
          {/* The Frame to Capture */}
          <div ref={frameRef} style={{ display: 'inline-block', position: 'relative' }}>
            <PolaroidFrame caption={
              <div style={{ position: 'relative', width: '100%' }}>
                <textarea
                  value={caption}
                  onChange={handleCaptionChange}
                  placeholder="Write a caption..."
                  maxLength={50}
                  rows={2}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontFamily: font,
                    textAlign: 'center',
                    width: '100%',
                    fontSize: '1.2rem',
                    outline: 'none',
                    color: '#333',
                    resize: 'none',
                    overflow: 'hidden',
                    lineHeight: '1.2',
                    height: '3rem' // Enforce 2 lines height
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '-25px', // Push into the bottom padding of the polaroid
                  right: '0px',
                  fontSize: '0.65rem',
                  color: '#aaa',
                  fontFamily: 'sans-serif',
                  pointerEvents: 'none'
                }}>
                  {50 - caption.length}
                </div>
              </div>
            }>
              <img
                src={photo}
                alt="Developed"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: filterEnabled ? 'sepia(0.4) contrast(1.2) brightness(1.1) saturate(0.8)' : 'none'
                }}
              />

              {/* Timestamp Overlay for Result Mode - NOW INSIDE IMAGE AREA */}
              {timestampMode === 'overlay' && capturedTimestamp && (
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '15px',
                  fontFamily: '"Courier New", monospace',
                  color: '#ff9966',
                  fontSize: '0.9rem', // Reduced to match new scale
                  textShadow: '1px 1px 2px #000000',
                  pointerEvents: 'none',
                  zIndex: 10
                }}>
                  {capturedTimestamp.toLocaleDateString().replace(/\//g, '.')} {capturedTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                </div>
              )}
            </PolaroidFrame>

            {/* Text Timestamp for Result Mode - Bottom of white border */}
            {timestampMode === 'text' && capturedTimestamp && (
              <div style={{
                position: 'absolute',
                bottom: '20px', // Bottom of white border
                left: '50%',
                transform: 'translateX(-50%)',
                fontFamily: font,
                fontSize: '0.9rem',
                color: '#666',
                pointerEvents: 'none',
                zIndex: 10,
                whiteSpace: 'nowrap'
              }}>
                {capturedTimestamp.toLocaleDateString()} • {capturedTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            )}
          </div>

          {/* Controls */}
          <div style={{ background: '#222', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#aaa' }}>Font Style</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {fonts.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setFont(f.value)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      background: font === f.value ? 'var(--color-accent)' : '#444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontFamily: f.value
                    }}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Timestamp Toggle (Result Mode) */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={toggleTimestampMode}
              style={{
                background: '#333',
                color: 'white',
                border: '1px solid #444',
                borderRadius: '20px',
                padding: '0.4rem 0.8rem',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer'
              }}
            >
              <span>{timestampMode === 'off' ? '📅' : (timestampMode === 'overlay' ? '📼' : 'Aa')}</span>
              <span>Timestamp: {timestampMode === 'off' ? 'Off' : (timestampMode === 'overlay' ? 'Overlay' : 'Text')}</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={reset} style={{ flex: 1, padding: '0.8rem', background: '#444', color: 'white', border: 'none', borderRadius: '4px' }}>
              New Photo
            </button>
            <button onClick={handleSave} style={{ flex: 1, padding: '0.8rem', background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
              Share Polaroid
            </button>
          </div>
        </div>
      )}
      <style>{`
        @keyframes develop {
          0% { filter: brightness(0) blur(20px) grayscale(1); }
          50% { filter: brightness(0.5) blur(5px) grayscale(0.5); }
          100% { filter: brightness(1) blur(0) grayscale(0) sepia(0.4) contrast(1.2); }
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Global Flash Overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'white',
        opacity: triggerVisualFlash ? 1 : 0,
        pointerEvents: 'none',
        transition: 'opacity 0.1s ease-out',
        zIndex: 99999
      }}
      />
      <InstallPrompt />
    </main>
  )
}

export default App
