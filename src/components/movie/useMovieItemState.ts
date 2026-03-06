import { useState, useCallback } from 'react';
import { Movie, User } from '@/types';

export const useMovieItemState = (movie: Movie, currentUser: User | null) => {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [showMemories, setShowMemories] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const watchedByCurrentUser = currentUser ? movie.watchedBy.includes(currentUser) : false;
  const watchedByBoth = movie.watchedBy.length === 2;
  const isGuest = !currentUser;

  const handleCardClick = useCallback(() => {
    setIsBottomSheetOpen(true);
  }, []);

  const handleAction = useCallback((action: () => void) => {
    action();
    setIsBottomSheetOpen(false);
  }, []);

  const handleToggleMemories = useCallback((event?: React.MouseEvent) => {
    event?.stopPropagation();
    setShowMemories((current) => !current);
  }, []);

  const handleToggle = useCallback(
    async (event?: React.MouseEvent, onToggle?: (movie: Movie) => void | Promise<void>) => {
      event?.stopPropagation();
      if (isGuest || !onToggle) return;

      setIsUpdating(true);
      try {
        await onToggle(movie);
      } finally {
        setIsUpdating(false);
        setIsBottomSheetOpen(false);
      }
    },
    [movie, isGuest]
  );

  return {
    isBottomSheetOpen,
    showMemories,
    isUpdating,
    watchedByCurrentUser,
    watchedByBoth,
    isGuest,
    setIsBottomSheetOpen,
    handleCardClick,
    handleAction,
    handleToggleMemories,
    handleToggle,
  };
};
