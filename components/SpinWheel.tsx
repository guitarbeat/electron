import React, { useMemo, useRef, useEffect } from 'react';
import { Movie } from '../types';
import { useSpinWheel } from '../hooks/useSpinWheel';

const COLORS = ['#2E3B4E', '#E74C3C', '#AF7AC5', '#5DADE2', '#FADBD8', '#C39BD3', '#A9CCE3', '#F5B7B1'];

const SpinWheel: React.FC<{ movies: Movie[], onClose: () => void }> = ({ movies, onClose }) => {
  const wheelRef = useRef<HTMLDivElement>(null);

  const { 
    status,
    currentRotation,
    selectedMovie, 
    handlePrimarySpin,
    handleSpinAgain,
    getPointerHandlers
  } = useSpinWheel(movies, wheelRef);

  const segmentAngle = 360 / movies.length;

  // Effect to close the modal on 'Escape' key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const wheelBackgroundStyle = useMemo(() => {
    if (movies.length === 0) return {};
    const gradientColors = movies.map((_, i) => 
        `${COLORS[i % COLORS.length]} ${i * segmentAngle}deg, ${COLORS[i % COLORS.length]} ${(i + 1) * segmentAngle}deg`
    ).join(', ');
    
    return {
      background: `conic-gradient(${gradientColors})`,
    };
  }, [movies, segmentAngle]);

  const currentMovie = useMemo(() => {
      if (movies.length === 0) return null;
      // The marker is at the top (270deg from the positive x-axis), so we adjust the angle
      // to calculate the currently selected segment based on rotation.
      const normalizedRotation = currentRotation % 360;
      const selectionAngle = (360 + 270 - normalizedRotation) % 360;
      const currentIndex = Math.floor(selectionAngle / segmentAngle);
      return movies[currentIndex];
  }, [currentRotation, movies, segmentAngle]);


  return (
    <div className="wheel-modal-overlay" onClick={onClose}>
      <div 
        className="modal-content-wrapper"
        onClick={e => e.stopPropagation()}
      >

        <div className="current-movie-display cute-card">
            <h3 className="current-movie-title break-words">
                {currentMovie ? currentMovie.title : 'Ready to spin?'}
            </h3>
        </div>

        <div 
          className={`spin-wheel-wrapper ${status === 'result' ? 'result-state' : ''}`}
          {...getPointerHandlers()}
        >
          <div className="spin-wheel-container">
            <div className="spin-marker"></div>
            <div 
              ref={wheelRef} 
              className="spin-wheel" 
              style={wheelBackgroundStyle}
            ></div>
            <div className="spin-hub"></div>
          </div>
          {status === 'idle' && (
            <div className="spin-content">
              <button 
                onClick={handlePrimarySpin}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="cute-button cute-button-blue text-4xl font-heading !w-32 !h-32 !rounded-full"
              >
                Spin!
              </button>
            </div>
          )}
        </div>
        
        {/* Result Display */}
        {status === 'result' && selectedMovie && (
          <div 
            className="result-display-container animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-gray-300">Tonight's Movie:</h2>
            <h3 className="font-heading text-pink-300 break-words" style={{textShadow: '1px 1px 2px #000'}}>
              {selectedMovie.title}
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <button onClick={handleSpinAgain} className="cute-button cute-button-blue w-full">
                Spin Again
              </button>
              <button onClick={onClose} className="cute-button cute-button-pink w-full">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpinWheel;