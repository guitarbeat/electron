import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Movie, DailySpin } from '../../../types';
import { useUser } from '../../../context/UserContext';
import { CheckIcon, SyncIcon } from '../../icons';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import { RotaryDialCarousel } from '../../watchlist/components/RotaryDialCarousel';
import { getTodaySpin, saveDailySpin } from '../../../services/dailySpinService';
import { upsertTodaySpinEntry } from '../../../services/spinHistoryService';
import { typography, colors, shadows } from '../../../design-system/tokens';
import './SpinWheel.css';

const SpinWheel: React.FC<{
  isOpen: boolean;
  movies: Movie[];
  onClose: () => void;
  onWinner: (movie: Movie) => void;
}> = ({ isOpen, movies, onClose, onWinner }) => {
  const { currentUser } = useUser();
  const [status, setStatus] = useState<'idle' | 'spinning' | 'saving' | 'result'>('idle');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [hasSpunToday, setHasSpunToday] = useState(false);
  const [todaySpinData, setTodaySpinData] = useState<DailySpin | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Check spin on mount
  useEffect(() => {
    let isMounted = true;
    const checkTodaySpin = async () => {
      try {
        const todaySpin = await getTodaySpin();
        if (!isMounted) return;

        if (todaySpin) {
          setTodaySpinData(todaySpin);
          setHasSpunToday(true);
          setStatus('result');

          const movie = movies.find((m) => m.id === todaySpin.movieId);
          if (movie) {
            setSelectedMovie(movie);
          } else {
            // Fallback if movie not in list (e.g. deleted or filtered)
            setSelectedMovie({
              id: todaySpin.movieId,
              title: todaySpin.movieTitle,
              addedBy: 'System' as any,
              watchedBy: [],
              createdAt: todaySpin.createdAt,
              year: 'Unknown',
              genre: 'Unknown',
            } as Movie);
          }
        } else {
          setStatus('idle');
        }
      } catch (e) {
        console.error("Error checking today's spin:", e);
      }
    };

    if (isOpen) {
      checkTodaySpin();
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, movies]);

  const handleSpinResult = async (movie: Movie) => {
    if (!currentUser) return;

    setStatus('saving');
    setSelectedMovie(movie);
    setSaveError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const dailySpin: DailySpin = {
        date: today,
        movieId: movie.id,
        movieTitle: movie.title,
        spunBy: currentUser,
        createdAt: new Date().toISOString(),
      };

      await saveDailySpin(dailySpin);

      // Also update history
      try {
        await upsertTodaySpinEntry(today, currentUser, movie.id, movie.title);
      } catch (histErr) {
        console.error('History save failed', histErr);
      }

      setTodaySpinData(dailySpin);
      setHasSpunToday(true);
      setStatus('result');
      onWinner(movie);
    } catch (err) {
      console.error('Save failed', err);
      setSaveError('Could not save result. It may not sync.');
      setStatus('result');
      onWinner(movie);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main Dial Component */}
        <div
          className="w-full flex items-center justify-center transition-opacity duration-500"
          style={{
            height: '100%',
            opacity: status === 'result' ? 0.3 : 1,
            pointerEvents: status === 'result' ? 'none' : 'auto',
            filter: status === 'result' ? 'blur(4px)' : 'none',
          }}
        >
          <RotaryDialCarousel
            movies={movies}
            currentUser={currentUser}
            mode={hasSpunToday ? 'browse' : 'spin'}
            onSpinComplete={handleSpinResult}
            className="w-full h-full"
            style={{ height: '100%' }}
          />
        </div>

        {/* Result Overlay */}
        {status === 'result' && selectedMovie && (
          <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none z-50">
            <div className="pointer-events-auto max-w-md w-full">
              <Card
                variant="elevated"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  border: `1px solid ${colors.accent}`,
                  boxShadow: shadows.glowStrong,
                  animation: 'zoomIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                }}
              >
                {/* Header */}
                <div
                  className="p-6 text-center relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${colors.surfaceElevated}, ${colors.surface})`,
                  }}
                >
                  <div className="flex items-center justify-center gap-2 mb-4 text-emerald-400">
                    <CheckIcon style={{ width: 24, height: 24 }} />
                    <span className="font-bold uppercase tracking-wider text-sm">Winner</span>
                  </div>

                  {selectedMovie.posterUrl && (
                    <div className="w-40 mx-auto mb-4 rounded-lg shadow-2xl overflow-hidden border-2 border-white/10 transform hover:scale-105 transition-transform">
                      <img
                        src={selectedMovie.posterUrl}
                        alt={selectedMovie.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <h2
                    className="text-3xl font-bold mb-2 text-white"
                    style={{ fontFamily: typography.fontFamily.heading.join(',') }}
                  >
                    {selectedMovie.title}
                  </h2>

                  <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                    <span>{selectedMovie.year}</span>
                    {selectedMovie.genre && <span>• {selectedMovie.genre.split(',')[0]}</span>}
                  </div>
                </div>

                {/* Footer Info */}
                <div className="p-4 bg-slate-900/50 border-t border-white/5 space-y-4">
                  {todaySpinData && (
                    <div className="flex items-center justify-center gap-3 text-sm">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <SyncIcon style={{ width: 14, height: 14 }} />
                        <span>Synced</span>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full border text-xs font-medium ${
                          todaySpinData.spunBy === currentUser
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                        }`}
                      >
                        Spun by{' '}
                        {todaySpinData.spunBy === currentUser ? 'You' : todaySpinData.spunBy}
                      </div>
                    </div>
                  )}

                  {saveError && (
                    <div className="text-center p-2 rounded bg-red-500/10 text-red-400 text-xs">
                      {saveError}
                    </div>
                  )}

                  <Button onClick={onClose} variant="primary" style={{ width: '100%' }}>
                    Close
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Close button for non-result state */}
        {status !== 'result' && status !== 'spinning' && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-6 right-6 p-2 rounded-full bg-black/20 hover:bg-white/10 text-white/70 hover:text-white transition-all z-50 backdrop-blur-sm"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>,
    document.body
  );
};

export default SpinWheel;
