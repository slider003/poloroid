import React from 'react';

const PolaroidFrame = ({ children, caption, className = '' }) => {
    return (
        <div className={`polaroid-frame ${className}`}>
            <div className="polaroid-image-area">
                {children}
            </div>
            <div className="polaroid-caption">
                {caption}
            </div>
            <style>{`
        .polaroid-frame {
          background: var(--color-frame);
          padding: 1rem 1rem 3rem 1rem;
          box-shadow: var(--shadow-soft);
          display: inline-block;
          transform: rotate(-1deg);
          transition: transform 0.3s ease;
          max-width: 100%;
        }
        .polaroid-frame:hover {
          transform: rotate(0deg) scale(1.01);
          box-shadow: var(--shadow-hard);
          z-index: 10;
        }
        .polaroid-image-area {
          background: #222;
          width: 300px;
          height: 300px;
          overflow: hidden;
          border: 1px solid #eee;
        }
        .polaroid-caption {
          font-family: 'Courier Prime', monospace; /* Fallback if global font fails */
          color: #333;
          margin-top: 1rem;
          text-align: center;
          min-height: 1.5em;
        }
        @media (max-width: 350px) {
          .polaroid-image-area {
            width: 100%;
            aspect-ratio: 1/1;
            height: auto;
          }
        }
      `}</style>
        </div>
    );
};

export default PolaroidFrame;
