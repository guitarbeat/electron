import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Movie } from '../types';

interface SpinWheelProps {
  movies: Movie[];
  onClose: () => void;
}

const SPIN_DURATION_MS = 5000;
const COLORS = ['#2E3B4E', '#E74C3C', '#AF7AC5', '#5DADE2', '#FADBD8', '#C39BD3', '#A9CCE3', '#F5B7B1'];

const SpinWheel: React.FC<SpinWheelProps> = ({ movies, onClose }) => {
  const [status, setStatus] = useState<'idle' | 'spinning' | 'result'>('idle');
  const [rotation, setRotation] = useState(0);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  const numMovies = movies.length;
  const segmentAngle = 360 / numMovies;

  const handleSpin = useCallback(() => {
    if (status === 'spinning' || numMovies < 1) return;

    setStatus('spinning');
    
    const winnerIndex = Math.floor(Math.random() * numMovies);
    
    const spinRotations = 8 * 360;
    
    // Calculate where the middle of the winner's segment should land.
    // The top marker is effectively 0 degrees in our coordinate system.
    const targetAngle = -(segmentAngle * (winnerIndex + 0.5));
    
    // Add a small random offset so it doesn't land perfectly every time
    const randomOffset = (Math.random() - 0.5) * segmentAngle * 0.8;

    // To make re-spins feel continuous, we calculate the new rotation based on the old one.
    const currentRotation = rotation;
    // Reset to the nearest full circle, then add new rotations and the target angle.
    const newRotation = currentRotation - (currentRotation % 360) + spinRotations + targetAngle + randomOffset;
    
    setRotation(newRotation);

    setTimeout(() => {
      setStatus('result');
      setSelectedMovie(movies[winnerIndex]);
    }, SPIN_DURATION_MS);
  }, [status, numMovies, segmentAngle, rotation, movies]);


  const wheelStyle = useMemo(() => {
    const gradientColors = movies.map((_, i) => 
        `${COLORS[i % COLORS.length]} ${i * segmentAngle}deg, ${COLORS[i % COLORS.length]} ${(i + 1) * segmentAngle}deg`
    ).join(', ');
    
    return {
      background: `conic-gradient(${gradientColors})`,
      transform: `rotate(${rotation}deg)`,
      transition: status === 'spinning' ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.25, 1, 0.5, 1)` : 'none',
    };
  }, [movies, segmentAngle, rotation, status]);

  return (
    <div className="wheel-modal-overlay" onClick={onClose}>
      <div className="spin-wheel-container animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="spin-marker"></div>
        <div className="spin-wheel" style={wheelStyle}>
          {movies.map((movie, index) => {
            const angle = (index * segmentAngle) + (segmentAngle / 2);
            const isFlipped = angle > 90 && angle < 270;
            return (
              <div
                key={movie.id}
                className="wheel-text-container"
                style={{ transform: `rotate(${angle}deg)` }}
              >
                <span 
                  className="wheel-text"
                  style={{
                    transform: `translateY(-50%) ${isFlipped ? 'rotate(180deg)' : ''}`,
                  }}
                >
                  {movie.title}
                </span>
              </div>
            );
          })}
        </div>
        <div className="spin-hub"></div>

        {/* Content Overlay */}
        <div className="spin-content">
          {status === 'idle' && (
             <button onClick={handleSpin} className="cute-button cute-button-blue text-4xl font-heading">
                Spin!
            </button>
          )}
          {status === 'result' && selectedMovie && (
            <div className="result-overlay-content animate-fade-in">
                <h2 className="text-lg text-gray-300 mb-2">Tonight's Movie:</h2>
                <h3 className="text-3xl font-heading text-pink-300 mb-6" style={{textShadow: '1px 1px 2px #000'}}>
                  {selectedMovie.title}
                </h3>
                <div className="flex gap-4">
                  <button onClick={handleSpin} className="cute-button cute-button-blue">
                    Spin Again
                  </button>
                  <button onClick={onClose} className="cute-button cute-button-pink">
                    Close
                  </button>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpinWheel;
