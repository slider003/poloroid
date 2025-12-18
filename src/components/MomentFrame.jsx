import React from 'react';

const MomentFrame = ({ children, caption, className = '' }) => {
  return (
    <div className={`moment-frame ${className}`}>
      <div className="moment-image-area">
        {children}
      </div>
      <div className="moment-caption">
        {caption}
      </div>
      <style>{`
        .moment-frame {
          background: var(--color-frame);
          padding: 1rem 1rem 3rem 1rem;
          box-shadow: var(--shadow-soft);
          display: inline-block;
          transform: rotate(-1deg);
          transition: transform 0.3s ease;
          max-width: 100%;
        }
        .moment-frame:hover {
          transform: rotate(0deg) scale(1.01);
          box-shadow: var(--shadow-hard);
          z-index: 10;
        }
        .moment-image-area {
          background: #222;
          width: 300px;
          height: 300px;
          overflow: hidden;
          border: 1px solid #eee;
          position: relative;
        }
        .moment-caption {
          font-family: 'Courier Prime', monospace; /* Fallback if global font fails */
          color: #333;
          margin-top: 1rem;
          text-align: center;
          min-height: 1.5em;
        }
        @media (max-width: 350px) {
          .moment-image-area {
            width: 100%;
            aspect-ratio: 1/1;
            height: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default MomentFrame;
