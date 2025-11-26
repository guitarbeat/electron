import React, { useMemo, useRef, useEffect } from 'react';
import { Movie } from '../types';
import { useSpinWheel } from '../hooks/useSpinWheel';
import { useUser } from '../context/UserContext';
import { LockIcon, CalendarIcon, SyncIcon, CheckIcon, Spinner } from './icons';

const COLORS = ['#2E3B4E', '#E74C3C', '#AF7AC5', '#5DADE2', '#FADBD8', '#C39BD3', '#A9CCE3', '#F5B7B1'];

const SpinWheel: React.FC<{ movies: Movie[], onClose: () => void }> = ({ movies, onClose }) => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useUser();

  const { 
    status,
    currentRotation,
    selectedMovie,
    hasSpunToday,
    todaySpinData,
    saveError,
    handlePrimarySpin,
    handleSpinAgain,
    getPointerHandlers
  } = useSpinWheel(movies, wheelRef, currentUser);

  const segmentAngle = movies.length > 0 ? 360 / movies.length : 0;

  // Effect to close the modal on 'Escape' key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // * Don't allow closing during spin, loading, or saving
        if (status === 'spinning' || status === 'loading' || status === 'saving') {
          return;
        }
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, status]);

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
      if (movies.length === 0 || segmentAngle === 0) return null;
      // The marker is at the top (270deg from the positive x-axis), so we adjust the angle
      // to calculate the currently selected segment based on rotation.
      const normalizedRotation = currentRotation % 360;
      const selectionAngle = (360 + 270 - normalizedRotation) % 360;
      const currentIndex = Math.floor(selectionAngle / segmentAngle);
      const safeIndex = Math.max(0, Math.min(currentIndex, movies.length - 1));
      return movies[safeIndex];
  }, [currentRotation, movies, segmentAngle]);


  // * Prevent closing during critical states
  const handleOverlayClick = (e: React.MouseEvent) => {
    // * Don't allow closing during spin, loading, or while saving
    if (status === 'spinning' || status === 'loading' || status === 'saving') {
      return;
    }
    onClose();
  };

  return (
    <div className="wheel-modal-overlay" onClick={handleOverlayClick}>
      <div 
        className="modal-content-wrapper"
        onClick={e => e.stopPropagation()}
      >

        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <Spinner className="h-12 w-12 text-pink-400" />
            <p className="text-gray-300 text-lg font-heading">Checking today's spin...</p>
            <p className="text-gray-500 text-sm">Please wait...</p>
          </div>
        )}

        {status === 'saving' && (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <Spinner className="h-12 w-12 text-blue-400" />
            <p className="text-gray-300 text-lg font-heading">Saving your spin...</p>
            <p className="text-gray-500 text-sm">Syncing with your partner...</p>
          </div>
        )}

        {status !== 'loading' && movies.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <p className="text-gray-300 text-lg font-heading">No movies available</p>
            <p className="text-gray-400 text-sm">Add some movies to your watchlist first!</p>
            <button onClick={onClose} className="cute-button cute-button-pink mt-4">
              Close
            </button>
          </div>
        )}

        {status !== 'loading' && status !== 'saving' && movies.length > 0 && (
          <>
            <div className="current-movie-display cute-card">
                <h3 className="current-movie-title break-words">
                    {status === 'result' && selectedMovie 
                      ? selectedMovie.title 
                      : currentMovie 
                        ? currentMovie.title 
                        : 'Ready to spin?'}
                </h3>
                {status === 'result' && selectedMovie && (
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-900/30 border border-green-500/50">
                      <CheckIcon className="h-3 w-3 text-green-400" />
                      <span className="text-xs text-green-300 font-heading">Today's Pick</span>
                    </div>
                  </div>
                )}
            </div>

            <div 
              className={`spin-wheel-wrapper ${status === 'result' ? 'result-state' : ''} ${hasSpunToday ? 'locked-state' : ''}`}
              {...(hasSpunToday ? {} : getPointerHandlers())}
            >
              <div className="spin-wheel-container">
                {hasSpunToday && (
                  <div className="lock-overlay">
                    <div className="lock-icon-wrapper">
                      <LockIcon />
                    </div>
                  </div>
                )}
                <div className="spin-marker"></div>
                <div 
                  ref={wheelRef} 
                  className={`spin-wheel ${hasSpunToday ? 'grayscale' : ''}`}
                  style={wheelBackgroundStyle}
                ></div>
                <div className="spin-hub"></div>
              </div>
              {status === 'idle' && !hasSpunToday && (
                <div className="spin-content">
                  <button 
                    onClick={handlePrimarySpin}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="cute-button cute-button-blue text-4xl font-heading !w-32 !h-32 !rounded-full animate-pulse"
                  >
                    Spin!
                  </button>
                </div>
              )}
              {hasSpunToday && status === 'idle' && (
                <div className="spin-content locked-content">
                  <div className="flex flex-col items-center gap-3">
                    <LockIcon />
                    <p className="text-gray-300 text-center font-heading text-lg">Already spun today!</p>
                    <p className="text-gray-400 text-sm">Come back tomorrow for another spin</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Result Display - Always show when there's a result */}
            {status === 'result' && selectedMovie && (
              <div 
                className="result-display-container animate-fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  <CheckIcon className="h-6 w-6 text-green-400 animate-pulse" />
                  <h2 className="text-gray-300 font-heading text-lg sm:text-xl">Tonight's Movie:</h2>
                </div>
                <h3 className="font-heading text-pink-300 break-words text-2xl sm:text-3xl mb-4 animate-fade-in" style={{textShadow: '1px 1px 2px #000'}}>
                  {selectedMovie.title}
                </h3>
                {saveError && (
                  <div className="mb-4 p-3 rounded-lg bg-yellow-900/30 border border-yellow-500/50">
                    <p className="text-yellow-300 text-sm text-center">{saveError}</p>
                  </div>
                )}
                {todaySpinData && (
                  <div className="flex flex-col gap-2 mb-4 w-full">
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <SyncIcon className="h-4 w-4 text-blue-400" />
                      <span className="text-gray-400">Synced for both of you</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
                        todaySpinData.spunBy === currentUser
                          ? 'bg-green-900/30 border-green-500/50'
                          : 'bg-pink-900/30 border-pink-500/50'
                      }`}>
                        <span className={`font-heading text-sm ${
                          todaySpinData.spunBy === currentUser
                            ? 'text-green-300'
                            : 'text-pink-300'
                        }`}>
                          {todaySpinData.spunBy === currentUser ? '✓ You spun it!' : `Spun by ${todaySpinData.spunBy}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                      <CalendarIcon className="h-3 w-3" />
                      <span>
                        {(() => {
                          try {
                            const date = new Date(todaySpinData.date + 'T00:00:00');
                            if (isNaN(date.getTime())) {
                              return todaySpinData.date;
                            }
                            const today = new Date().toISOString().split('T')[0];
                            const isToday = todaySpinData.date === today;
                            const formatted = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
                            return isToday ? `Today (${formatted})` : formatted;
                          } catch {
                            return todaySpinData.date;
                          }
                        })()}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-4 w-full mt-4">
                  {!hasSpunToday && (
                    <button onClick={handleSpinAgain} className="cute-button cute-button-blue w-full">
                      Spin Again
                    </button>
                  )}
                  <button onClick={onClose} className="cute-button cute-button-pink w-full">
                    Close
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SpinWheel;