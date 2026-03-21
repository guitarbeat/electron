import React, { useState, useMemo, useRef, useEffect, useCallback, useImperativeHandle } from 'react';
import { User, Movie } from '@/types';
import { useMatchmaker } from '@/hooks/useMatchmaker';
import { useMovies } from '@/hooks/useMovies';
import { useToast } from '@/context';
import Button from '@/ui/Button';
import Card from '@/ui/Card';
import ConfirmDialog from '@/ui/ConfirmDialog';
import { randomUtils } from '@/utils/random';
import {
  colors,
  spacing,
  radius,
  typography,
  shadows,
  motion as motionTokens,
} from '@/design-system';
import {
  SHORT_AND_SWEET_VIBE,
  createMatchmakerPool,
  filterMoviesByVibe,
  getAvailableMatchmakerVibes,
  getMatchIds,
  getUserSwipedIds,
  selectRandomMatch,
} from './matchmakerGame';

interface MatchmakerProps {
  currentUser: User | null;
}

interface SwipeCardHandle {
  swipe: (direction: 'left' | 'right') => void;
}

interface SwipeCardProps {
  movie: Movie;
  onSwipe: (direction: 'left' | 'right') => void;
  active: boolean;
}

const MatchmakerConfetti: React.FC = () => {
  const [items] = useState(() => [...Array(30)].map((_, i) => ({
    id: i,
    left: `${randomUtils.randomRange(0, 100)}%`,
    color: [colors.accent, colors.secondary, colors.success, colors.warning][i % 4],
    shape: randomUtils.randomBool() ? '50%' : '0',
    duration: 2 + randomUtils.randomRange(0, 2),
    delay: randomUtils.randomRange(0, 0.5),
  })));

  return (
    <>
      {items.map((c) => (
        <div
          key={c.id}
          className="confetti"
          style={{
            position: 'absolute',
            left: c.left,
            top: `-20px`,
            width: '10px',
            height: '10px',
            backgroundColor: c.color,
            borderRadius: c.shape,
            animation: `confettiFall ${c.duration}s linear forwards`,
            animationDelay: `${c.delay}s`,
          }}
        />
      ))}
    </>
  );
};

const SwipeCard = React.forwardRef<SwipeCardHandle, SwipeCardProps>(({ movie, onSwipe, active }, ref) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);
  const swipeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (swipeTimeoutRef.current !== null) {
        window.clearTimeout(swipeTimeoutRef.current);
      }
    };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      swipe: (direction) => {
        if (!active || isAnimating) return;
        setIsAnimating(true);
        setAnimationDirection(direction);
        swipeTimeoutRef.current = window.setTimeout(() => {
          onSwipe(direction);
          setIsAnimating(false);
          setAnimationDirection(null);
          swipeTimeoutRef.current = null;
        }, 220);
      },
    }),
    [active, isAnimating, onSwipe]
  );

  const transform = useMemo(() => {
    if (!active) return 'scale(0.98) translateY(10px)';
    if (!isAnimating || !animationDirection) return 'scale(1)';
    return animationDirection === 'left'
      ? 'translateX(-120%) rotate(-10deg)'
      : 'translateX(120%) rotate(10deg)';
  }, [active, animationDirection, isAnimating]);

  const overlay = useMemo(() => {
    if (!isAnimating || !animationDirection) return null;
    return animationDirection === 'right'
      ? { label: 'LIKE', color: colors.success }
      : { label: 'NOPE', color: colors.error };
  }, [animationDirection, isAnimating]);

  return (
    <div
      style={{
        position: 'absolute',
        width: 'min(420px, 92vw)',
        maxWidth: '100%',
        transition: active ? 'transform 0.22s ease, opacity 0.22s ease' : 'transform 0.22s ease',
        transform,
        opacity: active ? 1 : 0.75,
        zIndex: active ? 2 : 1,
        pointerEvents: active ? 'auto' : 'none',
      }}
    >
      <Card
        style={{
          padding: spacing.lg,
          borderRadius: radius.card,
          border: `2px solid ${colors.borderSecondary}40`,
          background: colors.surface,
          boxShadow: active ? shadows.cardElevated : shadows.card,
        }}
      >
        {overlay && (
          <div
            style={{
              position: 'absolute',
              top: spacing.lg,
              left: spacing.lg,
              padding: '6px 10px',
              borderRadius: radius.full,
              border: `2px solid ${overlay.color}`,
              color: overlay.color,
              fontWeight: typography.fontWeight.bold,
              letterSpacing: typography.letterSpacing.eyebrow,
              background: 'rgba(0,0,0,0.25)',
            }}
          >
            {overlay.label}
          </div>
        )}

        <div style={{ display: 'flex', gap: spacing.md, alignItems: 'flex-start' }}>
          {movie.posterUrl ? (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              style={{
                width: 92,
                height: 132,
                objectFit: 'cover',
                borderRadius: radius.md,
                border: `1px solid ${colors.borderSecondary}35`,
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 92,
                height: 132,
                borderRadius: radius.md,
                border: `1px solid ${colors.borderSecondary}35`,
                background: `${colors.borderSecondary}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.textTertiary,
                fontSize: typography.fontSize.xs,
                flexShrink: 0,
              }}
            >
              No poster
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                margin: 0,
                marginBottom: spacing.xs,
                color: colors.textPrimary,
                fontFamily: typography.fontFamily.heading.join(', '),
                fontSize: typography.fontSize.lg,
                textShadow: shadows.textGlow,
              }}
            >
              {movie.title}
            </h3>

            <div style={{ color: colors.textSecondary, fontSize: typography.fontSize.sm }}>
              {movie.year ? <span>{movie.year}</span> : null}
              {movie.runtime ? (
                <span>
                  {movie.year ? ' • ' : ''}
                  {movie.runtime}
                </span>
              ) : null}
            </div>

            {(movie.genre || movie.category) && (
              <div
                style={{
                  marginTop: spacing.sm,
                  color: colors.textTertiary,
                  fontSize: typography.fontSize.xs,
                }}
              >
                {[movie.category, movie.genre].filter(Boolean).join(' • ')}
              </div>
            )}

            {movie.plot && (
              <p
                style={{
                  marginTop: spacing.sm,
                  marginBottom: 0,
                  color: colors.textSecondary,
                  fontSize: typography.fontSize.sm,
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {movie.plot}
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
});

SwipeCard.displayName = 'SwipeCard';

const Matchmaker: React.FC<MatchmakerProps> = ({ currentUser }) => {
  const { showToast } = useToast();
  const { movies, isLoading: isMoviesLoading } = useMovies(currentUser);
  const {
    game,
    isLoading: isGameLoading,
    isSubmitting,
    startNewGame,
    swipe,
    undo,
    endCurrentGame,
  } = useMatchmaker(currentUser);

  const [isPickingRandom, setIsPickingRandom] = useState(false);
  const [showEndSessionConfirm, setShowEndSessionConfirm] = useState(false);

  const unwatchedMovies = useMemo(
    () => (movies ? movies.filter((m) => m.watchedBy.length < 2) : []),
    [movies]
  );

  const movieMap = useMemo(() => {
    return new Map(movies?.map((m) => [m.id, m]));
  }, [movies]);

  const activePoolMovies = useMemo(() => {
    if (!game || !movieMap) return [];
    return game.moviePool.map((id) => movieMap.get(id)).filter((m): m is Movie => !!m);
  }, [game, movieMap]);

  const swipedIds = useMemo(() => getUserSwipedIds(game, currentUser), [currentUser, game]);

  const remainingMovies = useMemo(() => {
    const swipedSet = new Set(swipedIds);
    return activePoolMovies.filter((m) => !swipedSet.has(m.id));
  }, [activePoolMovies, swipedIds]);

  const matches = useMemo(() => {
    if (!game || !movieMap) return [];
    return getMatchIds(game).map((id) => movieMap.get(id)).filter((m): m is Movie => !!m);
  }, [game, movieMap]);
  const isSessionComplete = game?.status === 'completed';

  const cardRef = useRef<SwipeCardHandle>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastMatchedMovie, setLastMatchedMovie] = useState<Movie | null>(null);
  const lastMatchCount = useRef(matches.length);
  const matchOverlayTimeoutRef = useRef<number | null>(null);
  const randomPickTimeoutRef = useRef<number | null>(null);

  const clearTransientUiState = useCallback(() => {
    if (matchOverlayTimeoutRef.current !== null) {
      window.clearTimeout(matchOverlayTimeoutRef.current);
      matchOverlayTimeoutRef.current = null;
    }
    if (randomPickTimeoutRef.current !== null) {
      window.clearTimeout(randomPickTimeoutRef.current);
      randomPickTimeoutRef.current = null;
    }
    setIsPickingRandom(false);
    setShowConfetti(false);
    setLastMatchedMovie(null);
    lastMatchCount.current = 0;
  }, []);

  useEffect(() => {
    return clearTransientUiState;
  }, [clearTransientUiState]);

  useEffect(() => {
    if (game) return;
    const timer = window.setTimeout(() => {
      clearTransientUiState();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [clearTransientUiState, game]);

  useEffect(() => {
    if (matches.length > lastMatchCount.current && matches.length > 0) {
      const newMatchId = matches[matches.length - 1].id;
      const newMatch = movies?.find((m) => m.id === newMatchId);
      if (newMatch) {
        setTimeout(() => {
          if (matchOverlayTimeoutRef.current !== null) {
            window.clearTimeout(matchOverlayTimeoutRef.current);
          }
          setLastMatchedMovie(newMatch);
          setShowConfetti(true);
          matchOverlayTimeoutRef.current = window.setTimeout(() => {
            setShowConfetti(false);
            setLastMatchedMovie(null);
            matchOverlayTimeoutRef.current = null;
          }, 4000);
        }, 0);
      }
    }
    lastMatchCount.current = matches.length;
  }, [matches.length, movies, matches]);

  const availableVibes = useMemo(() => getAvailableMatchmakerVibes(unwatchedMovies), [unwatchedMovies]);

  const handleStart = (selectedVibe: string | null = null) => {
    if (!currentUser) return;
    clearTransientUiState();

    const filteredMovies = filterMoviesByVibe(unwatchedMovies, selectedVibe);

    if (filteredMovies.length < 3) {
      const vibeLabel = selectedVibe ? `${selectedVibe} ` : '';
      showToast({
        message: `Not enough ${vibeLabel}movies in your queue. Add at least 3 to start.`,
        type: 'info',
      });
      return;
    }

    startNewGame(createMatchmakerPool(unwatchedMovies, selectedVibe));
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    const [activeMovie] = remainingMovies;
    if (activeMovie) {
      swipe(activeMovie.id, direction === 'right');
    }
  };

  const handleButtonClick = (direction: 'left' | 'right') => {
    if (cardRef.current && remainingMovies.length > 0) {
      cardRef.current.swipe(direction);
    }
  };

  const handlePickRandom = () => {
    if (matches.length === 0 || isPickingRandom) return;
    if (randomPickTimeoutRef.current !== null) {
      window.clearTimeout(randomPickTimeoutRef.current);
    }
    if (matchOverlayTimeoutRef.current !== null) {
      window.clearTimeout(matchOverlayTimeoutRef.current);
    }
    setIsPickingRandom(true);
    randomPickTimeoutRef.current = window.setTimeout(() => {
      const winner = selectRandomMatch(matches, Math.random);
      if (!winner) {
        setIsPickingRandom(false);
        randomPickTimeoutRef.current = null;
        return;
      }
      setIsPickingRandom(false);
      setLastMatchedMovie(winner);
      setShowConfetti(true);
      matchOverlayTimeoutRef.current = window.setTimeout(() => {
        setShowConfetti(false);
        setLastMatchedMovie(null);
        matchOverlayTimeoutRef.current = null;
      }, 4000);
      randomPickTimeoutRef.current = null;
    }, 1500);
  };

  if (isGameLoading || isMoviesLoading) {
    return (
      <div style={{ color: colors.textSecondary, padding: spacing.lg, textAlign: 'center' }}>
        Syncing Matchmaker...
      </div>
    );
  }

  if (!game) {
    return (
      <div style={{ textAlign: 'center', padding: spacing.sm }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.md,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: spacing.sm,
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginBottom: spacing.md,
              maxWidth: '600px',
            }}
          >
            {availableVibes.length > 0 ? (
              availableVibes.map((v) => (
                <Button
                  key={v}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleStart(v)}
                  disabled={!currentUser || isSubmitting}
                  style={{
                    border: `1px solid ${colors.borderSecondary}50`,
                    borderRadius: radius.full,
                    textTransform: 'capitalize',
                  }}
                >
                  {v}
                </Button>
              ))
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleStart(SHORT_AND_SWEET_VIBE)}
              disabled={!currentUser || isSubmitting}
              style={{
                border: `1px solid ${colors.secondary}50`,
                color: colors.secondary,
                borderRadius: radius.full,
              }}
            >
              ⏱️ Under 100m
            </Button>
          </div>

          <Button
            variant="secondary"
            onClick={() => handleStart(null)}
            isLoading={isSubmitting}
            size="lg"
            disabled={!currentUser}
          >
            Surprise Us (Random 10)
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: spacing.lg,
        position: 'relative',
      }}
    >
      {(showConfetti || lastMatchedMovie) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 200,
            pointerEvents: 'none',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.3s ease-out',
          }}
        >
          {showConfetti && <MatchmakerConfetti />}

          {lastMatchedMovie && (
            <div
              style={{
                textAlign: 'center',
                animation: 'popInMatch 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(20, 20, 40, 0.95)',
                padding: spacing.xl,
                borderRadius: radius.lg,
                border: `2px solid ${colors.accent}`,
                boxShadow: shadows.glowStrong,
              }}
            >
              <div
                style={{
                  fontFamily: typography.fontFamilyValue.heading,
                  fontSize: typography.fontSize.lg,
                  color: colors.accent,
                  marginBottom: spacing.sm,
                  fontWeight: typography.fontWeight.bold,
                  lineHeight: typography.lineHeight.heading,
                  letterSpacing: typography.letterSpacing.button,
                  textShadow: shadows.textGlow,
                }}
              >
                IT'S A MATCH!
              </div>
              <img
                src={lastMatchedMovie.posterUrl}
                alt={lastMatchedMovie.title}
                style={{
                  width: '180px',
                  height: '270px',
                  borderRadius: radius.md,
                  objectFit: 'cover',
                  marginBottom: spacing.md,
                  border: `1px solid ${colors.textPrimary}40`,
                }}
              />
              <h3
                style={{
                  margin: 0,
                  fontSize: typography.fontSize.lg,
                  color: colors.textPrimary,
                  textShadow: shadows.textGlow,
                }}
              >
                {lastMatchedMovie.title}
              </h3>
              <div style={{ marginTop: spacing.md, fontSize: '2rem' }}>💖🍿🎬🍿💖</div>
            </div>
          )}
        </div>
      )}

      {/* Stats Header */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: `0 ${spacing.md}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
          <div style={{ color: colors.textTertiary, fontSize: typography.fontSize.sm }}>
            Matches:
          </div>
          <div
            style={{
              color: colors.accent,
              fontWeight: 'bold',
              textShadow: shadows.textGlow,
              fontSize: typography.fontSize.lg,
              animation: showConfetti ? 'pulse 0.5s ease infinite' : 'none',
            }}
          >
            {matches.length}
          </div>
        </div>
        <div style={{ color: colors.textTertiary, fontSize: typography.fontSize.sm }}>
          {swipedIds.length} / {game.moviePool.length} swiped
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowEndSessionConfirm(true)}>
          Reset
        </Button>
      </div>

      {/* Swipe Area */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '520px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          padding: spacing.md,
        }}
      >
        {remainingMovies.length > 0 ? (
          <>
            {remainingMovies.length > 1 && (
              <SwipeCard
                key={remainingMovies[1].id}
                movie={remainingMovies[1]}
                onSwipe={() => {}}
                active={false}
              />
            )}
            <SwipeCard
              ref={cardRef}
              key={remainingMovies[0].id}
              movie={remainingMovies[0]}
              onSwipe={handleSwipe}
              active
            />
          </>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: spacing.xl,
              animation: `fadeIn ${motionTokens.duration.slow} ${motionTokens.easing.easeOut}`,
            }}
          >
            <div style={{ fontSize: '4rem', marginBottom: spacing.md }}>🎬</div>
            <h3
              style={{
                color: colors.textPrimary,
                fontFamily: typography.fontFamilyValue.heading,
                marginBottom: spacing.xs,
              }}
            >
              {isSessionComplete ? 'Session Complete!' : 'All Caught Up!'}
            </h3>
            <p style={{ color: colors.textSecondary, fontSize: typography.fontSize.sm }}>
              {isSessionComplete
                ? matches.length > 0
                  ? 'Both players finished. Review your mutual picks below or let Matchmaker choose one.'
                  : 'Both players finished this round without a mutual pick. Reset to try another batch.'
                : `Waiting for ${currentUser === 'Aaron' ? 'Electra' : 'Aaron'} to finish their swipes.`}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {(remainingMovies.length > 0 || swipedIds.length > 0) && (
        <div
          style={{
            display: 'flex',
            gap: spacing.xl,
            alignItems: 'center',
            marginBottom: spacing.md,
            zIndex: 10,
          }}
        >
          {remainingMovies.length > 0 && (
            <Button
              variant="ghost"
              style={{
                borderRadius: '50%',
                width: '60px',
                height: '60px',
                border: `2px solid ${colors.error}`,
                color: colors.error,
                fontSize: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: shadows.glow,
                padding: 0,
                background: 'rgba(248, 113, 113, 0.1)',
              }}
              onClick={() => handleButtonClick('left')}
              disabled={isSubmitting}
            >
              ✕
            </Button>
          )}

          {swipedIds.length > 0 && (
            <Button
              variant="ghost"
              style={{
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                border: `2px solid ${colors.textTertiary}`,
                color: colors.textTertiary,
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                opacity: isSubmitting ? 0.5 : 1,
              }}
              onClick={undo}
              disabled={isSubmitting}
              title="Undo last swipe"
            >
              ↺
            </Button>
          )}

          {remainingMovies.length > 0 && (
            <Button
              variant="ghost"
              style={{
                borderRadius: '50%',
                width: '60px',
                height: '60px',
                border: `2px solid ${colors.success}`,
                color: colors.success,
                fontSize: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: shadows.glow,
                padding: 0,
                background: 'rgba(74, 222, 128, 0.1)',
              }}
              onClick={() => handleButtonClick('right')}
              disabled={isSubmitting}
            >
              💖
            </Button>
          )}
        </div>
      )}

      {/* Matches Display */}
      {matches.length > 0 && (
        <div
          style={{
            width: '100%',
            padding: spacing.md,
            animation: `fadeInUp ${motionTokens.duration.normal} ${motionTokens.easing.easeOut}`,
            borderTop: `1px solid ${colors.borderSecondary}30`,
            marginTop: spacing.md,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing.sm,
            }}
          >
            <h4
              style={{
                color: colors.accent,
                fontFamily: typography.fontFamily.heading.join(', '),
                fontSize: typography.fontSize.base,
                margin: 0,
                textShadow: shadows.textGlow,
              }}
            >
              It's a Match!
            </h4>
            {matches.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePickRandom}
                isLoading={isPickingRandom}
                style={{
                  fontSize: typography.fontSize['2xs'],
                  textTransform: typography.presets.buttonLabel.textTransform,
                  color: colors.secondary,
                  border: `1px solid ${colors.secondary}50`,
                }}
              >
                {isPickingRandom ? 'Choosing...' : matches.length === 1 ? 'Highlight Match' : 'Pick for Us'}
              </Button>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              gap: spacing.md,
              overflowX: 'auto',
              padding: spacing.sm,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {matches.map((movie) => (
              <div key={movie.id} style={{ flexShrink: 0, width: '100px', textAlign: 'center' }}>
                {movie.posterUrl ? (
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    style={{
                      width: '100px',
                      height: '150px',
                      borderRadius: radius.md,
                      objectFit: 'cover',
                      border: `2px solid ${colors.accent}`,
                      boxShadow: shadows.glow,
                      marginBottom: spacing.xs,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100px',
                      height: '150px',
                      borderRadius: radius.md,
                      border: `2px solid ${colors.accent}`,
                      boxShadow: shadows.glow,
                      marginBottom: spacing.xs,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.textTertiary,
                      background: `${colors.borderSecondary}22`,
                      fontSize: typography.fontSize['2xs'],
                      textTransform: typography.presets.badge.textTransform,
                    }}
                  >
                    No poster
                  </div>
                )}
                <div
                  style={{
                    fontSize: typography.fontSize['2xs'],
                    color: colors.textTertiary,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textTransform: typography.presets.badge.textTransform,
                  }}
                >
                  {movie.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showEndSessionConfirm}
        title="Reset Matchmaker"
        message="Are you sure you want to reset this matchmaker session?"
        confirmText="Reset Session"
        onConfirm={() => {
          clearTransientUiState();
          endCurrentGame();
          setShowEndSessionConfirm(false);
        }}
        onCancel={() => setShowEndSessionConfirm(false)}
      />
    </div>
  );
};

export default Matchmaker;
