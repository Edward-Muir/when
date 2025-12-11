import React, { useState, useEffect } from 'react';
import { Hourglass, Compass, Crown, Feather, Globe, Scroll } from 'lucide-react';

const icons = [Hourglass, Compass, Crown, Feather, Globe, Scroll];

export const BackgroundPattern: React.FC = () => {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 375,
    height: typeof window !== 'undefined' ? window.innerHeight : 667,
  });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', updateDimensions);
    window.addEventListener('orientationchange', () => {
      // Delay to allow orientation change to complete
      setTimeout(updateDimensions, 100);
    });

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // On mobile, use 25% of viewport width per cell (~4 icons across)
  // On desktop, use 100px fixed (looks good at ~16 icons across on 1600px screen)
  const isMobile = dimensions.width < 768;
  const cellSize = isMobile ? Math.floor(dimensions.width / 4) : 100;
  const iconSize = isMobile ? 24 : 32;

  // Calculate cols/rows to fill viewport (+2 for offset/overflow coverage)
  const cols = Math.ceil(dimensions.width / cellSize) + 2;
  const rows = Math.ceil(dimensions.height / cellSize) + 2;

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <div
        className="relative"
        style={{
          width: '100vw',
          height: 'calc(var(--vh, 1vh) * 100)',
        }}
      >
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex"
            style={{
              marginLeft: rowIndex % 2 === 1 ? `${cellSize / 2}px` : '0',
            }}
          >
            {Array.from({ length: cols }).map((_, colIndex) => {
              const iconIndex = (rowIndex * cols + colIndex) % icons.length;
              const Icon = icons[iconIndex];
              return (
                <div
                  key={colIndex}
                  className="flex items-center justify-center"
                  style={{
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                  }}
                >
                  <Icon
                    size={iconSize}
                    strokeWidth={1.5}
                    style={{
                      color: '#C4A574',
                      opacity: 0.15,
                    }}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BackgroundPattern;
