import React, { useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Movie } from '../../../types';
import { useSpinWheel } from '../../../hooks/useSpinWheel';
import { useUser } from '../../../context/UserContext';
import { CalendarIcon, SyncIcon, CheckIcon, Spinner } from '../../icons';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import { spacing, typography, colors, radius, shadows } from '../../../design-system/tokens';
import './SpinWheel.css';

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
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const {
    status,
    activeMovie,
    selectedMovie,
    spinCount,
    todayRecord,
    saveError,
    handlePrimarySpin,
    handleSpinAgain,
    getPointerHandlers,
    selectedCategory,
    setSelectedCategory,
    filteredMovies,
  } = useSpinWheel(movies, wheelRef, currentUser, onWinner);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(movies.map((m) => m.category || 'Movies')));
    return ['All', ...cats.sort()];
  }, [movies]);

  const segmentAngle = filteredMovies.length > 0 ? 360 / filteredMovies.length : 0;

  // Effect to prevent body scroll when modal is open and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    document.body.classList.add('modal-open');

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
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
    if (filteredMovies.length === 0) return {};
    const gradientColors = filteredMovies
      .map(
        (_, i) =>
          `${COLORS[i % COLORS.length]} ${i * segmentAngle}deg, ${COLORS[i % COLORS.length]} ${(i + 1) * segmentAngle}deg`
      )
      .join(', ');

    return {
      backgroundImage: `conic-gradient(${gradientColors})`,
    };
  }, [filteredMovies, segmentAngle]);

  const handleOverlayClick = (e: React.MouseEvent) => {
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
        backgroundColor: isFullscreen ? colors.background : colors.overlay,
        backdropFilter: isFullscreen ? 'none' : 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2100,
        padding: isFullscreen ? 0 : spacing.lg,
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
          padding: isFullscreen ? spacing.xl : `${spacing.md} 0`,
          maxWidth: isFullscreen ? '800px' : '500px',
          height: isFullscreen ? '100%' : 'auto',
          maxHeight: isFullscreen ? '100vh' : 'none',
          overflowY: isFullscreen ? 'auto' : 'visible',
          backgroundColor: isFullscreen ? colors.background : 'transparent',
        }}
      >
        <div
          style={{
            alignSelf: 'flex-end',
            display: 'flex',
            gap: spacing.sm,
            marginBottom: spacing.md,
          }}
        >
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={{
              border: `1px solid ${colors.accent}80`,
              borderRadius: radius.full,
              padding: '6px 12px',
              fontWeight: '600',
              boxShadow: shadows.glow,
              backgroundColor: `${colors.accent}15`,
              color: colors.accent,
            }}
          >
            {isFullscreen ? 'Exit Full' : '⛶ Fullscreen'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            disabled={status === 'spinning' || status === 'loading' || status === 'saving'}
            style={{ border: `1px solid ${colors.borderSecondary}30`, borderRadius: radius.full }}
          >
            Close
          </Button>
        </div>

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
              Loading spin history...
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
            {/* Category Selector — always visible when not spinning */}
            {status === 'idle' && (
              <div
                style={{
                  display: 'flex',
                  gap: spacing.xs,
                  overflowX: 'auto',
                  width: '100%',
                  padding: `0 ${spacing.md}`,
                  marginBottom: spacing.md,
                  scrollbarWidth: 'none',
                }}
              >
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      borderRadius: '9999px',
                      padding: `${spacing.xs} ${spacing.md}`,
                    }}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            )}

            {/* Current / active movie display */}
            <Card
              variant="default"
              className="current-movie-display"
              style={{
                marginBottom: spacing.md,
                padding: `${spacing.sm} ${spacing.md}`,
                minHeight: '120px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                width: 'min(400px, 90vw)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.md,
                  width: '100%',
                }}
              >
                {activeMovie?.posterUrl && status !== 'result' && (
                  <div
                    className="spin-poster-preview"
                    key={activeMovie.id}
                    style={{
                      width: '60px',
                      aspectRatio: '2/3',
                      borderRadius: radius.sm,
                      overflow: 'hidden',
                      boxShadow: shadows.card,
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={activeMovie.posterUrl}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <h3
                    className={
                      status === 'result'
                        ? 'current-movie-title current-movie-title--result'
                        : 'current-movie-title'
                    }
                    style={{
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      hyphens: 'auto',
                      maxWidth: '100%',
                      padding: '0',
                      boxSizing: 'border-box',
                      fontSize:
                        status === 'result' ? typography.fontSize.lg : typography.fontSize.base,
                      fontWeight:
                        status === 'result'
                          ? typography.fontWeight.bold
                          : typography.fontWeight.medium,
                      margin: 0,
                      color: status === 'result' ? colors.accent : colors.textPrimary,
                    }}
                  >
                    {status === 'result' && selectedMovie
                      ? selectedMovie.title
                      : activeMovie
                        ? activeMovie.title
                        : 'Ready to spin?'}
                  </h3>
                  {activeMovie?.category && status !== 'result' && (
                    <span
                      style={{
                        fontSize: typography.fontSize.xs,
                        color: colors.textSecondary,
                        marginTop: spacing.xs,
                        display: 'block',
                      }}
                    >
                      {activeMovie.category}
                    </span>
                  )}
                </div>
              </div>

              {/* Daily spin counter badge */}
              {spinCount > 0 && status !== 'result' && (
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
                      backgroundColor: `${colors.accent}15`,
                      border: `1px solid ${colors.accent}40`,
                    }}
                  >
                    <CalendarIcon style={{ width: '12px', height: '12px', color: colors.accent }} />
                    <span
                      style={{
                        fontSize: typography.fontSize.xs,
                        color: colors.accent,
                        fontWeight: typography.fontWeight.medium,
                      }}
                    >
                      {spinCount} spin{spinCount !== 1 ? 's' : ''} today
                    </span>
                  </div>
                </div>
              )}

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
                      backgroundColor: `${colors.success}20`,
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
                      Latest Pick
                    </span>
                  </div>
                </div>
              )}
            </Card>

            {/* Wheel */}
            <div
              className={`spin-wheel-wrapper ${status === 'result' ? 'result-state' : ''}`}
              role="img"
              aria-label="Movie selection wheel"
              {...getPointerHandlers()}
              style={{
                cursor: status === 'spinning' ? 'grabbing' : 'grab',
                touchAction: 'none',
              }}
            >
              <div className="spin-wheel-container">
                <div className="spin-marker" />
                <div ref={wheelRef} className="spin-wheel" style={wheelBackgroundStyle} />
                <div className="spin-hub" />
              </div>
              {(status === 'idle' || status === 'spinning') && (
                <div className="spin-content">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={handlePrimarySpin}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    disabled={status === 'spinning' || filteredMovies.length === 0}
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
                      boxShadow: status === 'spinning' ? 'none' : shadows.glow,
                    }}
                  >
                    {status === 'spinning' ? '...' : 'Spin!'}
                  </Button>
                </div>
              )}
            </div>

            {/* Result Display */}
            {status === 'result' && selectedMovie && (
              <Card
                variant="elevated"
                className="result-display-container"
                onClick={(e) => e?.stopPropagation()}
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
                      fontFamily: typography.fontFamily.heading.join(', '),
                      letterSpacing: typography.letterSpacing.wide,
                      lineHeight: typography.lineHeight.tight,
                      color: colors.textPrimary,
                      margin: 0,
                    }}
                  >
                    Tonight's Pick:
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
                    className="current-movie-title current-movie-title--hero"
                    style={{
                      fontSize: typography.fontSize['3xl'],
                      fontWeight: typography.fontWeight.bold,
                      fontFamily: typography.fontFamily.heading.join(', '),
                      letterSpacing: typography.letterSpacing.wide,
                      lineHeight: typography.lineHeight.tight,
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
                      backgroundColor: `${colors.warning}20`,
                      borderColor: `${colors.warning}80`,
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

                {/* Today's spin history */}
                {todayRecord && todayRecord.spins.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: spacing.sm,
                      marginBottom: spacing.lg,
                      width: '100%',
                    }}
                  >
                    {/* Sync indicator */}
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

                    {/* Spin count for today */}
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
                        {spinCount} spin{spinCount !== 1 ? 's' : ''} today
                        {' · '}
                        {(() => {
                          try {
                            const date = new Date(`${todayRecord.date}T00:00:00`);
                            if (isNaN(date.getTime())) return todayRecord.date;
                            return date.toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                            });
                          } catch {
                            return todayRecord.date;
                          }
                        })()}
                      </span>
                    </div>

                    {/* Who spun last */}
                    {todayRecord.spins.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing.sm,
                            padding: `${spacing.xs} ${spacing.md}`,
                            borderRadius: '9999px',
                            border: `1px solid ${
                              todayRecord.spins[todayRecord.spins.length - 1].spunBy === currentUser
                                ? `${colors.success}80`
                                : `${colors.accent}80`
                            }`,
                            backgroundColor:
                              todayRecord.spins[todayRecord.spins.length - 1].spunBy === currentUser
                                ? `${colors.success}20`
                                : colors.accentMuted,
                          }}
                        >
                          <span
                            style={{
                              fontWeight: typography.fontWeight.medium,
                              fontSize: typography.fontSize.sm,
                              color:
                                todayRecord.spins[todayRecord.spins.length - 1].spunBy ===
                                currentUser
                                  ? colors.success
                                  : colors.accent,
                            }}
                          >
                            {todayRecord.spins[todayRecord.spins.length - 1].spunBy === currentUser
                              ? '✓ You spun it!'
                              : `Spun by ${todayRecord.spins[todayRecord.spins.length - 1].spunBy}`}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Spin history list (only when more than one spin today) */}
                    {todayRecord.spins.length > 1 && (
                      <div
                        style={{
                          marginTop: spacing.sm,
                          borderTop: `1px solid ${colors.borderSecondary}30`,
                          paddingTop: spacing.sm,
                        }}
                      >
                        <p
                          style={{
                            fontSize: typography.fontSize.xs,
                            color: colors.textTertiary,
                            textAlign: 'center',
                            marginBottom: spacing.xs,
                            margin: `0 0 ${spacing.xs} 0`,
                          }}
                        >
                          Today's spin history
                        </p>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: spacing.xs,
                            maxHeight: '120px',
                            overflowY: 'auto',
                          }}
                        >
                          {[...todayRecord.spins].reverse().map((spin, idx) => (
                            <div
                              key={`${spin.createdAt}-${idx}`}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: `${spacing.xs} ${spacing.sm}`,
                                borderRadius: radius.sm,
                                backgroundColor: `${colors.surface}80`,
                                fontSize: typography.fontSize.xs,
                              }}
                            >
                              <span
                                style={{
                                  color: colors.textPrimary,
                                  fontWeight: typography.fontWeight.medium,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: '60%',
                                }}
                              >
                                {spin.movieTitle}
                              </span>
                              <span style={{ color: colors.textTertiary, flexShrink: 0 }}>
                                {spin.spunBy} ·{' '}
                                {new Date(spin.createdAt).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
                  <Button
                    onClick={handleSpinAgain}
                    variant="secondary"
                    style={{ width: '100%' }}
                    size="md"
                    autoFocus
                  >
                    Spin Again
                  </Button>
                  <Button onClick={onClose} variant="primary" style={{ width: '100%' }} size="md">
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
