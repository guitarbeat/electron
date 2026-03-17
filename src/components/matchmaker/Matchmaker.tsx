import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { User, Movie } from '@/types';
import { useMatchmaker } from '@/hooks/useMatchmaker';
import { useMovies } from '@/hooks/useMovies';
import { useToast } from '@/context';
import SwipeCard from './SwipeCard';
import Button from '@/ui/Button';
import ConfirmDialog from '@/ui/ConfirmDialog';
import { shuffleArray } from '@/utils';
import {
  colors,
  spacing,
  radius,
  typography,
  shadows,
  motion as motionTokens,
} from '@/design-system';

interface MatchmakerProps {
  currentUser: User | null;
}

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
  const [randomWinner, setRandomWinner] = useState<Movie | null>(null);
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

  const swipedIds = useMemo(() => {
    const userLikes = currentUser === 'Aaron' ? game?.aaronLikes || [] : game?.electraLikes || [];
    const userDislikes =
      currentUser === 'Aaron' ? game?.aaronDislikes || [] : game?.electraDislikes || [];
    return [...userLikes, ...userDislikes];
  }, [
    currentUser,
    game?.aaronLikes,
    game?.electraLikes,
    game?.aaronDislikes,
    game?.electraDislikes,
  ]);

  const remainingMovies = useMemo(() => {
    const swipedSet = new Set(swipedIds);
    return activePoolMovies.filter((m) => !swipedSet.has(m.id));
  }, [activePoolMovies, swipedIds]);

  const matches = useMemo(() => {
    if (!game || !movieMap) return [];
    const electraLikesSet = new Set(game.electraLikes);
    const intersection = game.aaronLikes.filter((id) => electraLikesSet.has(id));
    return intersection.map((id) => movieMap.get(id)).filter((m): m is Movie => !!m);
  }, [game, movieMap]);

  const cardRef = useRef<any>(null);
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
    setRandomWinner(null);
    setShowConfetti(false);
    setLastMatchedMovie(null);
    lastMatchCount.current = 0;
  }, []);

  useEffect(() => {
    return clearTransientUiState;
  }, [clearTransientUiState]);

  useEffect(() => {
    if (!game) {
      clearTransientUiState();
    }
  }, [clearTransientUiState, game]);

  useEffect(() => {
    if (matches.length > lastMatchCount.current && matches.length > 0) {
      const newMatchId = matches[matches.length - 1].id;
      const newMatch = movies?.find((m) => m.id === newMatchId);
      if (newMatch) {
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
      }
    }
    lastMatchCount.current = matches.length;
  }, [matches.length, movies, matches]);

  const availableVibes = useMemo(() => {
    const counts: Record<string, number> = {};
    unwatchedMovies.forEach((m) => {
      const tags = [
        ...(m.genre ? m.genre.split(',').map((g) => g.trim()) : []),
        ...(m.category ? [m.category] : []),
      ];
      tags.forEach((tag) => {
        const clean = tag?.trim();
        if (!clean) return;
        counts[clean] = (counts[clean] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([vibe]) => vibe);
  }, [unwatchedMovies]);

  const [vibe, setVibe] = useState<string | null>(null);

  const handleStart = (selectedVibe: string | null = null) => {
    if (!currentUser) return;
    clearTransientUiState();

    let poolSource = [...unwatchedMovies];
    if (selectedVibe === 'Short & Sweet') {
      poolSource = poolSource.filter((m) => {
        const mins = parseInt(m.runtime || '120', 10);
        return mins > 0 && mins < 100;
      });
    } else if (selectedVibe) {
      poolSource = poolSource.filter(
        (m) =>
          m.genre?.toLowerCase().includes(selectedVibe.toLowerCase()) ||
          m.category?.toLowerCase().includes(selectedVibe.toLowerCase())
      );
    }

    if (poolSource.length < 3) {
      const vibeLabel = selectedVibe ? `${selectedVibe} ` : '';
      showToast({
        message: `Not enough ${vibeLabel}movies in your queue. Add at least 3 to start.`,
        type: 'info',
      });
      return;
    }

    const shuffled = shuffleArray(poolSource);
    const pool = shuffled.slice(0, 10).map((m) => m.id);
    startNewGame(pool);
    setVibe(selectedVibe);
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
    if (matches.length < 2 || isPickingRandom) return;
    if (randomPickTimeoutRef.current !== null) {
      window.clearTimeout(randomPickTimeoutRef.current);
    }
    if (matchOverlayTimeoutRef.current !== null) {
      window.clearTimeout(matchOverlayTimeoutRef.current);
    }
    setIsPickingRandom(true);
    randomPickTimeoutRef.current = window.setTimeout(() => {
      const winner = matches[Math.floor(Math.random() * matches.length)];
      setRandomWinner(winner);
      setIsPickingRandom(false);
      setLastMatchedMovie(winner);
      setShowConfetti(true);
      matchOverlayTimeoutRef.current = window.setTimeout(() => {
        setShowConfetti(false);
        setLastMatchedMovie(null);
        setRandomWinner(null);
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
        <p
          style={{
            color: colors.textSecondary,
            margin: '0 auto',
            marginBottom: spacing.lg,
            maxWidth: 420,
            fontSize: typography.fontSize.sm,
          }}
        >
          Pick a vibe and swipe on 10 movies. If you both like one, it's a match.
        </p>

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
            ) : (
              <div style={{ color: colors.textTertiary, fontSize: typography.fontSize.xs }}>
                Add movies with genres to filter by vibe!
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleStart('Short & Sweet')}
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
            {currentUser ? 'Surprise Us (Random 10)' : 'Pick User to Start'}
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
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                position: 'absolute',
                left: `${Math.random() * 100}%`,
                top: `-20px`,
                width: '10px',
                height: '10px',
                backgroundColor: [colors.accent, colors.secondary, colors.success, colors.warning][
                  i % 4
                ],
                borderRadius: Math.random() > 0.5 ? '50%' : '0',
                animation: `confettiFall ${2 + Math.random() * 2}s linear forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            />
          ))}

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
              All Caught Up!
            </h3>
            <p style={{ color: colors.textSecondary, fontSize: typography.fontSize.sm }}>
              Waiting for {currentUser === 'Aaron' ? 'Electra' : 'Aaron'} to finish their swipes.
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
            {matches.length >= 2 && (
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
                {isPickingRandom ? 'Choosing...' : 'Pick for Us'}
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
        title="End Session"
        message="Are you sure you want to end this matchmaker session?"
        confirmText="End Session"
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
