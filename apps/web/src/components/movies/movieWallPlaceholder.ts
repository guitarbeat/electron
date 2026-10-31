export type MovieWallPlaceholderAction = "retry" | "clear" | "add";

export interface MovieWallPlaceholder {
  title: string;
  detail: string;
  action: MovieWallPlaceholderAction;
}

/**
 * Network and server failures usually come back as a degraded snapshot, not a thrown error.
 * An empty degraded snapshot is a failed load. Cached movies, and a successful empty list, are not.
 */
export function catalogLoadFailed(options: {
  error: unknown;
  degraded: boolean;
  movieCount: number;
}): boolean {
  if (options.error) return true;
  return options.degraded && options.movieCount === 0;
}

/** Empty wall copy. A failed load must not look like a watchlist that was never started. */
export function movieWallPlaceholder(options: {
  hasActiveFilters: boolean;
  loadFailed: boolean;
}): MovieWallPlaceholder {
  if (options.loadFailed) {
    return {
      title: "Couldn't load your movies",
      detail: "Check the connection, then try again.",
      action: "retry",
    };
  }
  if (options.hasActiveFilters) {
    return {
      title: "No matching titles",
      detail: "Try a broader combination or clear the wall filters.",
      action: "clear",
    };
  }
  return {
    title: "No movies yet",
    detail: "Add a movie or suggestion to fill this wall.",
    action: "add",
  };
}
