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
import { typography, colors, shadows, spacing } from '../../../design-system/tokens';
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

  // Lock body scroll when modal is open to prevent background scroll / layout shift
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.9)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Movie spin wheel"
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main Dial Component */}
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: status === 'result' ? 0.3 : 1,
            pointerEvents: status === 'result' ? 'none' : 'auto',
            filter: status === 'result' ? 'blur(4px)' : 'none',
            transition: 'opacity 0.3s ease, filter 0.3s ease',
          }}
        >
          <RotaryDialCarousel
            movies={movies}
            currentUser={currentUser}
            mode={hasSpunToday ? 'browse' : 'spin'}
            onSpinComplete={handleSpinResult}
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Result Overlay */}
        {status === 'result' && selectedMovie && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: spacing.md,
              pointerEvents: 'none',
              zIndex: 10000,
            }}
          >
            <div style={{ pointerEvents: 'auto', maxWidth: '28rem', width: '100%' }}>
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
                  style={{
                    padding: spacing['2xl'],
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    background: `linear-gradient(135deg, ${colors.surfaceElevated}, ${colors.surface})`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: spacing.sm,
                      marginBottom: spacing.md,
                      color: colors.success,
                    }}
                  >
                    <CheckIcon style={{ width: 24, height: 24 }} />
                    <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: typography.fontSize.sm }}>Winner</span>
                  </div>

                  {selectedMovie.posterUrl && (
                    <div
                      style={{
                        width: 160,
                        margin: '0 auto',
                        marginBottom: spacing.md,
                        borderRadius: 8,
                        overflow: 'hidden',
                        border: '2px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                      }}
                    >
                      <img
                        src={selectedMovie.posterUrl}
                        alt={selectedMovie.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}

                  <h2
                    style={{
                      fontFamily: typography.fontFamily.heading.join(','),
                      fontSize: '1.875rem',
                      fontWeight: 700,
                      marginBottom: spacing.sm,
                      color: colors.textPrimary,
                    }}
                  >
                    {selectedMovie.title}
                  </h2>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: spacing.sm,
                      fontSize: typography.fontSize.sm,
                      color: colors.textTertiary,
                    }}
                  >
                    <span>{selectedMovie.year}</span>
                    {selectedMovie.genre && <span>• {selectedMovie.genre.split(',')[0]}</span>}
                  </div>
                </div>

                {/* Footer Info */}
                <div
                  style={{
                    padding: spacing.md,
                    background: 'rgba(15, 23, 42, 0.5)',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing.md,
                  }}
                >
                  {todaySpinData && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: spacing.md,
                        fontSize: typography.fontSize.sm,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, color: colors.textTertiary }}>
                        <SyncIcon style={{ width: 14, height: 14 }} />
                        <span>Synced</span>
                      </div>
                      <div
                        style={{
                          padding: '4px 12px',
                          borderRadius: 9999,
                          border: `1px solid ${todaySpinData.spunBy === currentUser ? 'rgba(52, 211, 153, 0.2)' : 'rgba(99, 102, 241, 0.2)'}`,
                          background: todaySpinData.spunBy === currentUser ? 'rgba(52, 211, 153, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                          fontSize: 12,
                          fontWeight: 500,
                          color: todaySpinData.spunBy === currentUser ? colors.success : colors.tertiary,
                        }}
                      >
                        Spun by {todaySpinData.spunBy === currentUser ? 'You' : todaySpinData.spunBy}
                      </div>
                    </div>
                  )}

                  {saveError && (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: spacing.sm,
                        borderRadius: 4,
                        background: 'rgba(248, 113, 113, 0.1)',
                        color: colors.error,
                        fontSize: 12,
                      }}
                    >
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
            aria-label="Close spin wheel"
            style={{
              position: 'absolute',
              top: spacing.xl,
              right: spacing.xl,
              width: 44,
              height: 44,
              padding: spacing.sm,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.2)',
              color: 'rgba(255,255,255,0.7)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.2)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
            }}
          >
            <svg width={24} height={24} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
