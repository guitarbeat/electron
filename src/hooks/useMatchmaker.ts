import { useState, useCallback } from 'react';
import { MatchmakerGame, User } from '@/shared/types';
import { usePolling } from '@/services/polling';
import { mutateScope, readScope, retryScopeSync } from '@/services/state';
import { areDeeplyEqual } from '@/utils';
import {
  applyMatchmakerSwipe,
  undoMatchmakerSwipe,
} from '@/components/matchmaker/matchmakerGame';

const POLLING_INTERVAL = 30000;

export const useMatchmaker = (currentUser: User | null, isPaused: boolean = false) => {
  const readMatchmaker = useCallback(() => readScope('matchmaker'), []);
  const {
    data: snapshot,
    isLoading,
    refresh,
  } = usePolling(readMatchmaker, POLLING_INTERVAL, areDeeplyEqual, {
    key: 'matchmaker',
    isPaused,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const game = snapshot?.data ?? null;

  const performMutation = useCallback(
    async (
      op: string,
      payload: unknown,
      optimisticData: MatchmakerGame | null
    ) => {
      if (!currentUser) return;

      setIsSubmitting(true);
      try {
        await mutateScope('matchmaker', {
          op,
          payload,
          optimisticData,
        });
        refresh();
      } finally {
        setIsSubmitting(false);
      }
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
        aaronSwipeOrder: [],
        electraSwipeOrder: [],
        status: 'active',
        createdAt: new Date().toISOString(),
        startedBy: currentUser,
      };

      await performMutation(
        'start_game',
        {
          id: newGame.id,
          movieIds,
        },
        newGame
      );
    },
    [currentUser, performMutation]
  );

  const swipe = useCallback(
    async (movieId: string, liked: boolean) => {
      if (!currentUser || !game) return;

      const optimisticGame = applyMatchmakerSwipe(game, currentUser, movieId, liked);

      await performMutation(
        'swipe',
        { movieId, liked },
        optimisticGame
      );
    },
    [currentUser, game, performMutation]
  );

  const undo = useCallback(async () => {
    if (!currentUser || !game) return;
    await performMutation('undo', {}, undoMatchmakerSwipe(game, currentUser));
  }, [currentUser, game, performMutation]);

  const endCurrentGame = useCallback(async () => {
    await performMutation('end_game', {}, null);
  }, [performMutation]);

  const retrySync = useCallback(async () => {
    await retryScopeSync('matchmaker');
    refresh();
  }, [refresh]);

  return {
    game,
    isLoading,
    isSubmitting,
    isDegraded: snapshot?.degraded ?? false,
    isSyncBlocked: snapshot?.blocked ?? false,
    syncWarning: snapshot?.warning,
    startNewGame,
    swipe,
    undo,
    endCurrentGame,
    refresh,
    retrySync,
  };
};
