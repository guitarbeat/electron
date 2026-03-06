import { useCallback, useState } from 'react';
import type { User, MatchmakerGame } from '../types.ts';
import { getMatchmakerGame, saveMatchmakerGame } from '../services/api/matchmakerService.ts';
import { usePolling } from '../hooks/usePolling.ts';
import { performMutation } from './useGenericMutation.ts';

export const useMatchmaker = (currentUser: User | null, isPaused: boolean = false) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    data: game,
    isLoading,
    refresh,
  } = usePolling(
    'matchmaker',
    () => getMatchmakerGame(),
    isPaused ? null : 30000 // Poll every 30 seconds when not paused
  );

  const swipe = useCallback(async (movieId: string, liked: boolean) => {
    if (!currentUser) return;

    setIsSubmitting(true);
    setError(null);
    
    try {
      await performMutation(
        async () => {
          const latestGame = await getMatchmakerGame();
          if (!latestGame || latestGame.status !== 'active') return latestGame;

          const updatedGame = { ...latestGame };
          
          // Update user likes/dislikes based on current user
          if (currentUser === 'Aaron') {
            if (liked) {
              if (!updatedGame.aaronLikes.includes(movieId) && !updatedGame.aaronDislikes.includes(movieId)) {
                updatedGame.aaronLikes.push(movieId);
              }
            } else {
              if (!updatedGame.aaronLikes.includes(movieId) && !updatedGame.aaronDislikes.includes(movieId)) {
                updatedGame.aaronDislikes.push(movieId);
              }
            }
          } else if (currentUser === 'Electra') {
            if (liked) {
              if (!updatedGame.electraLikes.includes(movieId) && !updatedGame.electraDislikes.includes(movieId)) {
                updatedGame.electraLikes.push(movieId);
              }
            } else {
              if (!updatedGame.electraLikes.includes(movieId) && !updatedGame.electraDislikes.includes(movieId)) {
                updatedGame.electraDislikes.push(movieId);
              }
            }
          }

          return updatedGame;
        },
        async (updatedGame) => {
          await saveMatchmakerGame(updatedGame);
          refresh(); // Refresh polling data
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save swipe');
    } finally {
      setIsSubmitting(false);
    }
  }, [currentUser, refresh]);

  const startGame = useCallback(async (movies: string[]) => {
    if (!currentUser) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const newGame: MatchmakerGame = {
        status: 'active',
        movies,
        aaronLikes: [],
        aaronDislikes: [],
        electraLikes: [],
        electraDislikes: [],
        currentMovie: movies[0] || null,
        startedAt: new Date().toISOString(),
      };

      await saveMatchmakerGame(newGame);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game');
    } finally {
      setIsSubmitting(false);
    }
  }, [currentUser, refresh]);

  const endGame = useCallback(async () => {
    if (!currentUser) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await saveMatchmakerGame(null);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end game');
    } finally {
      setIsSubmitting(false);
    }
  }, [currentUser, refresh]);

  return {
    game,
    isLoading,
    isSubmitting,
    error,
    swipe,
    startGame,
    endGame,
    refresh,
  };
};
