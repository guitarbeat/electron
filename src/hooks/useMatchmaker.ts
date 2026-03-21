import { useState, useCallback, useRef } from 'react';
import { MatchmakerGame, User } from '@/types';
import { usePolling } from '@/services/polling';
import {
  canWriteGist,
  GIST_MATCHMAKER_FILENAME,
  patchGistFile,
  readGistJsonFile,
  readStoredJson,
  removeStoredJson,
  setLocalOverride,
  writeStoredJson,
} from '@/services/gistClient.ts';
import { areDeeplyEqual, isUser, parseJsonContent } from '@/utils';
import {
  applyMatchmakerSwipe,
  reconcileMatchmakerStatus,
  undoMatchmakerSwipe,
} from '@/components/matchmaker/matchmakerGame';

const MATCHMAKER_LOCAL_STORAGE_KEY = 'movieList.localMatchmaker';

const cloneMatchmakerGame = (game: MatchmakerGame): MatchmakerGame => ({
  ...game,
  moviePool: [...game.moviePool],
  aaronLikes: [...game.aaronLikes],
  electraLikes: [...game.electraLikes],
  aaronDislikes: [...game.aaronDislikes],
  electraDislikes: [...game.electraDislikes],
});

const isMatchmakerStatus = (value: unknown): value is MatchmakerGame['status'] =>
  value === 'active' || value === 'completed';

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const isMatchmakerGameRecord = (value: unknown): value is MatchmakerGame => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const game = value as Partial<MatchmakerGame>;

  return (
    typeof game.id === 'string' &&
    typeof game.createdAt === 'string' &&
    isUser(game.startedBy) &&
    isMatchmakerStatus(game.status) &&
    isStringArray(game.moviePool) &&
    isStringArray(game.aaronLikes) &&
    isStringArray(game.electraLikes) &&
    isStringArray(game.aaronDislikes) &&
    isStringArray(game.electraDislikes)
  );
};

const readStoredLocalMatchmakerGame = (): MatchmakerGame | null =>
  readStoredJson({
    storageKey: MATCHMAKER_LOCAL_STORAGE_KEY,
    validate: isMatchmakerGameRecord,
    clone: cloneMatchmakerGame,
    label: 'local matchmaker fallback',
  });

const saveLocalMatchmakerGame = (game: MatchmakerGame | null): void => {
  if (game) {
    writeStoredJson({
      storageKey: MATCHMAKER_LOCAL_STORAGE_KEY,
      value: game,
      clone: cloneMatchmakerGame,
      label: 'local matchmaker fallback',
    });
  } else {
    removeStoredJson(MATCHMAKER_LOCAL_STORAGE_KEY, 'local matchmaker fallback');
  }

  setLocalOverride('matchmaker', true);
};

const getMatchmakerGame = async (): Promise<MatchmakerGame | null> => {
  try {
    return await readGistJsonFile({
      scope: 'matchmaker',
      filename: GIST_MATCHMAKER_FILENAME,
      fallback: () => readStoredLocalMatchmakerGame(),
      onMissingFileWhenWritable: () => null,
      parse: (content) => {
        const parsed = parseJsonContent(content, 'matchmaker');
        return isMatchmakerGameRecord(parsed) ? reconcileMatchmakerStatus(parsed) : null;
      },
    });
  } catch (error) {
    console.error('Error fetching matchmaker game from Gist:', error);
    return null;
  }
};

const saveMatchmakerGame = async (game: MatchmakerGame | null): Promise<void> => {
  if (!canWriteGist) {
    saveLocalMatchmakerGame(game);
    return;
  }

  try {
    const response = await patchGistFile(
      GIST_MATCHMAKER_FILENAME,
      game ? JSON.stringify(game, null, 2) : ''
    );

    if (!response.ok) {
      console.warn(`Failed to save matchmaker game (${response.status}), using local fallback.`);
      saveLocalMatchmakerGame(game);
      return;
    }
    setLocalOverride('matchmaker', false);
  } catch (error) {
    console.warn('Error saving matchmaker game to Gist, using local fallback:', error);
    saveLocalMatchmakerGame(game);
  }
};

export const useMatchmaker = (currentUser: User | null, isPaused: boolean = false) => {
  const {
    data: game,
    isLoading,
    refresh,
  } = usePolling(
    getMatchmakerGame,
    5000,
    areDeeplyEqual,
    {
      key: 'matchmaker',
      isPaused,
      allowNull: true,
    }
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const mutationLockRef = useRef<Promise<void> | null>(null);

  const performMutation = useCallback(
    async (mutationFn: (latestGame: MatchmakerGame | null) => MatchmakerGame | null) => {
      if (!currentUser || isSubmittingRef.current) return;

      isSubmittingRef.current = true;
      setIsSubmitting(true);
      const previousMutation = mutationLockRef.current;
      let mutation: Promise<void> | null = null;

      mutation = (async () => {
        try {
          await previousMutation;
        } catch {
          // Ignore previous errors
        }

        try {
          const latestGame = await getMatchmakerGame();
          const updatedGame = mutationFn(latestGame);
          await saveMatchmakerGame(updatedGame);
          refresh();
        } catch (err) {
          console.error('Matchmaker mutation failed:', err);
        } finally {
          if (mutationLockRef.current === mutation) {
            isSubmittingRef.current = false;
            setIsSubmitting(false);
          }
        }
      })();

      mutationLockRef.current = mutation;
      await mutation;
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

        return applyMatchmakerSwipe(latestGame, currentUser, movieId, liked);
      });
    },
    [currentUser, performMutation]
  );

  const undo = useCallback(async () => {
    if (!currentUser) return;
    await performMutation((latestGame) => {
      if (!latestGame) return latestGame;
      return undoMatchmakerSwipe(latestGame, currentUser);
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
