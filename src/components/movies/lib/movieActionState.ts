import type { Movie, User } from '@/shared/types';

export interface MovieActionState {
  isGuest: boolean;
  hasMemories: boolean;
  watchedByCurrentUser: boolean;
  showActionRail: boolean;
  showWatchedAction: boolean;
  showNotesAction: boolean;
  memoryCountText: string;
  notesButtonLabel: string;
  notesButtonCompactLabel: string;
  notesButtonAriaLabel: string | null;
  notesBadgeText: string | null;
  primaryActionLabel: string;
  primaryActionCompactLabel: string;
  primaryActionAriaLabel: string | null;
}

interface GetMovieActionStateParams {
  movie: Movie;
  currentUser: User | null;
  memoriesCount: number;
}

export const getMovieActionState = ({
  movie,
  currentUser,
  memoriesCount,
}: GetMovieActionStateParams): MovieActionState => {
  const isGuest = !currentUser;
  const hasMemories = memoriesCount > 0;
  const watchedByCurrentUser = currentUser ? movie.watchedBy.includes(currentUser) : false;
  const showWatchedAction = Boolean(currentUser);
  const showNotesAction = hasMemories || Boolean(currentUser);
  const showActionRail = showWatchedAction || showNotesAction;
  const memoryCountText = `${memoriesCount} note${memoriesCount === 1 ? '' : 's'}`;

  return {
    isGuest,
    hasMemories,
    watchedByCurrentUser,
    showActionRail,
    showWatchedAction,
    showNotesAction,
    memoryCountText,
    notesButtonLabel: hasMemories ? memoryCountText : 'Add note',
    notesButtonCompactLabel: hasMemories ? 'Notes' : 'Note',
    notesButtonAriaLabel: showNotesAction
      ? hasMemories
        ? `View notes for "${movie.title}"`
        : `Add note to "${movie.title}"`
      : null,
    notesBadgeText: hasMemories ? String(memoriesCount) : null,
    primaryActionLabel: watchedByCurrentUser ? 'Watched' : 'Mark watched',
    primaryActionCompactLabel: watchedByCurrentUser ? 'Watched' : 'Watch',
    primaryActionAriaLabel: showWatchedAction
      ? watchedByCurrentUser
        ? `Mark "${movie.title}" as unwatched`
        : `Mark "${movie.title}" as watched`
      : null,
  };
};
