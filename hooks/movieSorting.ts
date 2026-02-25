import type { Movie } from '../types.ts';

export interface SortState {
  sortedMovies: Movie[];
  sortedIndices: number[];
  prevMovies: Movie[];
}

export const getSortedMovies = (
  movies: Movie[],
  lastState?: SortState
): SortState => {
  // If we have previous state, try to reuse the sort order
  if (
    lastState &&
    lastState.prevMovies &&
    lastState.sortedIndices &&
    movies.length === lastState.prevMovies.length &&
    lastState.sortedIndices.length === movies.length
  ) {
    const prevMovies = lastState.prevMovies;
    const sortedIndices = lastState.sortedIndices;
    let canReuse = true;

    // Verify if the sort order is still valid
    // This is O(N) but avoids O(N log N) sort and object allocations
    for (let i = 0; i < movies.length; i++) {
      const prev = prevMovies[i];
      const curr = movies[i];

      // Check if identity matches (order in raw array preserved)
      // If IDs don't match at the same index, it means insertion/deletion/reorder happened
      if (prev.id !== curr.id) {
        canReuse = false;
        break;
      }

      // Check sort criteria
      // If relevant fields changed, we must re-sort
      const prevWatched = prev.watchedBy.length === 2;
      const currWatched = curr.watchedBy.length === 2;
      if (prevWatched !== currWatched) {
        canReuse = false;
        break;
      }

      if (prev.createdAt !== curr.createdAt) {
        canReuse = false;
        break;
      }
    }

    if (canReuse) {
      // Reuse indices to construct new sorted array
      // This is O(N) array access, extremely fast
      const newSorted = new Array(movies.length);
      for (let i = 0; i < sortedIndices.length; i++) {
        newSorted[i] = movies[sortedIndices[i]];
      }

      return {
        sortedMovies: newSorted,
        sortedIndices,
        prevMovies: movies,
      };
    }
  }

  // Fallback: Full Sort
  // We need to capture indices to support future reuse
  const moviesWithIndex = movies.map((m, i) => ({ m, i }));

  moviesWithIndex.sort((a, b) => {
    const movieA = a.m;
    const movieB = b.m;

    const aWatchedByBoth = movieA.watchedBy.length === 2;
    const bWatchedByBoth = movieB.watchedBy.length === 2;

    if (aWatchedByBoth && !bWatchedByBoth) return 1; // a (watched) comes after b (unwatched)
    if (!aWatchedByBoth && bWatchedByBoth) return -1; // a (unwatched) comes before b (watched)

    // For movies in the same group, sort by creation date (newest first)
    if (movieB.createdAt > movieA.createdAt) return 1;
    if (movieB.createdAt < movieA.createdAt) return -1;
    return 0;
  });

  const newSortedIndices = moviesWithIndex.map((x) => x.i);
  const newSortedMovies = moviesWithIndex.map((x) => x.m);

  return {
    sortedMovies: newSortedMovies,
    sortedIndices: newSortedIndices,
    prevMovies: movies,
  };
};
