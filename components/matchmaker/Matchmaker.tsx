import React, { useState, useMemo } from 'react';
import { User, Movie } from '../../types';
import { useMatchmaker } from '../../hooks/useMatchmaker';
import { useMovies } from '../../hooks/useMovies';
import SwipeCard from './SwipeCard';
import Button from '../ui/Button';
import { colors, spacing, radius, typography, shadows, motion as motionTokens } from '../../design-system/tokens';

interface MatchmakerProps {
    currentUser: User | null;
}

const Matchmaker: React.FC<MatchmakerProps> = ({ currentUser }) => {
    const { movies, isLoading: isMoviesLoading } = useMovies(currentUser);
    const {
        game,
        isLoading: isGameLoading,
        isSubmitting,
        startNewGame,
        swipe,
        endCurrentGame,
    } = useMatchmaker(currentUser);

    const unwatchedMovies = useMemo(
        () => (movies ? movies.filter((m) => m.watchedBy.length < 2) : []),
        [movies]
    );

    const activePoolMovies = useMemo(() => {
        if (!game || !movies) return [];
        return game.moviePool
            .map((id) => movies.find((m) => m.id === id))
            .filter((m): m is Movie => !!m);
    }, [game, movies]);

    const userLikes = currentUser === 'Aaron' ? game?.aaronLikes || [] : game?.electraLikes || [];
    const userDislikes = currentUser === 'Aaron' ? game?.aaronDislikes || [] : game?.electraDislikes || [];
    const swipedIds = [...userLikes, ...userDislikes];

    const remainingMovies = useMemo(() => {
        return activePoolMovies.filter((m) => !swipedIds.includes(m.id));
    }, [activePoolMovies, swipedIds]);

    const matches = useMemo(() => {
        if (!game || !movies) return [];
        const intersection = game.aaronLikes.filter((id) => game.electraLikes.includes(id));
        return intersection
            .map((id) => movies.find((m) => m.id === id))
            .filter((m): m is Movie => !!m);
    }, [game, movies]);

    const handleStart = () => {
        if (!currentUser) return;
        if (unwatchedMovies.length < 3) {
            alert('Add at least 3 movies to your queue to start a Matchmaker session!');
            return;
        }
        // Shuffle and pick up to 15
        const shuffled = [...unwatchedMovies].sort(() => 0.5 - Math.random());
        const pool = shuffled.slice(0, 15).map((m) => m.id);
        startNewGame(pool);
    };

    const handleSwipe = (direction: 'left' | 'right') => {
        if (remainingMovies.length > 0) {
            const activeMovie = remainingMovies[0];
            swipe(activeMovie.id, direction === 'right');
        }
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
            <div style={{ textAlign: 'center', padding: spacing.xl }}>
                <h2
                    style={{
                        color: colors.textPrimary,
                        fontFamily: typography.fontFamily.heading.join(', '),
                        marginBottom: spacing.md,
                        fontSize: typography.fontSize['2xl'],
                        textShadow: shadows.textGlow,
                    }}
                >
                    Matchmaker
                </h2>
                <p style={{ color: colors.textSecondary, marginBottom: spacing.xl, maxWidth: '500px', margin: '0 auto 2rem' }}>
                    Pick 15 movies from your queue and swipe on them. When you both swipe right on the same one, it's a match!
                </p>
                <Button
                    variant="secondary"
                    onClick={handleStart}
                    isLoading={isSubmitting}
                    size="lg"
                    disabled={!currentUser}
                >
                    {currentUser ? 'Start New Session' : 'Pick Aaron or Electra to start'}
                </Button>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.lg }}>
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
                <div style={{ color: colors.textTertiary, fontSize: typography.fontSize.sm }}>
                    Matches:{' '}
                    <span style={{ color: colors.accent, fontWeight: 'bold', textShadow: shadows.textGlow }}>
                        {matches.length}
                    </span>
                </div>
                <div style={{ color: colors.textTertiary, fontSize: typography.fontSize.sm }}>
                    {swipedIds.length} / {game.moviePool.length} swiped
                </div>
                <Button variant="ghost" size="sm" onClick={() => {
                    if (window.confirm('Are you sure you want to end this session?')) {
                        endCurrentGame();
                    }
                }}>
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
                    <SwipeCard
                        key={remainingMovies[0].id}
                        movie={remainingMovies[0]}
                        onSwipe={handleSwipe}
                    />
                ) : (
                    <div
                        style={{
                            textAlign: 'center',
                            padding: spacing.xl,
                            animation: `fadeIn ${motionTokens.duration.slow} ${motionTokens.easing.easeOut}`
                        }}
                    >
                        <div style={{ fontSize: '4rem', marginBottom: spacing.md }}>🎬</div>
                        <h3
                            style={{
                                color: colors.textPrimary,
                                fontFamily: typography.fontFamily.heading.join(', '),
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
            {remainingMovies.length > 0 && (
                <div style={{ display: 'flex', gap: spacing.xl, marginBottom: spacing.md }}>
                    <Button
                        variant="ghost"
                        style={{
                            borderRadius: '50%',
                            width: '70px',
                            height: '70px',
                            border: `2px solid ${colors.error}`,
                            color: colors.error,
                            fontSize: '1.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: shadows.glow,
                            padding: 0,
                        }}
                        onClick={() => handleSwipe('left')}
                        disabled={isSubmitting}
                    >
                        ✕
                    </Button>
                    <Button
                        variant="ghost"
                        style={{
                            borderRadius: '50%',
                            width: '70px',
                            height: '70px',
                            border: `2px solid ${colors.success}`,
                            color: colors.success,
                            fontSize: '1.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: shadows.glow,
                            padding: 0,
                        }}
                        onClick={() => handleSwipe('right')}
                        disabled={isSubmitting}
                    >
                        💖
                    </Button>
                </div>
            )}

            {/* Matches Display */}
            {matches.length > 0 && (
                <div
                    style={{
                        width: '100%',
                        padding: spacing.md,
                        animation: `fadeInUp ${motionTokens.duration.normal} ${motionTokens.easing.easeOut}`
                    }}
                >
                    <h4
                        style={{
                            color: colors.accent,
                            fontFamily: typography.fontFamily.heading.join(', '),
                            fontSize: typography.fontSize.base,
                            marginBottom: spacing.sm,
                            textAlign: 'center',
                            textShadow: shadows.textGlow,
                        }}
                    >
                        It's a Match!
                    </h4>
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
                            <div
                                key={movie.id}
                                style={{ flexShrink: 0, width: '100px', textAlign: 'center' }}
                            >
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
                                        fontSize: '10px',
                                        color: colors.textTertiary,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    {movie.title}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
};

export default Matchmaker;
