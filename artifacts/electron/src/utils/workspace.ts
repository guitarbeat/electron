/**
 * Generic utility for workspace collections (Movies, Places, etc.)
 */

export interface CollectionSections<T, S> {
  suggestions: S[];
  queue: T[];
  completed: T[];
}

export const compareCreatedAtDesc = (
  left: { createdAt: string },
  right: { createdAt: string },
): number =>
  new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();

export const compareCreatedAtAsc = (
  left: { createdAt: string },
  right: { createdAt: string },
): number => compareCreatedAtDesc(right, left);

export const compareStringsAlpha = (left: string, right: string): number =>
  left.localeCompare(right, undefined, { sensitivity: "base" });

/**
 * Builds standard collection sections (Suggestions, Queue, Completed)
 */
export function buildCollectionSections<T, S>(
  items: T[],
  suggestions: S[] = [],
  isCompleted: (item: T) => boolean,
): CollectionSections<T, S> {
  const queue: T[] = [];
  const completed: T[] = [];

  for (const item of items) {
    if (isCompleted(item)) {
      completed.push(item);
    } else {
      queue.push(item);
    }
  }

  return { suggestions, queue, completed };
}
