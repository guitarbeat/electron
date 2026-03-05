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
    return 'Nothing matched this search yet.';
  }
  if (contentTab === 'suggestions') {
    return 'No surprise picks waiting right now.';
  }
  if (contentTab === 'to-watch') {
    return "You're caught up. Time to add a new date-night pick.";
  }
  if (contentTab === 'watched') {
    return 'No shared movie memories yet. Mark one as watched to start your story.';
  }
  return 'No picks yet - add your first movie-night plan above.';
};

