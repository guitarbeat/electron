import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Movie, SharedMemory, User } from '../types';
import Card from './ui/Card';
import { breakpoints, useMediaQuery } from '../hooks/useMediaQuery';
import { radius, spacing } from '../design-system/tokens';
import MemoryComposer from './memories/MemoryComposer';
import MemoryList from './memories/MemoryList';
import {
  ALL_MOVIES_FILTER,
  INITIAL_VISIBLE_COUNT,
  MAX_NOTE_LENGTH,
  MemorySortMode,
  VISIBLE_COUNT_STEP,
  getMemoryMovieKey,
} from './memories/memoryUtils';

interface MemoryWallProps {
  watchedMovies: Movie[];
  currentUser: User | null;
  memories: SharedMemory[];
  isLoading: boolean;
  memoriesError: string | null;
  addMemory: (
    movieId: string | undefined,
    movieTitle: string,
    author: string,
    note: string
  ) => Promise<SharedMemory>;
  activeMovieFilter: string;
  onActiveMovieFilterChange: (nextFilter: string) => void;
}

const MemoryWall: React.FC<MemoryWallProps> = ({
  watchedMovies,
  currentUser,
  memories,
  isLoading,
  memoriesError,
  addMemory,
  activeMovieFilter,
  onActiveMovieFilterChange,
}) => {
  const isMobile = useMediaQuery(breakpoints.sm);
  const noteInputRef = useRef<HTMLTextAreaElement | null>(null);

  const [selectedMovieId, setSelectedMovieId] = useState<string>('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [sortMode, setSortMode] = useState<MemorySortMode>('newest');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (watchedMovies.length === 0) {
      setSelectedMovieId('');
      return;
    }

    if (!selectedMovieId || !watchedMovies.some((movie) => movie.id === selectedMovieId)) {
      setSelectedMovieId(watchedMovies[0].id);
    }
  }, [selectedMovieId, watchedMovies]);

  useEffect(() => {
    if (!isLoading && memories.length === 0) {
      setIsComposerOpen(true);
    }
  }, [isLoading, memories.length]);

  useEffect(() => {
    if (
      activeMovieFilter !== ALL_MOVIES_FILTER &&
      !memories.some((memory) => getMemoryMovieKey(memory) === activeMovieFilter)
    ) {
      onActiveMovieFilterChange(ALL_MOVIES_FILTER);
    }
  }, [activeMovieFilter, memories, onActiveMovieFilterChange]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [activeMovieFilter, sortMode]);

  const selectedMovie = useMemo(
    () => watchedMovies.find((movie) => movie.id === selectedMovieId),
    [watchedMovies, selectedMovieId]
  );

  const watchedMovieOptions = useMemo(() => {
    return [...watchedMovies].sort((a, b) => a.title.localeCompare(b.title));
  }, [watchedMovies]);

  const movieFilterOptions = useMemo(() => {
    const options = new Map<string, string>();

    memories.forEach((memory) => {
      const key = getMemoryMovieKey(memory);
      if (!options.has(key)) {
        options.set(key, memory.movieTitle);
      }
    });

    return Array.from(options.entries())
      .map(([id, title]) => ({ id, title }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [memories]);

  const sortedMemories = useMemo(() => {
    const filtered =
      activeMovieFilter === ALL_MOVIES_FILTER
        ? memories
        : memories.filter((memory) => getMemoryMovieKey(memory) === activeMovieFilter);

    if (sortMode === 'newest') {
      return filtered;
    }

    return [...filtered].reverse();
  }, [activeMovieFilter, memories, sortMode]);

  const visibleMemories = useMemo(() => {
    return sortedMemories.slice(0, visibleCount);
  }, [sortedMemories, visibleCount]);

  const remainingChars = MAX_NOTE_LENGTH - note.length;
  const canSubmit =
    watchedMovies.length > 0 &&
    !isSubmitting &&
    Boolean(currentUser) &&
    Boolean(selectedMovie) &&
    Boolean(note.trim());

  const handleComposerToggle = () => {
    const nextState = !isComposerOpen;
    setIsComposerOpen(nextState);

    if (nextState) {
      requestAnimationFrame(() => {
        noteInputRef.current?.focus();
      });
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    if (!selectedMovie) {
      setError('Watch something together first, then add a memory.');
      return;
    }

    if (!currentUser) {
      setError('Select Aaron or Electra before adding a memory.');
      return;
    }

    if (!note.trim()) {
      setError('Please add a memory note.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await addMemory(selectedMovie.id, selectedMovie.title, currentUser, note);
      setNote('');
      setSuccessMessage(`Memory saved for ${selectedMovie.title}.`);
      onActiveMovieFilterChange(selectedMovie.id);
      if (isMobile) {
        setIsComposerOpen(false);
      } else {
        requestAnimationFrame(() => {
          noteInputRef.current?.focus();
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save memory';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card
      variant="elevated"
      style={{
        marginTop: spacing.xl,
        padding: isMobile ? spacing.md : spacing.lg,
        border: isMobile ? '8px solid #6d4224' : '10px solid #6d4224',
        borderRadius: isMobile ? '18px' : '24px',
        background:
          'radial-gradient(circle at 22% 15%, rgba(255, 214, 165, 0.18) 0%, rgba(255, 214, 165, 0) 34%), linear-gradient(145deg, #8a5a2f 0%, #704220 42%, #613816 100%)',
        boxShadow:
          '0 16px 28px rgba(0,0,0,0.45), inset 0 2px 0 rgba(255,255,255,0.12), inset 0 -2px 0 rgba(0,0,0,0.2)',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.38,
          background:
            'repeating-linear-gradient(25deg, rgba(255, 238, 206, 0.2) 0px, rgba(255, 238, 206, 0.2) 2px, rgba(112, 66, 32, 0) 2px, rgba(112, 66, 32, 0) 8px), repeating-linear-gradient(145deg, rgba(54, 30, 14, 0.28) 0px, rgba(54, 30, 14, 0.28) 1px, rgba(54, 30, 14, 0) 1px, rgba(54, 30, 14, 0) 6px)',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: isMobile ? '10px' : '12px',
          borderRadius: radius.md,
          border: '1px solid rgba(255, 234, 198, 0.34)',
          boxShadow:
            'inset 0 0 0 1px rgba(87, 50, 23, 0.48), inset 0 12px 24px rgba(38, 20, 8, 0.22)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <MemoryComposer
          watchedMovieOptions={watchedMovieOptions}
          selectedMovieId={selectedMovieId}
          onSelectedMovieIdChange={(movieId) => {
            setSelectedMovieId(movieId);
            setSuccessMessage(null);
          }}
          currentUser={currentUser}
          note={note}
          onNoteChange={(nextNote) => {
            setNote(nextNote.slice(0, MAX_NOTE_LENGTH));
            setSuccessMessage(null);
          }}
          onSubmit={handleAddMemory}
          isSubmitting={isSubmitting}
          canSubmit={canSubmit}
          remainingChars={remainingChars}
          error={error}
          successMessage={successMessage}
          isMobile={isMobile}
          isComposerOpen={isComposerOpen}
          onComposerToggle={handleComposerToggle}
          noteInputRef={noteInputRef}
        />

        <MemoryList
          memories={memories}
          visibleMemories={visibleMemories}
          sortedMemories={sortedMemories}
          movieFilterOptions={movieFilterOptions}
          activeMovieFilter={activeMovieFilter}
          onActiveMovieFilterChange={onActiveMovieFilterChange}
          sortMode={sortMode}
          onSortModeChange={setSortMode}
          onShowMore={() => setVisibleCount((prev) => prev + VISIBLE_COUNT_STEP)}
          onShowLess={() => setVisibleCount(INITIAL_VISIBLE_COUNT)}
          visibleCount={visibleCount}
          isLoading={isLoading}
          memoriesError={memoriesError}
          isMobile={isMobile}
        />
      </div>
    </Card>
  );
};

export default MemoryWall;
