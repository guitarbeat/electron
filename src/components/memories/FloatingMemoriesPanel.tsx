import React, { useMemo, useState } from 'react';
import Button from '@/ui/Button';
import Input from '@/ui/Input';
import Textarea from '@/ui/Textarea';
import { useMovies } from '@/hooks/useMovies';
import { usePolling } from '@/hooks/usePolling';
import { useUser } from '@/context/UserContext';
import {
  addMemory,
  deleteMemory,
  getMemories,
  toggleMemoryPin,
  updateMemory,
} from '@/services/memoryService';
import { colors, spacing, typography, radius } from '@/design-system/tokens';
import { formatMemoryTimestamp, sortMemories } from './memoryUtils';
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
  const [search, setSearch] = useState('');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState('');

  const sorted = useMemo(() => sortMemories(data || [], 'newest'), [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sorted.filter((memory) => {
      if (showPinnedOnly && !memory.isPinned) return false;
      if (!q) return true;
      return `${memory.movieTitle} ${memory.note} ${memory.author}`.toLowerCase().includes(q);
    });
  }, [search, showPinnedOnly, sorted]);

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
      setMovieQuery('');
      refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (memory: SharedMemory) => {
    setEditingId(memory.id);
    setEditingNote(memory.note);
  };

  const saveEdit = async (memory: SharedMemory) => {
    const trimmed = editingNote.trim();
    if (!trimmed) return;
    await updateMemory(memory.id, { note: trimmed });
    setEditingId(null);
    setEditingNote('');
    refresh();
  };

  return (
    <div
      style={{ padding: spacing.md, color: colors.textPrimary, display: 'grid', gap: spacing.md }}
    >
      <div>
        <h3 style={{ margin: 0, marginBottom: spacing.xs }}>Memory Wall</h3>
        <p style={{ margin: 0, color: colors.textSecondary, fontSize: typography.fontSize.sm }}>
          Add, edit, pin, and search memories tied to your movies.
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
          list="memory-movie-suggestions"
        />
        <datalist id="memory-movie-suggestions">
          {movies.map((movie) => (
            <option key={movie.id} value={movie.title}>
              {movie.title}
            </option>
          ))}
        </datalist>
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
        <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
          <Input
            label="Search memories"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search notes, titles, or authors"
            style={{ flex: 1, minWidth: 220 }}
          />
          <Button
            size="sm"
            variant={showPinnedOnly ? 'primary' : 'ghost'}
            onClick={() => setShowPinnedOnly((current) => !current)}
            style={{ alignSelf: 'end' }}
          >
            {showPinnedOnly ? 'Showing Pinned' : 'Show Pinned Only'}
          </Button>
        </div>

        <h4 style={{ margin: 0, color: colors.textSecondary }}>
          Shared Notes {filtered.length > 0 ? `(${filtered.length})` : ''}
        </h4>
        {isLoading && filtered.length === 0 ? (
          <p style={{ margin: 0, color: colors.textSecondary }}>Loading memories...</p>
        ) : error ? (
          <p style={{ margin: 0, color: colors.error }}>
            {error instanceof Error ? error.message : 'Unable to load memories.'}
          </p>
        ) : filtered.length === 0 ? (
          <p style={{ margin: 0, color: colors.textSecondary }}>No memories match your filters.</p>
        ) : (
          <div style={{ display: 'grid', gap: spacing.sm, maxHeight: 380, overflowY: 'auto' }}>
            {filtered.map((memory) => (
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

                {editingId === memory.id ? (
                  <Textarea
                    label="Edit memory"
                    value={editingNote}
                    onChange={(event) => setEditingNote(event.target.value)}
                    style={{ minHeight: 80, marginTop: spacing.xs }}
                  />
                ) : (
                  <p style={{ margin: `${spacing.xs} 0`, whiteSpace: 'pre-wrap' }}>{memory.note}</p>
                )}

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
                    {memory.author} · {formatMemoryTimestamp(memory.updatedAt || memory.createdAt)}
                  </span>
                  <div style={{ display: 'flex', gap: spacing.xs, flexWrap: 'wrap' }}>
                    {editingId === memory.id ? (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => saveEdit(memory)}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(null);
                            setEditingNote('');
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
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
                          <>
                            <Button size="sm" variant="ghost" onClick={() => startEditing(memory)}>
                              Edit
                            </Button>
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
                          </>
                        ) : null}
                      </>
                    )}
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
