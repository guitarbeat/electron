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
  return 'No movies in this section yet.';
};
