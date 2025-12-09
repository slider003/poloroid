import React from 'react';
import { useCamera } from '../hooks/useCamera';

const Camera = ({ onCapture, filterEnabled, onToggleFilter }) => {
  const { videoRef, error, isReady, takePhoto, switchCamera } = useCamera();

  const handleCapture = () => {
    const photo = takePhoto();
    if (photo) {
      onCapture(photo);
    }
  };

  if (error) {
    return <div className="error">Error accessing camera: {error.message}</div>;
  }

  return (
    <div className="camera-container">
      <div className="viewfinder">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: filterEnabled ? 'sepia(0.4) contrast(1.2) brightness(1.1) saturate(0.8)' : 'none'
          }}
        />
      </div>

      {/* Filter Toggle (Left) */}
      <button
        className="control-btn filter-btn"
        onClick={onToggleFilter}
        aria-label="Toggle filter"
        style={{ opacity: filterEnabled ? 1 : 0.5 }}
      >
        ✨
      </button>

      {/* Shutter (Center) */}
      <button
        className="shutter-btn"
        onClick={handleCapture}
        disabled={!isReady}
        aria-label="Take photo"
      >
        <div className="shutter-inner"></div>
      </button>

      {/* Switch Camera (Right) */}
      <button
        className="control-btn switch-btn"
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
        .viewfinder {
          width: 100%;
          height: 100%;
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
          transition: transform 0.1s;
          z-index: 2;
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
          bottom: 30px;
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
          transition: background 0.2s;
          z-index: 2;
          cursor: pointer;
        }
        .control-btn:hover {
          background: rgba(255, 255, 255, 0.4);
        }
        .switch-btn {
          right: 20px;
        }
        .filter-btn {
          left: 20px;
        }
      `}</style>
    </div>
  );
};

export default Camera;
