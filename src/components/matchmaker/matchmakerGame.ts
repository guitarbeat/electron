import type { MatchmakerGame, Movie, User } from "@/shared/types";

const MATCHMAKER_POOL_SIZE = 10;

const shuffleWithSource = <T>(array: T[], randomSource: () => number): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(randomSource() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
export const SHORT_AND_SWEET_VIBE = "Short & Sweet";

const normalizeTag = (value: string): string => value.trim().toLowerCase();

const getGenreAndCategoryTags = (movie: Movie): string[] =>
  [
    ...(movie.genre ? movie.genre.split(",") : []),
    ...(movie.category ? [movie.category] : []),
  ]
    .map((tag) => tag.trim())
    .filter(Boolean);

export const parseRuntimeMinutes = (runtime?: string): number | null => {
  if (!runtime) {
    return null;
  }

  const trimmed = runtime.trim();
  if (!trimmed) {
    return null;
  }

  const hoursMatch = trimmed.match(/(\d+)\s*h/i);
  const minutesMatch = trimmed.match(/(\d+)\s*m(?:in)?/i);
  if (hoursMatch || minutesMatch) {
    const hours = hoursMatch ? Number.parseInt(hoursMatch[1], 10) : 0;
    const minutes = minutesMatch ? Number.parseInt(minutesMatch[1], 10) : 0;
    return hours * 60 + minutes;
  }

  const fallbackMatch = trimmed.match(/(\d+)/);
  return fallbackMatch ? Number.parseInt(fallbackMatch[1], 10) : null;
};

export const filterMoviesByVibe = (
  movies: Movie[],
  selectedVibe: string | null,
): Movie[] => {
  if (!selectedVibe) {
    return movies;
  }

  if (selectedVibe === SHORT_AND_SWEET_VIBE) {
    return movies.filter((movie) => {
      const runtimeMinutes = parseRuntimeMinutes(movie.runtime);
      return runtimeMinutes !== null && runtimeMinutes < 100;
    });
  }

  const normalizedVibe = normalizeTag(selectedVibe);
  return movies.filter((movie) =>
    getGenreAndCategoryTags(movie).some((tag) =>
      normalizeTag(tag).includes(normalizedVibe),
    ),
  );
};

export const getAvailableMatchmakerVibes = (
  movies: Movie[],
  limit: number = 8,
): string[] => {
  const counts = new Map<string, number>();

  movies.forEach((movie) => {
    getGenreAndCategoryTags(movie).forEach((tag) => {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    });
  });

  return [...counts.entries()]
    .sort(
      (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
    )
    .slice(0, limit)
    .map(([tag]) => tag);
};

export const createMatchmakerPool = (
  movies: Movie[],
  selectedVibe: string | null,
  randomSource: () => number = Math.random,
): string[] =>
  shuffleWithSource(filterMoviesByVibe(movies, selectedVibe), randomSource)
    .slice(0, MATCHMAKER_POOL_SIZE)
    .map((movie) => movie.id);

export const getUserSwipedIds = (
  game: MatchmakerGame | null,
  user: User | null,
): string[] => {
  if (!game || !user) {
    return [];
  }

  return user === "Aaron"
    ? [...game.aaronLikes, ...game.aaronDislikes]
    : [...game.electraLikes, ...game.electraDislikes];
};

export const getMatchIds = (game: MatchmakerGame | null): string[] => {
  if (!game) {
    return [];
  }

  const electraLikes = new Set(game.electraLikes);
  return game.aaronLikes.filter((movieId) => electraLikes.has(movieId));
};

export const isMatchmakerComplete = (game: MatchmakerGame | null): boolean => {
  if (!game) {
    return false;
  }

  const aaronCompleted =
    getUserSwipedIds(game, "Aaron").length >= game.moviePool.length;
  const electraCompleted =
    getUserSwipedIds(game, "Electra").length >= game.moviePool.length;
  return aaronCompleted && electraCompleted;
};

export const reconcileMatchmakerStatus = (
  game: MatchmakerGame,
): MatchmakerGame => ({
  ...game,
  status: isMatchmakerComplete(game) ? "completed" : "active",
});

export const applyMatchmakerSwipe = (
  game: MatchmakerGame,
  user: User,
  movieId: string,
  liked: boolean,
): MatchmakerGame => {
  if (game.status !== "active") {
    return game;
  }

  const alreadySwiped = getUserSwipedIds(game, user).includes(movieId);
  if (alreadySwiped) {
    return game;
  }

  const updatedGame =
    user === "Aaron"
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
  user: User,
): MatchmakerGame => {
  const swipeOrder =
    user === "Aaron"
      ? (game.aaronSwipeOrder ?? [])
      : (game.electraSwipeOrder ?? []);

  // Fall back to pool-order search for games that predate swipe order tracking
  const lastSwipedId = (() => {
    if (swipeOrder.length > 0) {
      return swipeOrder[swipeOrder.length - 1];
    }
    // Optimization: Convert swiped IDs to a Set outside the loop and iterate
    // backwards to change the time complexity from O(N * M) (where N is movie pool size
    // and M is swiped count) to O(N + M) and avoid O(N) array allocation overhead.
    const swipedIdsSet = new Set(getUserSwipedIds(game, user));
    for (let i = game.moviePool.length - 1; i >= 0; i--) {
      const movieId = game.moviePool[i];
      if (swipedIdsSet.has(movieId)) {
        return movieId;
      }
    }
    return undefined;
  })();

  if (!lastSwipedId) {
    return game;
  }

  const updatedGame =
    user === "Aaron"
      ? {
          ...game,
          aaronLikes: game.aaronLikes.filter(
            (movieId) => movieId !== lastSwipedId,
          ),
          aaronDislikes: game.aaronDislikes.filter(
            (movieId) => movieId !== lastSwipedId,
          ),
          aaronSwipeOrder: swipeOrder.slice(0, -1),
        }
      : {
          ...game,
          electraLikes: game.electraLikes.filter(
            (movieId) => movieId !== lastSwipedId,
          ),
          electraDislikes: game.electraDislikes.filter(
            (movieId) => movieId !== lastSwipedId,
          ),
          electraSwipeOrder: swipeOrder.slice(0, -1),
        };

  return reconcileMatchmakerStatus(updatedGame);
};

export const selectRandomMatch = <T>(
  matches: T[],
  randomSource: () => number = Math.random,
): T | null => {
  if (matches.length === 0) {
    return null;
  }

  const index = Math.min(
    matches.length - 1,
    Math.max(0, Math.floor(randomSource() * matches.length)),
  );
  return matches[index];
};
