import React, { useState, useEffect, useCallback } from 'react';
import { Movie, DailySpin, SpinEntry } from '../../../types';
import { useUser } from '../../../context/UserContext';
import { CheckIcon, SyncIcon } from '../../common/icons';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import MinigameModal from '../../ui/MinigameModal';
import { SpinRoulette } from './SpinRoulette';
import { getTodaySpin, saveDailySpin } from '../../../services/dailySpinService';
import { getSpinHistory, upsertTodaySpinEntry } from '../../../services/spinHistoryService';
import { typography, colors, shadows, spacing } from '../../../design-system/tokens';
import './SpinWheel.css';

const SpinWheel: React.FC<{
  isOpen: boolean;
  movies: Movie[];
  onClose: () => void;
  onWinner: (movie: Movie) => void;
}> = ({ isOpen, movies, onClose, onWinner }) => {
  const { currentUser } = useUser();
  const [status, setStatus] = useState<'loading' | 'idle' | 'spinning' | 'saving' | 'result'>('idle');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [hasSpunToday, setHasSpunToday] = useState(false);
  const [todaySpinData, setTodaySpinData] = useState<DailySpin | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [spinHistory, setSpinHistory] = useState<SpinEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadTodaySpin = useCallback(async () => {
    setStatus('loading');
    setSaveError(null);
    try {
      const todaySpin = await getTodaySpin();

      if (todaySpin) {
        setTodaySpinData(todaySpin);
        setHasSpunToday(true);
        setStatus('result');

        const movie = movies.find((m) => m.id === todaySpin.movieId);
        if (movie) {
          setSelectedMovie(movie);
        } else {
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
      setSaveError('Could not load today\'s spin.');
      setStatus('idle');
    }
  }, [movies]);

  useEffect(() => {
    if (isOpen) {
      loadTodaySpin();
    }
  }, [isOpen, loadTodaySpin]);

  useEffect(() => {
    if (!isOpen || status === 'loading') return;
    let isMounted = true;
    setHistoryLoading(true);
    getSpinHistory()
      .then((history) => {
        if (isMounted) setSpinHistory(history.slice(0, 7));
      })
      .catch(() => {
        if (isMounted) setSpinHistory([]);
      })
      .finally(() => {
        if (isMounted) setHistoryLoading(false);
      });
    return () => { isMounted = false; };
  }, [isOpen, status]);

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

      try {
        await upsertTodaySpinEntry(today, currentUser, movie.id, movie.title);
        setSpinHistory((prev) => [
          { id: '', date: today, movieId: movie.id, movieTitle: movie.title, spunBy: currentUser, createdAt: dailySpin.createdAt },
          ...prev.slice(0, 6),
        ]);
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

  return (
    <MinigameModal isOpen={isOpen} onClose={onClose} title="Spin" ariaLabel="Movie spin wheel" maxWidth={540} maxHeight={760}>
      {(status === 'loading' || (status === 'idle' && saveError === "Could not load today's spin.")) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: status === 'loading' ? 'rgba(0,0,0,0.4)' : 'transparent',
            zIndex: 1000,
          }}
        >
          {status === 'loading' ? (
            <div
              style={{
                padding: spacing.xl,
                borderRadius: 12,
                background: colors.surfaceElevated,
                border: `1px solid ${colors.borderSecondary}40`,
                color: colors.textSecondary,
                fontSize: typography.fontSize.sm,
              }}
            >
              Loading…
            </div>
          ) : (
            <div
              style={{
                padding: spacing.lg,
                borderRadius: 12,
                background: colors.surfaceElevated,
                border: `1px solid ${colors.error}40`,
                color: colors.textSecondary,
                fontSize: typography.fontSize.sm,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: spacing.sm,
              }}
            >
              <span>{saveError}</span>
              <Button onClick={() => loadTodaySpin()} variant="primary" style={{ minWidth: 100 }}>
                Retry
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Roulette wheel - main focus, takes most of the modal */}
      <div
        style={{
          width: '100%',
          flex: 1,
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: status === 'result' ? 0.4 : 1,
          pointerEvents: status === 'result' ? 'none' : 'auto',
          filter: status === 'result' ? 'blur(2px)' : 'none',
          transition: 'opacity 0.3s ease, filter 0.3s ease',
        }}
      >
        <SpinRoulette
          movies={movies}
          disabled={hasSpunToday}
          onSpinComplete={handleSpinResult}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Result panel - below wheel so wheel stays visible */}
      {status === 'result' && selectedMovie && (
        <div
          style={{
            flex: '0 0 auto',
            width: '100%',
            maxHeight: '42%',
            overflow: 'auto',
            padding: spacing.sm,
            borderTop: `1px solid ${colors.borderSecondary}40`,
            background: 'rgba(15, 23, 42, 0.6)',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ maxWidth: 360, margin: '0 auto' }}>
            <Card
              variant="elevated"
              className="spin-wheel-result-card"
              style={{
                padding: 0,
                overflow: 'hidden',
                border: `1px solid ${colors.accent}`,
                boxShadow: shadows.glowStrong,
              }}
            >
              <div className="spin-result-glow" style={{ borderRadius: 'inherit', position: 'absolute', inset: 0, pointerEvents: 'none' }} />
              <div
                style={{
                  padding: spacing.lg,
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  background: `linear-gradient(135deg, ${colors.surfaceElevated}, ${colors.surface})`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.md,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                {selectedMovie.posterUrl && (
                  <div
                    style={{
                      width: 72,
                      height: 108,
                      flexShrink: 0,
                      borderRadius: 6,
                      overflow: 'hidden',
                      border: `1px solid ${colors.borderSecondary}40`,
                    }}
                  >
                    <img
                      src={selectedMovie.posterUrl}
                      alt={selectedMovie.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    className="spin-winner-badge"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: spacing.xs,
                      marginBottom: 4,
                      color: colors.success,
                    }}
                  >
                    <CheckIcon style={{ width: 16, height: 16 }} />
                    <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: typography.fontSize.xs }}>Winner</span>
                  </div>
                  <h2
                    style={{
                      fontFamily: typography.fontFamily.heading.join(','),
                      fontSize: typography.fontSize.lg,
                      fontWeight: 700,
                      margin: 0,
                      color: colors.textPrimary,
                    }}
                  >
                    {selectedMovie.title}
                  </h2>
                  <div style={{ fontSize: typography.fontSize.xs, color: colors.textTertiary }}>
                    {selectedMovie.year}
                    {selectedMovie.genre ? ` · ${selectedMovie.genre.split(',')[0]}` : ''}
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: spacing.sm,
                  background: 'rgba(15, 23, 42, 0.5)',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing.sm,
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
                        display: 'flex',
                        flexDirection: 'column',
                        gap: spacing.xs,
                      }}
                    >
                      <span>{saveError}</span>
                      <Button onClick={() => setSaveError(null)} variant="ghost" style={{ fontSize: 11 }}>
                        Dismiss
                      </Button>
                    </div>
                  )}

                  {spinHistory.length > 0 && !historyLoading && (
                    <div style={{ marginTop: spacing.sm }}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: colors.textTertiary, marginBottom: 6 }}>
                        Recent spins
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {spinHistory.map((entry) => {
                          const d = entry.date;
                          const label = d === new Date().toISOString().split('T')[0] ? 'Today' : (d.slice(5) || d);
                          return (
                            <span
                              key={entry.id || entry.date + entry.movieId}
                              style={{
                                padding: '4px 8px',
                                borderRadius: 6,
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                fontSize: 11,
                                color: colors.textSecondary,
                              }}
                            >
                              {label}: {entry.movieTitle} ({entry.spunBy})
                            </span>
                          );
                        })}
                      </div>
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
    </MinigameModal>
  );
};

export default SpinWheel;
