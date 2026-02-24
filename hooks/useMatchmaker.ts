import { useState, useCallback, useRef } from 'react';
import { MatchmakerGame, User } from '../types';
import { usePolling } from './usePolling';
import { getMatchmakerGame, saveMatchmakerGame } from '../services/matchmakerService';

export const useMatchmaker = (currentUser: User | null, isPaused: boolean = false) => {
    const {
        data: game,
        isLoading,
        refresh,
    } = usePolling(getMatchmakerGame, 5000, (prev, next) => JSON.stringify(prev) === JSON.stringify(next), {
        key: 'matchmaker',
        isPaused,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const mutationLockRef = useRef<Promise<void> | null>(null);

    const performMutation = useCallback(
        async (mutationFn: (latestGame: MatchmakerGame | null) => MatchmakerGame | null) => {
            if (!currentUser) return;

            const mutation = (async () => {
                try {
                    await mutationLockRef.current;
                } catch (e) {
                    // Ignore previous errors
                }

                setIsSubmitting(true);
                try {
                    const latestGame = await getMatchmakerGame();
                    const updatedGame = mutationFn(latestGame);
                    await saveMatchmakerGame(updatedGame);
                    refresh();
                } catch (err) {
                    console.error('Matchmaker mutation failed:', err);
                } finally {
                    setIsSubmitting(false);
                }
            })();

            mutationLockRef.current = mutation;
            return mutation;
        },
        [currentUser, refresh]
    );

    const startNewGame = useCallback(
        async (movieIds: string[]) => {
            if (!currentUser) return;
            const newGame: MatchmakerGame = {
                id: crypto.randomUUID(),
                moviePool: movieIds,
                aaronLikes: [],
                electraLikes: [],
                aaronDislikes: [],
                electraDislikes: [],
                status: 'active',
                createdAt: new Date().toISOString(),
                startedBy: currentUser,
            };
            await performMutation(() => newGame);
        },
        [currentUser, performMutation]
    );

    const swipe = useCallback(
        async (movieId: string, liked: boolean) => {
            if (!currentUser) return;
            await performMutation((latestGame) => {
                if (!latestGame || latestGame.status !== 'active') return latestGame;

                const updatedGame = { ...latestGame };
                if (currentUser === 'Aaron') {
                    if (liked) {
                        if (!updatedGame.aaronLikes.includes(movieId)) {
                            updatedGame.aaronLikes = [...updatedGame.aaronLikes, movieId];
                        }
                    } else {
                        if (!updatedGame.aaronDislikes.includes(movieId)) {
                            updatedGame.aaronDislikes = [...updatedGame.aaronDislikes, movieId];
                        }
                    }
                } else if (currentUser === 'Electra') {
                    if (liked) {
                        if (!updatedGame.electraLikes.includes(movieId)) {
                            updatedGame.electraLikes = [...updatedGame.electraLikes, movieId];
                        }
                    } else {
                        if (!updatedGame.electraDislikes.includes(movieId)) {
                            updatedGame.electraDislikes = [...updatedGame.electraDislikes, movieId];
                        }
                    }
                }
                return updatedGame;
            });
        },
        [currentUser, performMutation]
    );

    const endCurrentGame = useCallback(async () => {
        await performMutation(() => null);
    }, [performMutation]);

    return {
        game,
        isLoading,
        isSubmitting,
        startNewGame,
        swipe,
        endCurrentGame,
        refresh,
    };
};
