import { useState, useRef } from 'react'
import html2canvas from 'html2canvas'
import './index.css'
import Camera from './components/Camera'
import PolaroidFrame from './components/PolaroidFrame'

function App() {
  const [mode, setMode] = useState('camera'); // camera, developing, result
  const [photo, setPhoto] = useState(null);
  const [caption, setCaption] = useState('');
  const [font, setFont] = useState('Special Elite'); // Default retro font
  const frameRef = useRef(null);

  const fonts = [
    { name: 'Typewriter', value: 'Special Elite' },
    { name: 'Handwritten', value: 'Caveat' }, // Need to add this to index.html
    { name: 'Clean', value: 'Inter' } // Need to add this to index.html
  ];

  const handleCapture = (imageSrc) => {
    setPhoto(imageSrc);
    setMode('developing');

    // Visual wait (10s)
    setTimeout(() => {
      setMode('result');
    }, 10000);
  };

  const handleSave = async () => {
    if (frameRef.current) {
      try {
        const canvas = await html2canvas(frameRef.current, {
          backgroundColor: null,
          scale: 2 // Higher resolution
        });
        const link = document.createElement('a');
        link.download = `polaroid-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.error("Error saving image:", err);
      }
    }
  };

  const reset = () => {
    setPhoto(null);
    setCaption('');
    setMode('camera');
  };

  return (
    <main>
      <header style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <h1>Digital Polaroid</h1>
      </header>

      {mode === 'camera' && (
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <PolaroidFrame caption="Ready to snap">
            <Camera onCapture={handleCapture} />
          </PolaroidFrame>
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
                  filter: 'sepia(0.4) contrast(1.2) brightness(1.1) saturate(0.8)'
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
      `}</style>
    </main>
  )
}

export default App
