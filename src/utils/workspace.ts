/**
 * Generic utility for workspace collections (Movies, Places, etc.)
 */

export interface CollectionSections<T, S> {
  suggestions: S[];
  queue: T[];
  completed: T[];
}

/**
 * Builds standard collection sections (Suggestions, Queue, Completed)
 */
export function buildCollectionSections<T, S>(
  items: T[],
  suggestions: S[] = [],
  isCompleted: (item: T) => boolean,
): CollectionSections<T, S> {
  return {
    suggestions,
    queue: items.filter((item) => !isCompleted(item)),
    completed: items.filter((item) => isCompleted(item)),
  };
}
