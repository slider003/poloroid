import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react'
import './index.css'

const saveAsDownload = (canvas, filename) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/jpeg', 0.9);
  link.click();
};
import Camera from './components/Camera'
import MomentFrame from './components/MomentFrame'
import RecentGallery from './components/RecentGallery'
import InstallPrompt from './components/InstallPrompt'
import { applyMomentFilter } from './utils/filters'
import { useRecentPhotos } from './hooks/useRecentPhotos'
import { wasCameraAccessGranted } from './hooks/useCamera'

function App() {
  const [mode, setMode] = useState('camera'); // camera, developing, result
  const [photo, setPhoto] = useState(null);
  const [caption, setCaption] = useState('');
  const [font, setFont] = useState('Special Elite'); // Default retro font

  // Enforce 2-line limit and character count
  const getMaxCaptionLength = (currentFont) => {
    return currentFont === 'Caveat' ? 70 : 50;
  };

  const handleCaptionChange = (e) => {
    const val = e.target.value;
    const lines = val.split('\n');
    const maxLen = getMaxCaptionLength(font);

    // Allow if:
    // 1. Max 2 lines (length <= 2)
    // 2. Max chars based on font
    if (lines.length <= 2 && val.length <= maxLen) {
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
  const [zoomInfo, setZoomInfo] = useState(null);
  const [immersiveTap, setImmersiveTap] = useState(false);
  const [globalCaptureTrigger, setGlobalCaptureTrigger] = useState(0);
  const [toast, setToast] = useState(null);
  const frameRef = useRef(null);
  const cameraAreaRef = useRef(null);
  const zoomSliderRef = useRef(null);
  const fileInputRef = useRef(null);

  const { photos, addPhoto, updatePhoto, clearPhotos } = useRecentPhotos();

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
    setImmersiveTap(false);
    setGlobalCaptureTrigger(0);

    // Visual wait (10s)
    setTimeout(() => {
      setMode('result');
    }, 10000);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setPhoto(event.target.result);
      // Use date/time of upload
      setCapturedTimestamp(new Date());
      setCurrentPhotoId(null);
      setMode('developing');
      setImmersiveTap(false);

      // Visual wait (10s)
      setTimeout(() => {
        setMode('result');
      }, 10000);
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be picked again
    e.target.value = '';
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };



  // Unified save function for both Auto-save and User Download
  const saveCurrentMoment = useCallback(async (download = false) => {
    if (!photo) return;

    try {
      // Manually create the moment image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const width = 1000;
      const height = 1200;
      const padding = 60;

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

      // Draw image with "cover" logic - crop to center
      const imgAspect = img.width / img.height;
      let drawX = padding;
      let drawY = padding;
      let drawWidth = imgSize;
      let drawHeight = imgSize;

      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = img.width;
      let sourceHeight = img.height;

      if (imgAspect > 1) {
        // Landscape - crop sides
        sourceWidth = img.height;
        sourceX = (img.width - sourceWidth) / 2;
      } else if (imgAspect < 1) {
        // Portrait - crop top/bottom
        sourceHeight = img.width;
        sourceY = (img.height - sourceHeight) / 2;
      }

      ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, drawX, drawY, drawWidth, drawHeight);

      // 3. Apply Pixel Filter
      if (filterEnabled) {
        try {
          const imageData = ctx.getImageData(padding, padding, imgSize, imgSize);
          const filteredData = applyMomentFilter(imageData);
          ctx.putImageData(filteredData, padding, padding);
        } catch {
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
          const filename = safeCaption ? `moments_${safeCaption}.jpg` : `moments_${timestamp}.jpg`;
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
      console.error("Error generating moment:", err);
    }
  }, [photo, caption, filterEnabled, font, timestampMode, capturedTimestamp, currentPhotoId, addPhoto, updatePhoto]);

  const handleSave = () => saveCurrentMoment(true);

  // Calculate zoom slider position to align with camera area
  useLayoutEffect(() => {
    const updatePosition = () => {
      if (!cameraAreaRef.current || !zoomSliderRef.current) return;

      if (!zoomInfo?.isReady) {
        zoomSliderRef.current.style.opacity = '0';
        zoomSliderRef.current.style.pointerEvents = 'none';
        return;
      }

      const rect = cameraAreaRef.current.getBoundingClientRect();
      const newTop = rect.top + (rect.height / 2);

      zoomSliderRef.current.style.top = `${newTop}px`;
      zoomSliderRef.current.style.opacity = '1';
      zoomSliderRef.current.style.pointerEvents = 'auto';
    };

    // Initial updates
    updatePosition();
    // Second pass to catch any late layout changes
    const timer = setTimeout(updatePosition, 100);

    const observer = new ResizeObserver(updatePosition);
    if (cameraAreaRef.current) observer.observe(cameraAreaRef.current);

    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition, { passive: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [zoomInfo, mode]);
  const toggleTimestampMode = () => {
    const modes = ['overlay', 'text', 'off'];
    const nextIndex = (modes.indexOf(timestampMode) + 1) % modes.length;
    setTimestampMode(modes[nextIndex]);
  };

  const toggleImmersiveMode = () => {
    const newVal = !immersiveTap;
    setImmersiveTap(newVal);

    setToast(newVal
      ? "Full-screen Tap Mode Enabled: tap anywhere to capture"
      : "Full-screen Tap Mode Disabled"
    );

    setTimeout(() => {
      setToast(null);
    }, 1500);
  };

  const handleGlobalClick = (e) => {
    if (immersiveTap && mode === 'camera' && photo === null) {
      // Avoid triggering if clicking any button (though they should be faded/disabled)
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
      setGlobalCaptureTrigger(prev => prev + 1);
    }
  };

  // Auto-save effect: Trigger when entering result mode or changing caption/settings
  useEffect(() => {
    if (mode === 'result' && photo) {
      const timer = setTimeout(() => {
        saveCurrentMoment(false);
      }, 1000); // Debounce 1s
      return () => clearTimeout(timer);
    }
  }, [mode, photo, caption, filterEnabled, font, timestampMode, currentPhotoId, saveCurrentMoment]);



  const enableCamera = () => {
    setCameraEnabled(true);
    localStorage.setItem('has_used_camera', 'true');
  };

  const reset = () => {
    setPhoto(null);
    setCaption('');
    setMode('camera');
    setImmersiveTap(false);
    setGlobalCaptureTrigger(0);
    // Keep camera enabled so we don't show the welcome screen again
  };

  const handleSelectRecent = (recentPhoto) => {
    // If we have proper structure
    if (recentPhoto.raw) {
      setPhoto(recentPhoto.raw);
      setCaption(recentPhoto.caption || '');
      if (recentPhoto.font) setFont(recentPhoto.font);
      if (recentPhoto.filterEnabled !== undefined) setFilterEnabled(recentPhoto.filterEnabled);
      if (recentPhoto.timestampMode) setTimestampMode(recentPhoto.timestampMode);
      if (recentPhoto.timestamp) setCapturedTimestamp(new Date(recentPhoto.timestamp));
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
    <main
      className={`app-container ${immersiveTap && mode === 'camera' && cameraEnabled ? 'immersive-active' : ''}`}
      onClick={handleGlobalClick}
    >
      <header className={`app-header ${immersiveTap && mode === 'camera' && cameraEnabled ? 'faded' : ''}`}>
        <h1>Moments</h1>
        {!('ontouchstart' in window || navigator.maxTouchPoints > 0) && (
          <p style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            Works best on mobile devices
          </p>
        )}
      </header>

      {mode === 'camera' && !cameraEnabled && (
        <div style={{ width: '100%', maxWidth: '400px', paddingBottom: '80px' }}>
          <MomentFrame caption="Ready to snap">
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
              <div style={{ fontSize: '3rem', marginTop: '0.5rem' }}>📸</div>
              <h2 style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>
                Welcome to Moments
              </h2>
              <p style={{ color: '#aaa', fontSize: '0.9rem', lineHeight: '1.5', margin: 0, maxWidth: '280px' }}>
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
          </MomentFrame>

          {/* Combined Timestamp and Import Toggle */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', margin: '1rem 0' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <div style={{ width: '130px', height: '40px', position: 'relative' }}>
                <button
                  onClick={toggleImmersiveMode}
                  className={`immersive-toggle-btn ${immersiveTap ? 'active-floating' : ''}`}
                  style={{
                    background: immersiveTap ? 'var(--color-accent)' : '#333',
                    color: 'white',
                    border: immersiveTap ? 'none' : '1px solid #444',
                    borderRadius: '40px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    zIndex: 10001,
                    transition: 'background 0.3s ease, border 0.3s ease, color 0.3s ease',
                    width: '100%',
                    height: '100%',
                    margin: 0,
                    whiteSpace: 'nowrap'
                  }}
                  title="Tap anywhere to capture"
                >
                  <span>{immersiveTap ? 'Tap Mode On' : 'Tap Mode Off'}</span>
                </button>
              </div>

              <div className={immersiveTap ? 'faded' : ''} style={{ transition: 'opacity 0.3s ease' }}>
                <button
                  onClick={toggleTimestampMode}
                  style={{
                    background: '#333',
                    color: 'white',
                    border: '1px solid #444',
                    borderRadius: '40px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer'
                  }}
                >
                  <span>Timestamp: {timestampMode === 'off' ? 'Off' : (timestampMode === 'overlay' ? 'Overlay' : 'Text')}</span>
                </button>
              </div>
            </div>

            <div className={immersiveTap ? 'faded' : ''} style={{ transition: 'opacity 0.3s ease' }}>
              <button
                onClick={triggerImport}
                style={{
                  background: '#222',
                  color: '#aaa',
                  border: '1px solid #333',
                  borderRadius: '20px',
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}
              >
                <span>Import Image</span>
              </button>
            </div>
          </div>

          <div className={immersiveTap ? 'faded' : ''} style={{ transition: 'opacity 0.3s ease' }}>
            <RecentGallery
              photos={photos}
              onSelect={handleSelectRecent}
              onClear={clearPhotos}
            />
          </div>
        </div>
      )}

      {mode === 'camera' && cameraEnabled && (
        <div style={{ width: '100%', maxWidth: '400px', paddingBottom: '80px', position: 'relative' }}>
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <MomentFrame caption={timestampMode === 'text' ? getCurrentTimestampDisplay() : "Ready to snap"}>
              <div ref={cameraAreaRef} style={{ width: '100%', height: '100%' }}>
                <Camera
                  onCapture={handleCapture}
                  filterEnabled={filterEnabled}
                  onToggleFilter={() => setFilterEnabled(!filterEnabled)}
                  shouldStart={cameraEnabled}
                  onFlash={handleFlash}
                  timestampMode={timestampMode}
                  onZoomUpdate={setZoomInfo}
                  immersiveTap={immersiveTap}
                  globalCaptureTrigger={globalCaptureTrigger}
                />
              </div>
            </MomentFrame>

            {zoomInfo?.zoomRange && (
              <div
                ref={zoomSliderRef}
                style={{
                  position: 'fixed',
                  right: '0',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0, 0, 0, 0.85)',
                  padding: '24px 8px 24px 12px',
                  borderRadius: '30px 0 0 30px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRight: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '15px',
                  zIndex: 1000,
                  boxShadow: '-4px 0 24px rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(12px)',
                  opacity: 0,
                  pointerEvents: 'none',
                  transition: 'opacity 0.2s ease-in-out'
                }}
              >
                <input
                  type="range"
                  min={zoomInfo.zoomRange.min}
                  max={zoomInfo.zoomRange.max}
                  step={zoomInfo.zoomRange.step}
                  value={zoomInfo.zoom}
                  onChange={(e) => zoomInfo.changeZoom(parseFloat(e.target.value))}
                  className="zoom-input"
                  style={{
                    WebkitAppearance: 'slider-vertical',
                    height: '240px',
                    width: '24px',
                    cursor: 'pointer'
                  }}
                />
                <div style={{ color: 'white', fontSize: '1rem', fontWeight: 'bold' }}>
                  {zoomInfo.zoom.toFixed(1)}x
                </div>
              </div>
            )}
          </div>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', margin: '1rem 0' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <div style={{ width: '130px', height: '40px', position: 'relative' }}>
                <button
                  onClick={toggleImmersiveMode}
                  className={`immersive-toggle-btn ${immersiveTap ? 'active-floating' : ''}`}
                  style={{
                    background: immersiveTap ? 'var(--color-accent)' : '#333',
                    color: 'white',
                    border: immersiveTap ? 'none' : '1px solid #444',
                    borderRadius: '40px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    zIndex: 10001,
                    transition: 'background 0.3s ease, border 0.3s ease, color 0.3s ease',
                    width: '100%',
                    height: '100%',
                    margin: 0,
                    whiteSpace: 'nowrap'
                  }}
                  title="Tap anywhere to capture"
                >
                  <span>{immersiveTap ? 'Tap Mode On' : 'Tap Mode Off'}</span>
                </button>
              </div>

              <div className={immersiveTap ? 'faded' : ''} style={{ transition: 'opacity 0.3s ease' }}>
                <button
                  onClick={toggleTimestampMode}
                  style={{
                    background: '#333',
                    color: 'white',
                    border: '1px solid #444',
                    borderRadius: '40px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer'
                  }}
                >
                  <span>Timestamp: {timestampMode === 'off' ? 'Off' : (timestampMode === 'overlay' ? 'Overlay' : 'Text')}</span>
                </button>
              </div>
            </div>

            <div className={immersiveTap ? 'faded' : ''} style={{ transition: 'opacity 0.3s ease' }}>
              <button
                onClick={triggerImport}
                style={{
                  background: '#222',
                  color: '#aaa',
                  border: '1px solid #333',
                  borderRadius: '20px',
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}
              >
                <span>Import Image</span>
              </button>
            </div>
          </div>

          <div className={immersiveTap ? 'faded' : ''} style={{ transition: 'opacity 0.3s ease' }}>
            <RecentGallery
              photos={photos}
              onSelect={handleSelectRecent}
              onClear={clearPhotos}
            />
          </div>
        </div>
      )}

      {mode === 'developing' && (
        <div style={{ width: '100%', maxWidth: '400px', animation: 'pulse 2s infinite' }}>
          <MomentFrame caption="Developing...">
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
          </MomentFrame>
        </div>
      )}

      {mode === 'result' && (
        <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '80px' }}>
          <div ref={frameRef} style={{ display: 'inline-block', position: 'relative' }}>
            <MomentFrame caption={
              <div style={{ position: 'relative', width: '100%' }}>
                <textarea
                  value={caption}
                  onChange={handleCaptionChange}
                  placeholder="Write a caption..."
                  maxLength={getMaxCaptionLength(font)}
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
                    height: '3rem'
                  }}
                />
                <div style={{ position: 'absolute', bottom: '-25px', right: '0px', fontSize: '0.65rem', color: '#aaa', fontFamily: 'sans-serif', pointerEvents: 'none' }}>
                  {getMaxCaptionLength(font) - caption.length}
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
              {timestampMode === 'overlay' && capturedTimestamp && (
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '15px',
                  fontFamily: '"Courier New", monospace',
                  color: '#ff9966',
                  fontSize: '0.9rem',
                  textShadow: '1px 1px 2px #000000',
                  pointerEvents: 'none',
                  zIndex: 10
                }}>
                  {capturedTimestamp.toLocaleDateString().replace(/\//g, '.')} {capturedTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                </div>
              )}
            </MomentFrame>
            {timestampMode === 'text' && capturedTimestamp && (
              <div style={{
                position: 'absolute',
                bottom: '20px',
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
                <span>Timestamp: {timestampMode === 'off' ? 'Off' : (timestampMode === 'overlay' ? 'Overlay' : 'Text')}</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={reset} style={{ flex: 1, padding: '0.8rem', background: '#444', color: 'white', border: 'none', borderRadius: '4px' }}>
                New Photo
              </button>
              <button onClick={handleSave} style={{ flex: 1, padding: '0.8rem', background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
                Share Moment
              </button>
            </div>
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
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .faded {
          opacity: 0 !important;
          pointer-events: none !important;
          transition: opacity 0.4s ease-out !important;
        }
        .active-floating {
          position: fixed !important;
          top: 20px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          width: 140px !important;
          height: 40px !important;
          margin: 0 !important;
          box-shadow: 0 4px 15px rgba(0,0,0,0.4) !important;
          animation: slideDownIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
          z-index: 10001 !important;
        }
        @keyframes slideDownIn {
          from { transform: translateX(-50%) translateY(-50px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        .immersive-active {
          cursor: pointer !important;
        }
        .zoom-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 32px;
          height: 32px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid #555;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        }
        .zoom-input::-moz-range-thumb {
          width: 32px;
          height: 32px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid #555;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        }
        .app-header {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 2rem;
          text-align: center;
          transition: opacity 0.4s ease-out;
        }
        .app-header h1 {
          margin: 0;
          font-size: 2.5rem;
          letter-spacing: -1px;
        }
        .controls-group {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          margin: 1rem 0;
          transition: opacity 0.3s ease;
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
      }} />

      <div className={immersiveTap && mode === 'camera' && cameraEnabled ? 'faded' : ''}>
        <InstallPrompt />
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImport}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '0.8rem 1.5rem',
          borderRadius: '30px',
          fontSize: '0.9rem',
          zIndex: 10000,
          textAlign: 'center',
          boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(5px)',
          animation: 'fadeIn 0.3s ease-out',
          maxWidth: '80%',
          pointerEvents: 'none'
        }}>
          {toast}
        </div>
      )}
    </main>
  );
}

export default App
