import React from 'react';

const RecentGallery = ({ photos, onSelect, onClear }) => {
  if (!photos || photos.length === 0) return null;

  return (
    <div className="gallery-container">
      <div className="gallery-header">
        <h3>Recent</h3>
        <button onClick={onClear} className="clear-btn" aria-label="Clear recent photos">
          🗑️
        </button>
      </div>

      <div className="gallery-scroll">
        <div className="gallery-items">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="gallery-item"
              onClick={() => onSelect(photo)}
              style={{ zIndex: photos.length - index }}
            >
              <img src={photo.data} alt={`Recent polaroid ${index + 1}`} />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .gallery-container {
          width: 100%;
          max-width: 400px;
          margin-top: 1rem;
          padding: 0 1rem;
          box-sizing: border-box;
        }
        
        .gallery-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          color: #888;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .gallery-header h3 {
          margin: 0;
          font-weight: normal;
          font-size: 0.8rem;
        }

        .clear-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          opacity: 0.6;
          transition: opacity 0.2s;
          padding: 0.2rem;
        }

        .clear-btn:hover {
          opacity: 1;
        }

        .gallery-scroll {
          width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          padding-bottom: 1rem;
          /* Hide scrollbar */
          scrollbar-width: none;  /* Firefox */
          -ms-overflow-style: none;  /* IE and Edge */
        }

        .gallery-scroll::-webkit-scrollbar {
          display: none;
        }

        .gallery-items {
          display: flex;
          padding-left: 0.5rem;
          min-width: min-content; /* Ensure container expands */
        }

        .gallery-item {
          flex: 0 0 80px; /* Fixed width for cards */
          height: 96px; /* Aspect ratio roughly matching polaroid */
          /* Removed background and padding to avoid double-polaroid effect */
          /* background: white; */
          /* padding: 4px 4px 12px 4px; */ 
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transform: rotate(-2deg);
          margin-right: -40px; /* Negative margin for overlap */
          transition: transform 0.2s, margin 0.2s, z-index 0.2s;
          cursor: pointer;
          position: relative;
          box-sizing: border-box;
        }

        .gallery-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          filter: sepia(0.2);
        }

        /* Hover effect: Pop out */
        .gallery-item:hover {
          transform: rotate(0) scale(1.1) translateY(-10px);
          z-index: 100 !important;
          margin-right: 10px; /* Make space */
          margin-left: 10px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.5);
        }

        /* Rotate alternate items differently for natural look */
        .gallery-item:nth-child(even) {
          transform: rotate(2deg);
        }
        
        .gallery-item:hover:nth-child(even) {
          transform: rotate(0) scale(1.1) translateY(-10px);
        }
      `}</style>
    </div>
  );
};

export default RecentGallery;
