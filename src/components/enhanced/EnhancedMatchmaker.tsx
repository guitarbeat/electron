/**
 * Enhanced Matchmaker Component
 * Improved matchmaker interface with better UX, animations, and error handling
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useEnhancedMatchmaker } from '../../hooks/useEnhancedMatchmaker';
import { useMovies } from '../../hooks/useMovies';
import { useToast } from '../../context/ToastContext';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { LoadingSpinner, LoadingCard, LoadingOverlay } from '../common/LoadingStates';
import SwipeCard from '../matchmaker/SwipeCard';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import {
  colors,
  spacing,
  radius,
  typography,
  shadows,
} from '../../design-system/tokens';

import { User, MatchmakerGame, Movie } from '../../types';

interface EnhancedMatchmakerProps {
  currentUser: User | null;
}

const EnhancedMatchmaker: React.FC<EnhancedMatchmakerProps> = ({ currentUser }) => {
  const { showToast } = useToast();
  const { movies, isLoading: isMoviesLoading } = useMovies(currentUser);

  const {
    game,
    isLoading: isGameLoading,
    error,
    isSubmitting,
    workflowState,
    flowState,
    matches,
    matchAnimation,
    lastMatchedMovie,
    startNewGame,
    swipe,
    undo,
    endCurrentGame,
    retry,
    getRemainingMovies,
  } = useEnhancedMatchmaker(currentUser, {
    onMatchFound: (movie) => {
      showToast({
        message: `🎉 It's a match! ${movie.title}`,
        type: 'success',
      });
    },
    onGameComplete: (matches) => {
      showToast({
        message: `🎬 Game complete! You found ${matches.length} matches!`,
        type: 'success',
      });
    },
    enableAnimations: true,
    autoRetry: true,
  });

  const [isPickingRandom, setIsPickingRandom] = useState(false);
  const [randomWinner, setRandomWinner] = useState(null);
  const [showEndSessionConfirm, setShowEndSessionConfirm] = useState(false);
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);

  const cardRef = useRef<any>(null);

  // Memoized calculations
  const unwatchedMovies = useMemo(
    () => (movies ? movies.filter((m) => m.watchedBy.length < 2) : []),
    [movies]
  );

  const movieMap = useMemo(() => {
    return new Map(movies?.map((m) => [m.id, m]));
  }, [movies]);

  const activePoolMovies = useMemo(() => {
    if (!game || !movieMap) return [];
    return game.moviePool.map((id) => movieMap.get(id)).filter((m) => !!m);
  }, [game, movieMap]);

  const swipedIds = useMemo(() => {
    if (!game) return [];
    const userLikes = currentUser === 'Aaron' ? game.aaronLikes || [] : game.electraLikes || [];
    const userDislikes = currentUser === 'Aaron' ? game.aaronDislikes || [] : game.electraDislikes || [];
    return [...userLikes, ...userDislikes];
  }, [game, currentUser]);

  const remainingMovies = useMemo(() => {
    return getRemainingMovies(movies || []);
  }, [getRemainingMovies, movies]);

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

  // Enhanced start handler with flow management
  const handleStart = async (selectedVibe: string | null = null) => {
    if (!currentUser) {
      showToast({
        message: 'Please select a user to start',
        type: 'error',
      });
      return;
    }

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

    const shuffled = poolSource.sort(() => 0.5 - Math.random());
    const pool = shuffled.slice(0, 10).map((m) => m.id);

    setSelectedVibe(selectedVibe);
    await startNewGame(pool, selectedVibe);
  };

  // Enhanced swipe handler with feedback
  const handleSwipe = async (direction: 'left' | 'right') => {
    if (remainingMovies.length > 0) {
      const activeMovie = remainingMovies[0];
      await swipe(activeMovie.id, direction === 'right');
    }
  };

  const handleButtonClick = (direction: 'left' | 'right') => {
    if (cardRef.current && remainingMovies.length > 0) {
      cardRef.current.swipe(direction);
    }
  };

  // Enhanced random picker with better UX
  const handlePickRandom = () => {
    if (matches.length < 2) return;
    setIsPickingRandom(true);

    setTimeout(() => {
      const winner = matchedMovies[Math.floor(Math.random() * matchedMovies.length)];
      setRandomWinner(winner);
      setIsPickingRandom(false);
      showToast({
        message: `🎲 Random pick: ${winner.title}`,
        type: 'success',
      });
    }, 1500);
  };

  // Loading state
  if (isGameLoading || isMoviesLoading) {
    return (
      <div style={{ padding: spacing.lg }}>
        <div style={{ textAlign: 'center', marginBottom: spacing.lg }}>
          <LoadingSpinner size="lg" />
          <p style={{ color: colors.textSecondary, marginTop: spacing.md }}>
            Syncing Matchmaker...
          </p>
        </div>
        <LoadingCard title text={3} image />
      </div>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: spacing.lg }}>
        <div style={{
          color: colors.error,
          marginBottom: spacing.lg,
          padding: spacing.md,
          border: `1px solid ${colors.error}30`,
          borderRadius: radius.md,
          backgroundColor: `${colors.error}10`,
        }}>
          <h3>Connection Error</h3>
          <p>{error}</p>
          <Button onClick={retry} variant="secondary" size="sm">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Game setup state
  if (!game) {
    return (
      <div style={{ textAlign: 'center', padding: spacing.sm }}>
        <p style={{
          color: colors.textSecondary,
          margin: '0 auto',
          marginBottom: spacing.lg,
          maxWidth: 420,
          fontSize: typography.fontSize.sm,
        }}>
          Pick a vibe and swipe on 10 movies. If you both like one, it's a match.
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.md,
          alignItems: 'center',
        }}>
          <div style={{
            display: 'flex',
            gap: spacing.sm,
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginBottom: spacing.md,
            maxWidth: '600px',
          }}>
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

  // Map string IDs from hook to actual Movie objects
  const matchedMovies = useMemo(() => {
    return matches.map(id => movieMap.get(id)).filter((m): m is Movie => !!m);
  }, [matches, movieMap]);

  // Active game state
  return (
    <ErrorBoundary>
      <LoadingOverlay isLoading={isSubmitting} message="Updating...">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: spacing.lg,
          position: 'relative',
        }}>
          {/* Match Animation Overlay */}
          {matchAnimation && lastMatchedMovie && (
            <div style={{
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
            }}>
              <div style={{
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
              }}>
                <div style={{
                  fontSize: '1.2rem',
                  color: colors.accent,
                  marginBottom: spacing.sm,
                  fontWeight: 'bold',
                  textShadow: shadows.textGlow,
                }}>
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
                <h3 style={{
                  margin: 0,
                  fontSize: typography.fontSize.lg,
                  color: colors.textPrimary,
                  textShadow: shadows.textGlow,
                }}>
                  {lastMatchedMovie.title}
                </h3>
                <div style={{ marginTop: spacing.md, fontSize: '2rem' }}>
                  💖🍿🎬🍿💖
                </div>
              </div>
            </div>
          )}

          {/* Stats Header */}
          <div style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: `0 ${spacing.md}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <div style={{ color: colors.textTertiary, fontSize: typography.fontSize.sm }}>
                Matches:
              </div>
              <div style={{
                color: colors.accent,
                fontWeight: 'bold',
                textShadow: shadows.textGlow,
                fontSize: typography.fontSize.lg,
                animation: matchAnimation ? 'pulse 0.5s ease infinite' : 'none',
              }}>
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
          <div style={{
            position: 'relative',
            width: '100%',
            height: '520px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            padding: spacing.md,
          }}>
            {remainingMovies.length > 0 ? (
              <>
                {remainingMovies.length > 1 && (
                  <SwipeCard
                    key={remainingMovies[1].id}
                    movie={remainingMovies[1]}
                    onSwipe={() => { }}
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
              <div style={{
                textAlign: 'center',
                padding: spacing.xl,
              }}>
                <div style={{ fontSize: '4rem', marginBottom: spacing.md }}>🎬</div>
                <h3 style={{
                  color: colors.textPrimary,
                  fontFamily: typography.fontFamily.heading.join(', '),
                  marginBottom: spacing.xs,
                }}>
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
            <div style={{
              display: 'flex',
              gap: spacing.xl,
              alignItems: 'center',
              marginBottom: spacing.md,
              zIndex: 10,
            }}>
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
            <div style={{
              width: '100%',
              padding: spacing.md,
              borderTop: `1px solid ${colors.borderSecondary}30`,
              marginTop: spacing.md,
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing.sm,
              }}>
                <h4 style={{
                  color: colors.accent,
                  fontFamily: typography.fontFamily.heading.join(', '),
                  fontSize: typography.fontSize.base,
                  margin: 0,
                  textShadow: shadows.textGlow,
                }}>
                  It's a Match!
                </h4>
                {matches.length >= 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePickRandom}
                    isLoading={isPickingRandom}
                    style={{
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      color: colors.secondary,
                      border: `1px solid ${colors.secondary}50`,
                    }}
                  >
                    {isPickingRandom ? 'Choosing...' : 'Pick for Us'}
                  </Button>
                )}
              </div>
              <div style={{
                display: 'flex',
                gap: spacing.md,
                overflowX: 'auto',
                padding: spacing.sm,
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}>
                {matchedMovies.map((movie) => (
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
                    <div style={{
                      fontSize: '10px',
                      color: colors.textTertiary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      textTransform: 'uppercase',
                    }}>
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
              endCurrentGame();
              setShowEndSessionConfirm(false);
            }}
            onCancel={() => setShowEndSessionConfirm(false)}
          />
        </div>
      </LoadingOverlay>
    </ErrorBoundary>
  );
};

export default EnhancedMatchmaker;
