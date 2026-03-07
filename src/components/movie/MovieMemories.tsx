import React from 'react';
import { Movie, SharedMemory, User } from '@/types';
import { spacing, typography, colors } from '@/design-system/tokens';
import MemoryList from '@/memories/MemoryList';
import MemoryComposer from '@/memories/MemoryComposer';

interface MovieMemoriesProps {
  movie: Movie;
  memories: SharedMemory[];
  currentUser: User | null;
  isMobile: boolean;
  onAddMemory?: (note: string) => Promise<void>;
  onUpdateMemory?: (memoryId: string, note: string) => Promise<void>;
  onDeleteMemory?: (memoryId: string) => Promise<void>;
  onTogglePin?: (memoryId: string) => Promise<void>;
}

const MovieMemories: React.FC<MovieMemoriesProps> = ({
  movie,
  memories,
  currentUser,
  isMobile,
  onAddMemory,
  onUpdateMemory,
  onDeleteMemory,
  onTogglePin,
}) => {
  const [isSubmittingMemory, setIsSubmittingMemory] = React.useState(false);

  const handleMemorySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!onAddMemory) return;

    setIsSubmittingMemory(true);
    try {
      const form = event.currentTarget as HTMLFormElement;
      const note = (form.elements.namedItem('note') as HTMLTextAreaElement).value;
      await onAddMemory(note);
      form.reset();
    } finally {
      setIsSubmittingMemory(false);
    }
  };

  if (memories.length === 0 && !currentUser) {
    return null;
  }

  return (
    <div
      className="movie-memory-panel"
      style={{
        marginTop: `-${spacing.sm}`,
        marginBottom: spacing.md,
        padding: `${spacing.md} ${spacing.md} ${spacing.sm}`,
        borderRadius: `0 0 12px 12px`,
        background: 'rgba(20, 20, 25, 0.4)',
        border: '1px solid rgba(236, 72, 153, 0.18)',
        borderTop: 'none',
        borderLeft: '3px solid rgba(255, 127, 198, 0.28)',
      }}
    >
      {currentUser && onAddMemory && (
        <div style={{ marginBottom: spacing.md }}>
          <MemoryComposer
            watchedMovieOptions={[movie]}
            selectedMovieId={movie.id}
            onSelectedMovieIdChange={() => {}}
            currentUser={currentUser}
            onSubmit={handleMemorySubmit}
            isSubmitting={isSubmittingMemory}
            canSubmit={!isSubmittingMemory}
            isMobile={isMobile}
            note=""
            onNoteChange={() => {}}
            isComposerOpen
            onComposerToggle={() => {}}
            remainingChars={280}
            error={null}
            successMessage={null}
            noteInputRef={React.createRef()}
          />
        </div>
      )}

      {memories.length > 0 ? (
        <MemoryList
          memories={memories}
          visibleMemories={memories}
          sortedMemories={memories}
          currentUser={currentUser}
          isMobile={isMobile}
          onEditMemory={async (memory, note) => {
            if (onUpdateMemory) await onUpdateMemory(memory.id, note);
          }}
          onDeleteMemory={async (memory) => {
            if (onDeleteMemory) await onDeleteMemory(memory.id);
          }}
          onTogglePin={async (memory) => {
            if (onTogglePin) await onTogglePin(memory.id);
          }}
          movieFilterOptions={[]}
          activeMovieFilter={movie.id}
          onActiveMovieFilterChange={() => {}}
          sortMode="newest"
          onSortModeChange={() => {}}
          onShowMore={() => {}}
          onShowLess={() => {}}
          visibleCount={100}
          isLoading={false}
          memoriesError={null}
          onJumpToMovie={() => {}}
        />
      ) : (
        <p
          style={{
            textAlign: 'center',
            color: colors.textTertiary,
            fontSize: typography.fontSize.xs,
            fontStyle: 'italic',
            padding: spacing.sm,
          }}
        >
          No memories yet. Add one above!
        </p>
      )}
    </div>
  );
};

export default MovieMemories;
