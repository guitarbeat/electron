import React, { useMemo, useState } from 'react';
import Button from '@/ui/Button';
import Input from '@/ui/Input';
import Textarea from '@/ui/Textarea';
import { useMovies } from '@/hooks/useMovies';
import { usePolling } from '@/hooks/usePolling';
import { useUser } from '@/context/UserContext';
import { addMemory, deleteMemory, getMemories, toggleMemoryPin } from '@/services/memoryService';
import { colors, spacing, typography, radius } from '@/design-system/tokens';
import { sortMemories } from './memoryUtils';
import type { SharedMemory } from '@/types';

const memoriesEqual = (prev: SharedMemory[] | undefined, next: SharedMemory[]) =>
  JSON.stringify(prev) === JSON.stringify(next);

const FloatingMemoriesPanel: React.FC = () => {
  const { currentUser } = useUser();
  const { movies } = useMovies(currentUser, false);
  const { data, isLoading, error, refresh } = usePolling<SharedMemory[]>(
    getMemories,
    30000,
    memoriesEqual,
    {
      key: 'memories',
    }
  );

  const [note, setNote] = useState('');
  const [movieQuery, setMovieQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const sorted = useMemo(() => sortMemories(data || [], 'newest'), [data]);

  const matchedMovie = useMemo(() => {
    const query = movieQuery.trim().toLowerCase();
    if (!query) return null;
    return movies.find((movie) => movie.title.toLowerCase() === query) || null;
  }, [movieQuery, movies]);

  const createMemory = async () => {
    if (!currentUser) return;
    const trimmedNote = note.trim();
    const trimmedMovie = movieQuery.trim();
    if (!trimmedNote || !trimmedMovie) return;

    setSubmitting(true);
    try {
      await addMemory(
        matchedMovie?.id,
        matchedMovie?.title || trimmedMovie,
        currentUser,
        trimmedNote,
        new Date().toISOString()
      );
      setNote('');
      refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{ padding: spacing.md, color: colors.textPrimary, display: 'grid', gap: spacing.md }}
    >
      <div>
        <h3 style={{ margin: 0, marginBottom: spacing.xs }}>Memory Wall</h3>
        <p style={{ margin: 0, color: colors.textSecondary, fontSize: typography.fontSize.sm }}>
          Save moments tied to a movie title and pin favorites.
        </p>
      </div>

      <div
        style={{
          border: `1px solid ${colors.borderSecondary}35`,
          borderRadius: radius.md,
          padding: spacing.md,
          background: 'rgba(0,0,0,0.18)',
          display: 'grid',
          gap: spacing.sm,
        }}
      >
        <Input
          label="Movie title"
          value={movieQuery}
          onChange={(event) => setMovieQuery(event.target.value)}
          placeholder="e.g. The Last Unicorn"
        />
        <Textarea
          label="Memory"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="What made this one special?"
          style={{ minHeight: 90 }}
        />
        {currentUser ? (
          <Button
            onClick={createMemory}
            variant="primary"
            size="sm"
            disabled={submitting || !note.trim() || !movieQuery.trim()}
          >
            {submitting ? 'Saving...' : 'Save Memory'}
          </Button>
        ) : (
          <p style={{ margin: 0, color: colors.textSecondary, fontSize: typography.fontSize.xs }}>
            Select Aaron or Electra to add memories.
          </p>
        )}
      </div>

      <div style={{ display: 'grid', gap: spacing.sm }}>
        <h4 style={{ margin: 0, color: colors.textSecondary }}>
          Shared Notes {sorted.length > 0 ? `(${sorted.length})` : ''}
        </h4>
        {isLoading && sorted.length === 0 ? (
          <p style={{ margin: 0, color: colors.textSecondary }}>Loading memories...</p>
        ) : error ? (
          <p style={{ margin: 0, color: colors.error }}>
            {error instanceof Error ? error.message : 'Unable to load memories.'}
          </p>
        ) : sorted.length === 0 ? (
          <p style={{ margin: 0, color: colors.textSecondary }}>No memories yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: spacing.sm, maxHeight: 360, overflowY: 'auto' }}>
            {sorted.map((memory) => (
              <article
                key={memory.id}
                style={{
                  padding: spacing.sm,
                  border: `1px solid ${colors.borderSecondary}30`,
                  borderRadius: radius.sm,
                  background: memory.isPinned
                    ? 'rgba(255, 214, 122, 0.14)'
                    : 'rgba(255,255,255,0.03)',
                }}
              >
                <p style={{ margin: 0, fontWeight: typography.fontWeight.semibold }}>
                  {memory.movieTitle}
                </p>
                <p style={{ margin: `${spacing.xs} 0`, whiteSpace: 'pre-wrap' }}>{memory.note}</p>
                <div
                  style={{
                    display: 'flex',
                    gap: spacing.xs,
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    color: colors.textSecondary,
                    fontSize: typography.fontSize.xs,
                  }}
                >
                  <span>
                    {memory.author} ·{' '}
                    {new Date(memory.updatedAt || memory.createdAt).toLocaleDateString()}
                  </span>
                  <div style={{ display: 'flex', gap: spacing.xs }}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await toggleMemoryPin(memory.id);
                        refresh();
                      }}
                    >
                      {memory.isPinned ? 'Unpin' : 'Pin'}
                    </Button>
                    {currentUser ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          await deleteMemory(memory.id);
                          refresh();
                        }}
                      >
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FloatingMemoriesPanel;
