import { useState, useCallback } from 'react';
import { MatchmakerGame, User } from '../types';
import { usePolling } from './usePolling';
import { matchmakerService } from '../services/api/gistService';
import { MutationHelper } from '../services/shared/mutationHelpers';

export const useMatchmaker = (currentUser: User | null, isPaused: boolean = false) => {
  const {
    data: game,
    isLoading,
    refresh,
  } = usePolling(
    matchmakerService.getMatchmakerGame,
    5000,
    (prev, next) => JSON.stringify(prev) === JSON.stringify(next),
    {
      key: 'matchmaker',
      isPaused,
    }
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const mutationHelper = new MutationHelper({
    fetchFn: matchmakerService.getMatchmakerGame,
    saveFn: matchmakerService.saveMatchmakerGame,
    refreshFn: refresh,
  });

  const swipe = useCallback(
    async (movieId: string, liked: boolean) => {
      if (!currentUser) return;

      setIsSubmitting(true);
      try {
        await mutationHelper.performMutation(currentUser, (latestGame) => {
          if (!latestGame || latestGame.status !== 'active') return latestGame;

          const updatedGame = {
            ...latestGame,
            aaronLikes: latestGame.aaronLikes || [],
            electraLikes: latestGame.electraLikes || [],
            aaronDislikes: latestGame.aaronDislikes || [],
            electraDislikes: latestGame.electraDislikes || [],
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
          } else {
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
      } catch (err) {
        console.error('Matchmaker swipe failed:', err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentUser, mutationHelper]
  );

  return { game, isLoading, isSubmitting, swipe, refresh };
};
