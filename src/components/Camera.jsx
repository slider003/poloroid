import React from 'react';
import { useCamera } from '../hooks/useCamera';

const Camera = ({ onCapture }) => {
  const { videoRef, error, isReady, takePhoto } = useCamera();

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
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
      <button
        className="shutter-btn"
        onClick={handleCapture}
        disabled={!isReady}
        aria-label="Take photo"
      >
        <div className="shutter-inner"></div>
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
      `}</style>
    </div>
  );
};

export default Camera;
