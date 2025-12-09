import { useState, useRef, useEffect } from 'react'
import html2canvas from 'html2canvas'
import './index.css'
import Camera from './components/Camera'
import PolaroidFrame from './components/PolaroidFrame'
import RecentGallery from './components/RecentGallery'
import { applyPolaroidFilter } from './utils/filters'
import { useRecentPhotos } from './hooks/useRecentPhotos'
import { wasCameraAccessGranted } from './hooks/useCamera'

function App() {
  const [mode, setMode] = useState('camera'); // camera, developing, result
  const [photo, setPhoto] = useState(null);
  const [caption, setCaption] = useState('');
  const [font, setFont] = useState('Special Elite'); // Default retro font
  const [filterEnabled, setFilterEnabled] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(() => wasCameraAccessGranted());
  const [currentPhotoId, setCurrentPhotoId] = useState(null);
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
      if (caption) {
        ctx.fillStyle = '#333333';
        const fontMap = {
          'Special Elite': 'Special Elite',
          'Caveat': 'Caveat',
          'Inter': 'sans-serif'
        };
        const fontFamily = fontMap[font] || 'Special Elite';
        ctx.font = `40px "${fontFamily}"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(caption, width / 2, height - (bottomPadding / 2) + 20);
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
          timestamp: new Date().toISOString()
        });
      } else {
        const newId = await addPhoto({
          data: finalImage,
          raw: photo,
          caption,
          filterEnabled,
          font,
          timestamp: new Date().toISOString()
        });
        setCurrentPhotoId(newId);
      }

      // 5. Download / Share if requested
      if (download) {
        canvas.toBlob(async (blob) => {
          const timestamp = Date.now();
          const safeCaption = caption ? caption.replace(/[^a-z0-9]/gi, '_').toLowerCase() : '';
          const filename = safeCaption ? `polaroid_${safeCaption}.jpg` : `polaroid-${timestamp}.jpg`;
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

  // Auto-save effect: Trigger when entering result mode or changing caption/settings
  useEffect(() => {
    if (mode === 'result' && photo) {
      const timer = setTimeout(() => {
        saveCurrentPolaroid(false);
      }, 1000); // Debounce 1s
      return () => clearTimeout(timer);
    }
  }, [mode, photo, caption, filterEnabled, font, currentPhotoId]);

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
    setShowConfirmDialog(true);
  };

  const confirmReset = () => {
    setShowConfirmDialog(false);
    setPhoto(null);
    setCaption('');
    setMode('camera');
    // Keep camera enabled so we don't show the welcome screen again
  };

  const cancelReset = () => {
    setShowConfirmDialog(false);
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
        <div style={{ width: '100%', maxWidth: '400px' }}>
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

          <RecentGallery
            photos={photos}
            onSelect={handleSelectRecent}
            onClear={clearPhotos}
          />
        </div>
      )}

      {mode === 'camera' && cameraEnabled && (
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <PolaroidFrame caption="Ready to snap">
            <Camera
              onCapture={handleCapture}
              filterEnabled={filterEnabled}
              onToggleFilter={() => setFilterEnabled(!filterEnabled)}
              shouldStart={cameraEnabled}
            />
          </PolaroidFrame>

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
        <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* The Frame to Capture */}
          <div ref={frameRef} style={{ display: 'inline-block' }}>
            <PolaroidFrame caption={
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                maxLength={30}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontFamily: font,
                  textAlign: 'center',
                  width: '100%',
                  fontSize: '1.1rem',
                  outline: 'none',
                  color: '#333'
                }}
              />
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
            </PolaroidFrame>
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

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={reset} style={{ flex: 1, padding: '0.8rem', background: '#444', color: 'white', border: 'none', borderRadius: '4px' }}>
                New Photo
              </button>
              <button onClick={handleSave} style={{ flex: 1, padding: '0.8rem', background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
                Save Polaroid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Dialog */}
      {showConfirmDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#1a1a1a',
            border: '2px solid #444',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            animation: 'slideUp 0.3s ease-out'
          }}>
            <div style={{
              fontSize: '2.5rem',
              textAlign: 'center',
              marginBottom: '1rem'
            }}>📸</div>
            <h2 style={{
              color: 'white',
              textAlign: 'center',
              marginBottom: '1rem',
              fontSize: '1.3rem',
              fontWeight: 'bold'
            }}>Save Your Photo First</h2>
            <p style={{
              color: '#aaa',
              textAlign: 'center',
              marginBottom: '2rem',
              lineHeight: '1.5',
              fontSize: '1rem'
            }}>
              Make sure to save your photo before taking a new one.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={cancelReset}
                style={{
                  flex: 1,
                  padding: '0.9rem',
                  background: '#333',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#444'}
                onMouseOut={(e) => e.target.style.background = '#333'}
              >
                Go Back
              </button>
              <button
                onClick={confirmReset}
                style={{
                  flex: 1,
                  padding: '0.9rem',
                  background: 'var(--color-accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#0070f3'}
                onMouseOut={(e) => e.target.style.background = 'var(--color-accent)'}
              >
                Continue
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
    </main>
  )
}

export default App
