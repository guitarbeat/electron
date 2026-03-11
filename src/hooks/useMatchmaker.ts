import { useState, useCallback, useRef } from 'react';
import { MatchmakerGame, User } from '@/types';
import { usePolling } from './usePolling';
import {
  canReadGist,
  canWriteGist,
  fetchGist,
  getGistFileContent,
  GIST_MATCHMAKER_FILENAME,
  GIST_TOKEN,
  patchGistFile,
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

const readStoredLocalMatchmakerGame = (): MatchmakerGame | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(MATCHMAKER_LOCAL_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (isMatchmakerGameRecord(parsed)) {
      return cloneMatchmakerGame(parsed);
    }
  } catch (error) {
    console.warn('Failed to read local matchmaker fallback, resetting to empty state.', error);
  }

  return null;
};

const saveLocalMatchmakerGame = (game: MatchmakerGame | null): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (game) {
      window.localStorage.setItem(
        MATCHMAKER_LOCAL_STORAGE_KEY,
        JSON.stringify(cloneMatchmakerGame(game))
      );
    } else {
      window.localStorage.removeItem(MATCHMAKER_LOCAL_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('Failed to persist local matchmaker fallback.', error);
  }
};

const getMatchmakerGame = async (): Promise<MatchmakerGame | null> => {
  if (!canReadGist) {
    return readStoredLocalMatchmakerGame();
  }

  if (!canWriteGist && readStoredLocalMatchmakerGame()) {
    return readStoredLocalMatchmakerGame();
  }

  try {
    const response = await fetchGist({ token: GIST_TOKEN || undefined, cache: 'no-cache' });

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
      game ? JSON.stringify(game, null, 2) : '',
      GIST_TOKEN
    );

    if (!response.ok) {
      const errorBody = await response.json();
      console.error('GitHub API error details:', errorBody);
      throw new Error(`GitHub API responded with ${response.status}`);
    }
  } catch (error) {
    console.error('Error saving matchmaker game to Gist:', error);
    throw error;
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
