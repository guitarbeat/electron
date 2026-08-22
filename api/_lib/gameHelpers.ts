import type { MatchmakerGame, User } from '../../apps/web/src/shared/types.js';

export const SPIN_HISTORY_MAX = 10;

export const appendSpinHistory = (
  history: string[],
  title: string,
  maxEntries: number = SPIN_HISTORY_MAX
): string[] => [title, ...history].slice(0, maxEntries);

export const getUserSwipedIds = (
  game: MatchmakerGame | null,
  user: User | null
): string[] => {
  if (!game || !user) {
    return [];
  }

  return user === 'Aaron'
    ? [...game.aaronLikes, ...game.aaronDislikes]
    : [...game.electraLikes, ...game.electraDislikes];
};

export const isMatchmakerComplete = (game: MatchmakerGame | null): boolean => {
  if (!game) {
    return false;
  }

  const aaronCompleted =
    getUserSwipedIds(game, 'Aaron').length >= game.moviePool.length;
  const electraCompleted =
    getUserSwipedIds(game, 'Electra').length >= game.moviePool.length;
  return aaronCompleted && electraCompleted;
};

export const reconcileMatchmakerStatus = (
  game: MatchmakerGame
): MatchmakerGame => ({
  ...game,
  status: isMatchmakerComplete(game) ? 'completed' : 'active',
});

export const applyMatchmakerSwipe = (
  game: MatchmakerGame,
  user: User,
  movieId: string,
  liked: boolean
): MatchmakerGame => {
  if (game.status !== 'active') {
    return game;
  }

  const alreadySwiped = getUserSwipedIds(game, user).includes(movieId);
  if (alreadySwiped) {
    return game;
  }

  const updatedGame =
    user === 'Aaron'
      ? {
          ...game,
          aaronLikes: liked ? [...game.aaronLikes, movieId] : game.aaronLikes,
          aaronDislikes: liked
            ? game.aaronDislikes
            : [...game.aaronDislikes, movieId],
          aaronSwipeOrder: [...(game.aaronSwipeOrder ?? []), movieId],
        }
      : {
          ...game,
          electraLikes: liked
            ? [...game.electraLikes, movieId]
            : game.electraLikes,
          electraDislikes: liked
            ? game.electraDislikes
            : [...game.electraDislikes, movieId],
          electraSwipeOrder: [...(game.electraSwipeOrder ?? []), movieId],
        };

  return reconcileMatchmakerStatus(updatedGame);
};

export const undoMatchmakerSwipe = (
  game: MatchmakerGame,
  user: User
): MatchmakerGame => {
  const swipeOrder =
    user === 'Aaron'
      ? (game.aaronSwipeOrder ?? [])
      : (game.electraSwipeOrder ?? []);

  const lastSwipedId = (() => {
    if (swipeOrder.length > 0) {
      return swipeOrder[swipeOrder.length - 1];
    }
    const swipedIdsSet = new Set(getUserSwipedIds(game, user));
    return [...game.moviePool]
      .reverse()
      .find((movieId) => swipedIdsSet.has(movieId));
  })();

  if (!lastSwipedId) {
    return game;
  }

  const updatedGame =
    user === 'Aaron'
      ? {
          ...game,
          aaronLikes: game.aaronLikes.filter(
            (movieId) => movieId !== lastSwipedId
          ),
          aaronDislikes: game.aaronDislikes.filter(
            (movieId) => movieId !== lastSwipedId
          ),
          aaronSwipeOrder: swipeOrder.slice(0, -1),
        }
      : {
          ...game,
          electraLikes: game.electraLikes.filter(
            (movieId) => movieId !== lastSwipedId
          ),
          electraDislikes: game.electraDislikes.filter(
            (movieId) => movieId !== lastSwipedId
          ),
          electraSwipeOrder: swipeOrder.slice(0, -1),
        };

  return reconcileMatchmakerStatus(updatedGame);
};
