export type MovieWallPlaceholderAction = "retry" | "clear" | "add";

export interface MovieWallPlaceholder {
  title: string;
  detail: string;
  action: MovieWallPlaceholderAction;
}

/** Empty wall copy. A failed load must not look like a watchlist that was never started. */
export function movieWallPlaceholder(options: {
  hasActiveFilters: boolean;
  loadFailed: boolean;
}): MovieWallPlaceholder {
  if (options.loadFailed && !options.hasActiveFilters) {
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
