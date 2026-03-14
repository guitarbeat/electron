import { useState, useCallback, useRef } from 'react';
import { MatchmakerGame, User } from '@/types';
import { usePolling } from './usePolling';
import {
  canReadGist,
  canWriteGist,
  fetchGist,
  getGistFileContent,
  GIST_MATCHMAKER_FILENAME,
  patchGistFile,
  readLocalOverride,
  readStoredJson,
  removeStoredJson,
  setLocalOverride,
  writeStoredJson,
} from '@/services/gistClient.ts';

const MATCHMAKER_LOCAL_STORAGE_KEY = 'movieList.localMatchmaker';

const cloneMatchmakerGame = (game: MatchmakerGame): MatchmakerGame => ({
  ...game,
  moviePool: [...game.moviePool],
  aaronLikes: [...game.aaronLikes],
  electraLikes: [...game.electraLikes],
  aaronDislikes: [...game.aaronDislikes],
  electraDislikes: [...game.electraDislikes],
});

const isUser = (value: unknown): value is User => value === 'Aaron' || value === 'Electra';

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
  if (!canReadGist) {
    return readStoredLocalMatchmakerGame();
  }

  const localOverride = readLocalOverride('matchmaker', readStoredLocalMatchmakerGame);
  if (localOverride.enabled) {
    return localOverride.value;
  }

  try {
    const response = await fetchGist({ cache: 'no-cache' });

    if (!response.ok) {
      console.warn(
        `Failed to fetch matchmaker game (${response.status}), using local fallback state.`
      );
      return readStoredLocalMatchmakerGame();
    }

    const gist = await response.json();
    const content = getGistFileContent(gist, GIST_MATCHMAKER_FILENAME);
    if (content === null) {
      if (!canWriteGist) {
        return readStoredLocalMatchmakerGame();
      }
      return null;
    }

    try {
      return JSON.parse(content);
    } catch (error) {
      console.error('Error parsing matchmaker JSON:', error);
      return null;
    }
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
    (prev, next) => JSON.stringify(prev) === JSON.stringify(next),
    {
      key: 'matchmaker',
      isPaused,
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

      const mutation = (async () => {
        try {
          await previousMutation;
        } catch (e) {
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
        electraDislikes: latestGame.electraDislikes || [],
      };

      if (currentUser === 'Aaron') {
        const userSwipedIds = [...updatedGame.aaronLikes, ...updatedGame.aaronDislikes];
        const poolInReverse = [...updatedGame.moviePool].reverse();
        const lastSwipedId = poolInReverse.find((id) => userSwipedIds.includes(id));

        if (lastSwipedId) {
          updatedGame.aaronLikes = updatedGame.aaronLikes.filter((id) => id !== lastSwipedId);
          updatedGame.aaronDislikes = updatedGame.aaronDislikes.filter((id) => id !== lastSwipedId);
        }
      } else {
        const userSwipedIds = [...updatedGame.electraLikes, ...updatedGame.electraDislikes];
        const poolInReverse = [...updatedGame.moviePool].reverse();
        const lastSwipedId = poolInReverse.find((id) => userSwipedIds.includes(id));

        if (lastSwipedId) {
          updatedGame.electraLikes = updatedGame.electraLikes.filter((id) => id !== lastSwipedId);
          updatedGame.electraDislikes = updatedGame.electraDislikes.filter(
            (id) => id !== lastSwipedId
          );
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
