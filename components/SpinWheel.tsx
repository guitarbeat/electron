import React, { useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Movie } from '../types';
import { useSpinWheel } from '../hooks/useSpinWheel';
import { useUser } from '../context/UserContext';
import { LockIcon, CalendarIcon, SyncIcon, CheckIcon, Spinner } from './icons';
import Card from './ui/Card';
import Button from './ui/Button';
import { spacing, typography, colors, radius, shadows } from '../design-system/tokens';

const COLORS = [
  '#2E3B4E',
  '#E74C3C',
  '#AF7AC5',
  '#5DADE2',
  '#FADBD8',
  '#C39BD3',
  '#A9CCE3',
  '#F5B7B1',
];

const SpinWheel: React.FC<{
  isOpen: boolean;
  movies: Movie[];
  onClose: () => void;
  onWinner: (movie: Movie) => void;
}> = ({ isOpen, movies, onClose, onWinner }) => {
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
    getPointerHandlers,
  } = useSpinWheel(movies, wheelRef, currentUser, onWinner);

  const segmentAngle = movies.length > 0 ? 360 / movies.length : 0;

  // Effect to prevent body scroll when modal is open and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    // * Prevent body scroll when modal is open
    document.body.classList.add('modal-open');

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
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, status, isOpen]);

  const wheelBackgroundStyle = useMemo(() => {
    if (movies.length === 0) return {};
    const gradientColors = movies
      .map(
        (_, i) =>
          `${COLORS[i % COLORS.length]} ${i * segmentAngle}deg, ${COLORS[i % COLORS.length]} ${(i + 1) * segmentAngle}deg`
      )
      .join(', ');

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

  if (!isOpen) return null;

  return createPortal(
    <div
      className="wheel-modal-overlay"
      onClick={handleOverlayClick}
      tabIndex={-1}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.overlay,
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        zIndex: 50,
        padding: spacing.lg,
        overflowY: 'auto',
      }}
    >
      <div
        className="modal-content-wrapper"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: `${spacing.md} 0`,
          maxWidth: '500px',
        }}
      >
        {status === 'loading' && (
          <Card variant="elevated" style={{ padding: spacing['3xl'], textAlign: 'center' }}>
            <Spinner
              style={{
                width: '48px',
                height: '48px',
                color: colors.accent,
                margin: '0 auto',
                marginBottom: spacing.lg,
              }}
            />
            <p
              style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.medium,
                color: colors.textPrimary,
                margin: 0,
                marginBottom: spacing.sm,
              }}
            >
              Checking today's spin...
            </p>
            <p style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary, margin: 0 }}>
              Please wait...
            </p>
          </Card>
        )}

        {status === 'saving' && (
          <Card variant="elevated" style={{ padding: spacing['3xl'], textAlign: 'center' }}>
            <Spinner
              style={{
                width: '48px',
                height: '48px',
                color: colors.secondary,
                margin: '0 auto',
                marginBottom: spacing.lg,
              }}
            />
            <p
              style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.medium,
                color: colors.textPrimary,
                margin: 0,
                marginBottom: spacing.sm,
              }}
            >
              Saving your spin...
            </p>
            <p style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary, margin: 0 }}>
              Syncing with your partner...
            </p>
          </Card>
        )}

        {status !== 'loading' && movies.length === 0 && (
          <Card variant="elevated" style={{ padding: spacing['3xl'], textAlign: 'center' }}>
            <p
              style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.medium,
                color: colors.textPrimary,
                margin: 0,
                marginBottom: spacing.sm,
              }}
            >
              No movies available
            </p>
            <p
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.textSecondary,
                margin: 0,
                marginBottom: spacing.lg,
              }}
            >
              Add some movies to your watchlist first!
            </p>
            <Button variant="primary" onClick={onClose} autoFocus>
              Close
            </Button>
          </Card>
        )}

        {status !== 'loading' && status !== 'saving' && movies.length > 0 && (
          <>
            <Card
              variant="default"
              className="current-movie-display"
              style={{ marginBottom: spacing.md, padding: `${spacing.sm} ${spacing.md}` }}
            >
              <h3
                className="current-movie-title"
                style={{
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  hyphens: 'auto',
                  maxWidth: '100%',
                  padding: '0',
                  boxSizing: 'border-box',
                  fontSize: typography.fontSize.base,
                  margin: 0,
                }}
              >
                {status === 'result' && selectedMovie
                  ? selectedMovie.title
                  : currentMovie
                    ? currentMovie.title
                    : 'Ready to spin?'}
              </h3>
              {status === 'result' && selectedMovie && (
                <div
                  style={{
                    marginTop: spacing.sm,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing.xs,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.xs,
                      padding: `${spacing.xs} ${spacing.sm}`,
                      borderRadius: '9999px',
                      backgroundColor: colors.success + '20',
                      border: `1px solid ${colors.success}80`,
                    }}
                  >
                    <CheckIcon style={{ width: '12px', height: '12px', color: colors.success }} />
                    <span
                      style={{
                        fontSize: typography.fontSize.xs,
                        color: colors.success,
                        fontWeight: typography.fontWeight.medium,
                      }}
                    >
                      Today's Pick
                    </span>
                  </div>
                </div>
              )}
            </Card>

            <div
              className={`spin-wheel-wrapper ${status === 'result' ? 'result-state' : ''} ${hasSpunToday ? 'locked-state' : ''}`}
              role="img"
              aria-label="Movie selection wheel"
              {...(hasSpunToday ? {} : getPointerHandlers())}
            >
              <div className="spin-wheel-container">
                {hasSpunToday && (
                  <div className="lock-overlay">
                    <div className="lock-icon-wrapper">
                      <LockIcon style={{ width: '32px', height: '32px' }} />
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
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={handlePrimarySpin}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    autoFocus
                    style={{
                      width: 'min(128px, 20vw)',
                      height: 'min(128px, 20vw)',
                      minWidth: '80px',
                      minHeight: '80px',
                      borderRadius: '50%',
                      fontSize: typography.fontSize['2xl'],
                      fontWeight: typography.fontWeight.bold,
                      pointerEvents: 'auto',
                      position: 'relative',
                      zIndex: 60,
                    }}
                  >
                    Spin!
                  </Button>
                </div>
              )}
              {hasSpunToday && status === 'idle' && (
                <div className="spin-content locked-content">
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: spacing.md,
                    }}
                  >
                    <LockIcon style={{ width: '48px', height: '48px', color: colors.accent }} />
                    <p
                      style={{
                        fontSize: typography.fontSize.lg,
                        fontWeight: typography.fontWeight.medium,
                        color: colors.textPrimary,
                        textAlign: 'center',
                        margin: 0,
                      }}
                    >
                      Already spun today!
                    </p>
                    <p
                      style={{
                        fontSize: typography.fontSize.sm,
                        color: colors.textSecondary,
                        margin: 0,
                      }}
                    >
                      Come back tomorrow for another spin
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Result Display */}
            {status === 'result' && selectedMovie && (
              <Card
                variant="elevated"
                className="result-display-container"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing.sm,
                    marginBottom: spacing.md,
                  }}
                >
                  <CheckIcon style={{ width: '24px', height: '24px', color: colors.success }} />
                  <h2
                    style={{
                      fontSize: typography.fontSize.xl,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.textPrimary,
                      margin: 0,
                    }}
                  >
                    Tonight's Movie:
                  </h2>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: spacing.md,
                    marginBottom: spacing.xl,
                    width: '100%',
                  }}
                >
                  {selectedMovie.posterUrl && (
                    <div
                      style={{
                        width: '180px',
                        aspectRatio: '2/3',
                        borderRadius: radius.md,
                        overflow: 'hidden',
                        boxShadow: shadows.glow,
                        marginBottom: spacing.sm,
                        animation: 'scale-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                        border: `2px solid ${colors.accent}`,
                      }}
                    >
                      <img
                        src={selectedMovie.posterUrl}
                        alt={selectedMovie.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                  <h3
                    style={{
                      fontSize: typography.fontSize['3xl'],
                      fontWeight: typography.fontWeight.bold,
                      color: colors.accent,
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      hyphens: 'auto',
                      margin: 0,
                      maxWidth: '100%',
                      padding: '0 0.5rem',
                      boxSizing: 'border-box',
                      textAlign: 'center',
                      textShadow: '0 0 15px rgba(255, 105, 180, 0.4)',
                    }}
                  >
                    {selectedMovie.title}
                  </h3>
                </div>
                {saveError && (
                  <Card
                    variant="outlined"
                    style={{
                      marginBottom: spacing.lg,
                      padding: spacing.md,
                      backgroundColor: colors.warning + '20',
                      borderColor: colors.warning + '80',
                    }}
                  >
                    <p
                      style={{
                        color: colors.warning,
                        fontSize: typography.fontSize.sm,
                        textAlign: 'center',
                        margin: 0,
                      }}
                    >
                      {saveError}
                    </p>
                  </Card>
                )}
                {todaySpinData && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: spacing.sm,
                      marginBottom: spacing.lg,
                      width: '100%',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: spacing.sm,
                        fontSize: typography.fontSize.sm,
                      }}
                    >
                      <SyncIcon
                        style={{ width: '16px', height: '16px', color: colors.secondary }}
                      />
                      <span style={{ color: colors.textSecondary }}>Synced for both of you</span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: spacing.sm,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing.sm,
                          padding: `${spacing.xs} ${spacing.md}`,
                          borderRadius: '9999px',
                          border: `1px solid ${todaySpinData.spunBy === currentUser ? colors.success + '80' : colors.accent + '80'}`,
                          backgroundColor:
                            todaySpinData.spunBy === currentUser
                              ? colors.success + '20'
                              : colors.accentMuted,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: typography.fontWeight.medium,
                            fontSize: typography.fontSize.sm,
                            color:
                              todaySpinData.spunBy === currentUser ? colors.success : colors.accent,
                          }}
                        >
                          {todaySpinData.spunBy === currentUser
                            ? '✓ You spun it!'
                            : `Spun by ${todaySpinData.spunBy}`}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: spacing.xs,
                        fontSize: typography.fontSize.xs,
                        color: colors.textTertiary,
                      }}
                    >
                      <CalendarIcon style={{ width: '12px', height: '12px' }} />
                      <span>
                        {(() => {
                          try {
                            const date = new Date(todaySpinData.date + 'T00:00:00');
                            if (isNaN(date.getTime())) {
                              return todaySpinData.date;
                            }
                            const today = new Date().toISOString().split('T')[0];
                            const isToday = todaySpinData.date === today;
                            const formatted = date.toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                            });
                            return isToday ? `Today (${formatted})` : formatted;
                          } catch {
                            return todaySpinData.date;
                          }
                        })()}
                      </span>
                    </div>
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing.sm,
                    width: '100%',
                    marginTop: spacing.md,
                  }}
                >
                  {!hasSpunToday && (
                    <Button
                      onClick={handleSpinAgain}
                      variant="secondary"
                      style={{ width: '100%' }}
                      size="md"
                      autoFocus
                    >
                      Spin Again
                    </Button>
                  )}
                  <Button
                    onClick={onClose}
                    variant="primary"
                    style={{ width: '100%' }}
                    size="md"
                    autoFocus={hasSpunToday}
                  >
                    Close
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

export default SpinWheel;
