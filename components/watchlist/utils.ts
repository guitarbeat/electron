import type { ContentTab } from './types.ts';

/**
 * Returns the appropriate empty state message based on the current search query and selected content tab.
 *
 * @param searchQuery The current search query string.
 * @param contentTab The currently selected content tab.
 * @returns The message to display when no movies are found.
 */
export const getEmptyStateMessage = (searchQuery: string, contentTab: ContentTab): string => {
  if (searchQuery) {
    return 'No results match your search.';
  }
  if (contentTab === 'suggestions') {
    return 'No pending suggestions right now.';
  }
  if (contentTab === 'to-watch') {
    return "All caught up! You've watched everything in your queue.";
  }
  if (contentTab === 'watched') {
    return 'No watched movies yet. Mark one as watched to start your history.';
  }
  return 'No movies yet — add your first one above!';
};
