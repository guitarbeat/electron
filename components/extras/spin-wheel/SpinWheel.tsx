import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Movie, DailySpin, SpinEntry } from '../../../types';
import { useUser } from '../../../context/UserContext';
import { useMovies } from '../../../hooks/useMovies';
import { CheckIcon, SyncIcon } from '../../common/icons';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import { SpinRoulette } from './SpinRoulette';
import { getTodaySpin, saveDailySpin } from '../../../services/dailySpinService';
import { getSpinHistory, upsertTodaySpinEntry } from '../../../services/spinHistoryService';
import { typography, colors, spacing, radius } from '../../../design-system/tokens';
import { useBubbleDismiss, type BubbleId } from '../../../context/BubbleDismissContext';
import {
  FLOATING_BUBBLE_SIZE,
  FLOATING_BUBBLE_EDGE_MARGIN,
  FLOATING_DRAG_THRESHOLD,
  clampFloatingBubblePosition,
  getFloatingBubbleButtonStyle,
  getFloatingContainerStyle,
} from '../../ui/floatingBubbleStyles';
import './SpinWheel.css';

interface SpinWheelProps {
  mode?: 'floating' | 'embedded';
  onRequestClose?: () => void;
}

const SPIN_BUBBLE_ID: BubbleId = 'spin';

const SpinWheel: React.FC<SpinWheelProps> = ({ mode = 'floating', onRequestClose }) => {
  const {
    isHidden,
    setDragging: setDismissDragging,
    checkDismissZoneHit,
    dismiss,
  } = useBubbleDismiss();
  const isEmbedded = mode === 'embedded';
  const isViewportExpanded = !isEmbedded;
  const { currentUser } = useUser();
  const { movies } = useMovies(currentUser);
  const unwatchedMovies = movies ? movies.filter((m) => m.watchedBy.length < 2) : [];
  const canSpin = unwatchedMovies.length >= 2;

  const [isMinimized, setIsMinimized] = useState(mode === 'floating');
  const [status, setStatus] = useState<'loading' | 'idle' | 'spinning' | 'saving' | 'result'>(
    'idle'
  );
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [todaySpinData, setTodaySpinData] = useState<DailySpin | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [spinHistory, setSpinHistory] = useState<SpinEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Draggable bubble state
  const [bubblePosition, setBubblePosition] = useState(() => {
    if (typeof window === 'undefined') {
      return { x: FLOATING_BUBBLE_EDGE_MARGIN, y: FLOATING_BUBBLE_EDGE_MARGIN };
    }
    return {
      x: FLOATING_BUBBLE_EDGE_MARGIN + 4,
      y: window.innerHeight - FLOATING_BUBBLE_SIZE - FLOATING_BUBBLE_EDGE_MARGIN - 140,
    };
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origin: { x: number; y: number };
  } | null>(null);
  const didDragRef = useRef(false);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: bubblePosition,
    };
    didDragRef.current = false;
    setIsDragging(true);
    setDismissDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const ds = dragStateRef.current;
    if (!ds || ds.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - ds.startX;
    const deltaY = event.clientY - ds.startY;
    if (
      !didDragRef.current &&
      (Math.abs(deltaX) > FLOATING_DRAG_THRESHOLD || Math.abs(deltaY) > FLOATING_DRAG_THRESHOLD)
    ) {
      didDragRef.current = true;
    }
    if (!didDragRef.current) return;
    const newX = ds.origin.x + deltaX;
    const newY = ds.origin.y + deltaY;
    setBubblePosition(clampFloatingBubblePosition(newX, newY));
    checkDismissZoneHit(newX, newY, FLOATING_BUBBLE_SIZE);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const ds = dragStateRef.current;
    if (!ds || ds.pointerId !== event.pointerId) return;
    const wasDragged = didDragRef.current;
    setIsDragging(false);
    setDismissDragging(false);
    dragStateRef.current = null;
    didDragRef.current = false;
    if (
      wasDragged &&
      checkDismissZoneHit(bubblePosition.x, bubblePosition.y, FLOATING_BUBBLE_SIZE)
    ) {
      dismiss(SPIN_BUBBLE_ID);
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        /* */
      }
      return;
    }
    if (!wasDragged) {
      if (canSpin) {
        setIsMinimized(false);
      }
    }
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Ignore release errors
    }
  };

  // Keep a ref to unwatchedMovies so the callback doesn't depend on it
  const unwatchedMoviesRef = useRef(unwatchedMovies);
  unwatchedMoviesRef.current = unwatchedMovies;

  const loadTodaySpin = useCallback(async () => {
    setStatus('loading');
    setSaveError(null);
    try {
      const todaySpin = await getTodaySpin();
      if (todaySpin) {
        setTodaySpinData(todaySpin);
        setStatus('result');
        const movie = unwatchedMoviesRef.current.find((m) => m.id === todaySpin.movieId);
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
      setSaveError("Could not load today's spin.");
      setStatus('idle');
    }
  }, []);

  // Only load when panel is opened (not while minimized)
  const [hasOpened, setHasOpened] = useState(false);
  useEffect(() => {
    if (!isMinimized && !hasOpened) {
      setHasOpened(true);
      loadTodaySpin();
    }
  }, [isMinimized, hasOpened, loadTodaySpin]);

  useEffect(() => {
    if (isEmbedded) {
      setIsMinimized(false);
    }
  }, [isEmbedded]);

  useEffect(() => {
    if (isMinimized || status === 'loading' || status === 'idle') return;
    if (status !== 'result') return;
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
    return () => {
      isMounted = false;
    };
  }, [isMinimized, status]);

  const handleSpinResult = async (movie: Movie) => {
    const spinner = currentUser ?? movie.addedBy;
    setStatus('saving');
    setSelectedMovie(movie);
    setSaveError(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      const dailySpin: DailySpin = {
        date: today,
        movieId: movie.id,
        movieTitle: movie.title,
        spunBy: spinner,
        createdAt: new Date().toISOString(),
      };
      await saveDailySpin(dailySpin);
      try {
        await upsertTodaySpinEntry(today, spinner, movie.id, movie.title);
        setSpinHistory((prev) => [
          {
            id: '',
            date: today,
            movieId: movie.id,
            movieTitle: movie.title,
            spunBy: spinner,
            createdAt: dailySpin.createdAt,
          },
          ...prev.slice(0, 6),
        ]);
      } catch (histErr) {
        console.error('History save failed', histErr);
      }
      setTodaySpinData(dailySpin);
      setStatus('result');
    } catch (err) {
      console.error('Save failed', err);
      setSaveError('Could not save result. It may not sync.');
      setStatus('result');
    }
  };

  const handleHide = () => {
    if (isEmbedded) {
      onRequestClose?.();
      return;
    }
    setIsMinimized(true);
  };

  // Minimized bubble
  if (isMinimized && mode === 'floating') {
    if (isHidden(SPIN_BUBBLE_ID)) return null;
    return (
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          ...getFloatingBubbleButtonStyle({
            position: bubblePosition,
            isDragging,
            background: canSpin
              ? 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 40%), linear-gradient(145deg, rgba(255, 105, 180, 0.95) 0%, rgba(180, 60, 130, 0.95) 100%)'
              : 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 40%), linear-gradient(145deg, rgba(100, 100, 120, 0.7) 0%, rgba(60, 60, 80, 0.7) 100%)',
            color: '#fff',
            fontSize: '1.4rem',
          }),
        }}
        aria-label={canSpin ? 'Open Spin Wheel' : 'Spin Wheel (locked)'}
      >
        🎰
        {!canSpin && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '20px',
              height: '20px',
              borderRadius: radius.full,
              backgroundColor: colors.surfaceElevated,
              color: colors.textTertiary,
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${colors.borderSecondary}60`,
            }}
            aria-label="Locked"
          >
            🔒
          </span>
        )}
      </button>
    );
  }

  // Expanded panel
  return (
    <div
      style={{
        ...getFloatingContainerStyle({
          isEmbedded,
          isViewportExpanded,
          isMobile: false,
          desktopWidth: '100%',
          zIndex: 1001,
        }),
        ...(isEmbedded ? { height: '100%' } : {}),
      }}
    >
      <Card
        style={{
          padding: spacing.md,
          border: 'none',
          borderRadius: 0,
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          width: '100%',
          height: '100%',
          maxHeight: '100vh',
        }}
      >
        {/* Header */}
        {!isEmbedded && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing.sm,
            }}
          >
            <h2 style={{ margin: 0, fontSize: typography.fontSize.lg, color: colors.textPrimary }}>
              Spin
            </h2>
            <Button size="sm" variant="ghost" onClick={handleHide}>
              Hide
            </Button>
          </div>
        )}

        {/* Loading overlay */}
        {status === 'loading' && (
          <div
            style={{
              padding: spacing.xl,
              textAlign: 'center',
              color: colors.textSecondary,
              fontSize: typography.fontSize.sm,
            }}
          >
            Loading…
          </div>
        )}

        {/* Wheel */}
        {status !== 'loading' && (
          <div style={{ flex: '1 1 auto', minHeight: 0, overflow: 'auto' }}>
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 0,
                opacity: status === 'result' ? 0.75 : 1,
                pointerEvents: status === 'result' ? 'none' : 'auto',
                transition: 'opacity 0.3s ease',
              }}
            >
              <SpinRoulette
                movies={unwatchedMovies}
                disabled={!canSpin}
                onSpinComplete={handleSpinResult}
                style={{
                  width: 'min(100%, 460px)',
                  height: 'auto',
                  aspectRatio: '1 / 1',
                }}
              />
            </div>

            {/* Result */}
            {status === 'result' && selectedMovie && (
              <div
                style={{
                  padding: spacing.sm,
                  borderTop: `1px solid ${colors.accent}40`,
                  marginTop: spacing.sm,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: colors.accent,
                    marginBottom: spacing.xs,
                    textAlign: 'center',
                  }}
                >
                  Today&apos;s pick
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.md,
                    padding: spacing.sm,
                    borderRadius: 12,
                    background: `linear-gradient(135deg, ${colors.surfaceElevated}, ${colors.surface})`,
                    border: `1px solid ${colors.accent}40`,
                  }}
                >
                  {selectedMovie.posterUrl ? (
                    <div
                      style={{
                        width: 60,
                        height: 90,
                        flexShrink: 0,
                        borderRadius: 6,
                        overflow: 'hidden',
                        border: `1px solid ${colors.accent}40`,
                      }}
                    >
                      <img
                        src={selectedMovie.posterUrl}
                        alt={selectedMovie.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  ) : null}
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.xs,
                        marginBottom: 2,
                        color: colors.success,
                      }}
                    >
                      <CheckIcon style={{ width: 14, height: 14 }} />
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 11,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Winner
                      </span>
                    </div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: typography.fontSize.base,
                        fontFamily: typography.fontFamily.heading.join(','),
                        color: colors.textPrimary,
                        lineHeight: 1.25,
                        wordBreak: 'break-word',
                      }}
                    >
                      {selectedMovie.title}
                    </h3>
                    <div style={{ fontSize: typography.fontSize.xs, color: colors.textTertiary }}>
                      {selectedMovie.year}
                      {selectedMovie.genre ? ` · ${selectedMovie.genre.split(',')[0]}` : ''}
                    </div>
                  </div>
                </div>

                {todaySpinData && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: spacing.sm,
                      marginTop: spacing.sm,
                      fontSize: 11,
                      color: colors.textTertiary,
                    }}
                  >
                    <SyncIcon style={{ width: 12, height: 12 }} />
                    <span>Synced</span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 9999,
                        border: `1px solid ${todaySpinData.spunBy === currentUser ? 'rgba(52,211,153,0.2)' : 'rgba(99,102,241,0.2)'}`,
                        background:
                          todaySpinData.spunBy === currentUser
                            ? 'rgba(52,211,153,0.1)'
                            : 'rgba(99,102,241,0.1)',
                        fontSize: 11,
                        color:
                          todaySpinData.spunBy === currentUser ? colors.success : colors.tertiary,
                      }}
                    >
                      Spun by {todaySpinData.spunBy === currentUser ? 'You' : todaySpinData.spunBy}
                    </span>
                  </div>
                )}

                {saveError && (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: spacing.xs,
                      borderRadius: 4,
                      background: 'rgba(248,113,113,0.1)',
                      color: colors.error,
                      fontSize: 11,
                      marginTop: spacing.sm,
                    }}
                  >
                    {saveError}
                  </div>
                )}

                {spinHistory.length > 0 && !historyLoading && (
                  <div style={{ marginTop: spacing.sm }}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: colors.textTertiary,
                        marginBottom: 4,
                      }}
                    >
                      Recent spins
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {spinHistory.map((entry) => {
                        const d = entry.date;
                        const label =
                          d === new Date().toISOString().split('T')[0] ? 'Today' : d.slice(5) || d;
                        return (
                          <span
                            key={entry.id || entry.date + entry.movieId}
                            style={{
                              padding: '3px 6px',
                              borderRadius: 6,
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              fontSize: 10,
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
              </div>
            )}

            {!canSpin && status !== 'result' && (
              <p
                style={{
                  textAlign: 'center',
                  color: colors.textTertiary,
                  fontSize: typography.fontSize.xs,
                  margin: `${spacing.sm} 0 0`,
                }}
              >
                Add {Math.max(0, 2 - unwatchedMovies.length)} more unwatched movie
                {unwatchedMovies.length === 1 ? '' : 's'} to spin.
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default SpinWheel;
