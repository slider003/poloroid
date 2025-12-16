import React from 'react';
import { useCamera } from '../hooks/useCamera';

const Camera = ({ onCapture, filterEnabled, onToggleFilter, shouldStart = true, onFlash, timestampMode }) => {
  const { videoRef, error, isReady, takePhoto, switchCamera, supportsFlash, flashEnabled, toggleFlash, facingMode } = useCamera(shouldStart);
  const [isImmersive, setIsImmersive] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    if (timestampMode === 'overlay') {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
    }
  }, [timestampMode]);

  const handleCapture = async () => {
    // Trigger visual flash if flash is enabled (regardless of camera type)
    if (flashEnabled && onFlash) {
      onFlash();

      // Give the UI a moment to paint the white flash before taking the photo
      // Increased to 150ms to ensure the CSS transition (0.1s) completes
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    const photo = await takePhoto();
    if (photo) {
      onCapture(photo);
    }
  };

  const toggleImmersive = () => {
    setIsImmersive(!isImmersive);
  };

  const handlePreviewClick = () => {
    if (isImmersive) {
      setIsImmersive(false);
    }
  };

  if (error) {
    return <div className="error">Error accessing camera: {error.message}</div>;
  }

  return (
    <div className="camera-container">
      <div className="viewfinder" onClick={handlePreviewClick}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
            filter: filterEnabled ? 'sepia(0.4) contrast(1.2) brightness(1.1) saturate(0.8)' : 'none'
          }}
        />

        {/* Timestamp Overlay */}
        {timestampMode === 'overlay' && (
          <div className="timestamp-overlay">
            {currentTime.toLocaleDateString().replace(/\//g, '.')} {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
          </div>
        )}
      </div>

      {/* Immersive Mode Toggle (Top Left) */}
      <button
        className={`control-btn immersive-btn ${isImmersive ? 'hidden' : ''}`}
        onClick={toggleImmersive}
        aria-label="Immersive mode"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
        </svg>
      </button>

      {/* Flash Toggle (Top Right) */}

      <button
        className={`control-btn flash-btn ${isImmersive ? 'hidden' : ''} ${!flashEnabled ? 'flash-disabled' : ''}`}
        onClick={toggleFlash}
        aria-label="Toggle flash"
      >
        {flashEnabled ? '⚡' : '⚡'}
      </button>

      {/* Filter Toggle (Bottom Left, moved up slightly) */}
      <button
        className={`control-btn filter-btn ${isImmersive ? 'hidden' : ''}`}
        onClick={onToggleFilter}
        aria-label="Toggle filter"
        style={isImmersive ? {} : { opacity: filterEnabled ? 1 : 0.5 }}
      >
        ✨
      </button>

      {/* Timestamp Toggle (Bottom Left, next to filter) - REMOVED */}


      {/* Shutter (Center) */}
      <button
        className={`shutter-btn ${isImmersive ? 'immersive-shutter' : ''}`}
        onClick={handleCapture}
        disabled={!isReady}
        aria-label="Take photo"
      >
        <div className="shutter-inner"></div>
      </button>

      {/* Switch Camera (Bottom Right, moved up slightly) */}
      <button
        className={`control-btn switch-btn ${isImmersive ? 'hidden' : ''}`}
        onClick={switchCamera}
        aria-label="Switch camera"
      >
        🔄
      </button>

      <style>{`
        .camera-container {
          position: relative;
          width: 100%;
          aspect-ratio: 1/1;
          background: #000;
          overflow: hidden;
          border-radius: 4px;
        }
        .timestamp-overlay {
          position: absolute;
          bottom: 10px; /* Bottom of camera feed */
          right: 15px;
          font-family: 'Courier New', monospace;
          color: #ff9966;
          font-size: 0.9rem;
          text-shadow: 1px 1px 2px #000000;
          pointer-events: none;
          z-index: 1;
        }
        .viewfinder {
          width: 100%;
          height: 100%;
          cursor: ${isImmersive ? 'pointer' : 'default'};
        }
        .shutter-btn {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: white;
          border: 4px solid rgba(0,0,0,0.2);
          display: flex;
          justify-content: center;
          align-items: center;
          transition: transform 0.1s, opacity 0.3s;
          z-index: 2;
        }
        .immersive-shutter {
          opacity: 0.3;
          border-color: rgba(255,255,255,0.1);
        }
        .immersive-shutter:hover {
          opacity: 0.8;
        }
        .shutter-btn:active {
          transform: translateX(-50%) scale(0.95);
        }
        .shutter-inner {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #333;
        }
        .shutter-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .control-btn {
          position: absolute;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          display: flex;
          justify-content: center;
          align-items: center;
          color: white;
          font-size: 1.2rem;
          backdrop-filter: blur(4px);
          transition: background 0.2s, opacity 0.3s, transform 0.3s;
          z-index: 2;
          cursor: pointer;
        }
        .control-btn.hidden {
          opacity: 0;
          pointer-events: none;
          transform: scale(0.8);
        }
        .control-btn:hover {
          background: rgba(255, 255, 255, 0.4);
        }
        .switch-btn {
          bottom: 30px;
          right: 20px;
        }
        .filter-btn {
          bottom: 30px;
          left: 20px;
        }
        .immersive-btn {
          top: 20px;
          left: 20px;
        }
        .flash-btn {
          top: 20px;
          right: 20px;
        }
        .flash-disabled::after {
          content: '';
          position: absolute;
          width: 70%;
          height: 2px;
          background-color: #ff3b30;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(45deg);
          box-shadow: 0 0 2px rgba(0,0,0,0.5);
        }
      `}</style>
    </div>
  );
};

export default Camera;
