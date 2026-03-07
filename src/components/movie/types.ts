import { Movie, User, SharedMemory } from '@/types';

export interface MovieItemProps {
  movie: Movie;
  currentUser: User | null;
  onToggle: (movie: Movie) => void | Promise<void>;
  onDelete: (movie: Movie) => void;
  onFixMatch?: (movie: Movie) => void;
  animationDelay: string;
  memories?: SharedMemory[];
  onAddMemory?: (note: string) => Promise<void>;
  onUpdateMemory?: (memoryId: string, note: string) => Promise<void>;
  onDeleteMemory?: (memoryId: string) => Promise<void>;
  onTogglePin?: (memoryId: string) => Promise<void>;
  isHighlighted?: boolean;
}

export interface MoviePosterProps {
  movie: Movie;
  className?: string;
}

export interface MovieMetadataProps {
  movie: Movie;
  className?: string;
}

export interface MovieActionsProps {
  movie: Movie;
  currentUser: User | null;
  watchedByCurrentUser: boolean;
  isUpdating: boolean;
  isMobile: boolean;
  onToggle: (movie: Movie) => void;
  onDelete: (movie: Movie) => void;
  onFixMatch?: (movie: Movie) => void;
  onCloseBottomSheet?: () => void;
}

export interface MovieMemoriesProps {
  movie: Movie;
  memories: SharedMemory[];
  currentUser: User | null;
  isMobile: boolean;
  onAddMemory?: (note: string) => Promise<void>;
  onUpdateMemory?: (memoryId: string, note: string) => Promise<void>;
  onDeleteMemory?: (memoryId: string) => Promise<void>;
  onTogglePin?: (memoryId: string) => Promise<void>;
}

export interface MovieDetailsProps {
  movie: Movie;
  className?: string;
}
