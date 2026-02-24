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

                const updatedGame = {
                    ...latestGame,
                    aaronLikes: latestGame.aaronLikes || [],
                    electraLikes: latestGame.electraLikes || [],
                    aaronDislikes: latestGame.aaronDislikes || [],
                    electraDislikes: latestGame.electraDislikes || []
                };

                const al = updatedGame.aaronLikes;
                const el = updatedGame.electraLikes;
                const ad = updatedGame.aaronDislikes;
                const ed = updatedGame.electraDislikes;

                if (currentUser === 'Aaron') {
                    if (liked) {
                        if (!al.includes(movieId) && !ad.includes(movieId)) {
                            updatedGame.aaronLikes = [...al, movieId];
                        }
                    } else if (!ad.includes(movieId) && !al.includes(movieId)) {
                        updatedGame.aaronDislikes = [...ad, movieId];
                    }
                } else if (currentUser === 'Electra') {
                    if (liked) {
                        if (!el.includes(movieId) && !ed.includes(movieId)) {
                            updatedGame.electraLikes = [...el, movieId];
                        }
                    } else if (!ed.includes(movieId) && !el.includes(movieId)) {
                        updatedGame.electraDislikes = [...ed, movieId];
                    }
                }
                return updatedGame;
            });
        },
        [currentUser, performMutation]
    );

    const undo = useCallback(async () => {
        if (!currentUser) return;
        await performMutation((latestGame) => {
            if (!latestGame || latestGame.status !== 'active') return latestGame;
            const updatedGame = {
                ...latestGame,
                aaronLikes: latestGame.aaronLikes || [],
                electraLikes: latestGame.electraLikes || [],
                aaronDislikes: latestGame.aaronDislikes || [],
                electraDislikes: latestGame.electraDislikes || []
            };

            if (currentUser === 'Aaron') {
                // Find which list had the last movie added. We check against the pool to find the most recent swipe by THIS user.
                // Since moviePool is in order, the last swiped ID is likely the one that corresponds to the last swiped index.
                // However, we can just pop the last element from either likes or dislikes if we knew which one was last.
                // For simplicity, we'll just check if there's anything to undo and take the most recent one.
                const lastLiked = updatedGame.aaronLikes[updatedGame.aaronLikes.length - 1];
                const lastDisliked = updatedGame.aaronDislikes[updatedGame.aaronDislikes.length - 1];

                // This is a bit tricky without a timestamp per swipe. Let's assume the user wants to undo the "most recent" addition.
                // A better way is to track history locally, but that doesn't sync.
                // Let's just pop from whichever array is "longer" or just the one that matches the last swiped movie in pool order.
                // Actually, let's just use the simple logic: remove the last element that exists in either list.
                // This might be wrong if they liked A then disliked B, but popping from Dislikes is safer for "regret".
                // Better yet: we just remove the IDs that are present in the swipedIds list.
                const combined = [...updatedGame.aaronLikes, ...updatedGame.aaronDislikes];
                if (combined.length === 0) return latestGame;

                // To be precise, we'd need a swipe history. Let's add that to the type?
                // Or just remove the last added ID.
                const lastId = combined[combined.length - 1]; // This is wrong because spread doesn't guarantee order.

                // Let's just pop from whichever list matches the last ID in the pool that is swiped.
                const userSwipedIds = [...updatedGame.aaronLikes, ...updatedGame.aaronDislikes];
                const poolInReverse = [...updatedGame.moviePool].reverse();
                const lastSwipedId = poolInReverse.find(id => userSwipedIds.includes(id));

                if (lastSwipedId) {
                    updatedGame.aaronLikes = updatedGame.aaronLikes.filter(id => id !== lastSwipedId);
                    updatedGame.aaronDislikes = updatedGame.aaronDislikes.filter(id => id !== lastSwipedId);
                }
            } else {
                const userSwipedIds = [...updatedGame.electraLikes, ...updatedGame.electraDislikes];
                const poolInReverse = [...updatedGame.moviePool].reverse();
                const lastSwipedId = poolInReverse.find(id => userSwipedIds.includes(id));

                if (lastSwipedId) {
                    updatedGame.electraLikes = updatedGame.electraLikes.filter(id => id !== lastSwipedId);
                    updatedGame.electraDislikes = updatedGame.electraDislikes.filter(id => id !== lastSwipedId);
                }
            }
            return updatedGame;
        });
    }, [currentUser, performMutation]);

    const endCurrentGame = useCallback(async () => {
        await performMutation(() => null);
    }, [performMutation]);

    return {
        game,
        isLoading,
        isSubmitting,
        startNewGame,
        swipe,
        undo,
        endCurrentGame,
        refresh,
    };
};
