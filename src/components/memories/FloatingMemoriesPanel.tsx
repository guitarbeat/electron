import React, { useMemo, useState } from 'react';
import Button from '@/ui/Button';
import { Input, Textarea } from '@/ui/FormFields';
import { useMovies } from '@/hooks/useMovies';
import { usePolling } from '@/services/polling';
import { useUser } from '@/app/providers';
import {
  addMemory,
  deleteMemory,
  getMemories,
  toggleMemoryPin,
  updateMemory,
} from '@/services/memoryService';
import { formatMemoryTimestamp } from '@/utils/date';
import { sortMemories } from './memoryUtils';
import type { SharedMemory } from '@/shared/types';
import { areDeeplyEqual } from '@/utils';
import PolaroidMemory from './PolaroidMemory';
import { colors, spacing, radius } from '@/theme/tokens';

const memoryLaneInputStyle: React.CSSProperties = {
  borderRadius: '18px',
  background:
    'linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, transparent 30%), rgba(12, 12, 18, 0.28)',
  borderColor: 'color-mix(in srgb, var(--color-border-secondary, var(--color-accent)) 42%, transparent)',
};

const memoryLaneTextareaStyle: React.CSSProperties = {
  borderRadius: '18px',
  background:
    'linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, transparent 24%), rgba(17, 20, 35, 0.78)',
  borderColor: 'color-mix(in srgb, var(--color-accent) 36%, transparent)',
};

const memoryLaneAccentActionStyle: React.CSSProperties = {
  color: '#f5f9ff',
  border: '1px solid color-mix(in srgb, var(--color-accent) 40%, transparent)',
};

const FloatingMemoriesPanel: React.FC = () => {
  const { currentUser } = useUser();
  const { movies } = useMovies(currentUser, false);
  const { data, isLoading, error, refresh } = usePolling<SharedMemory[]>(
    getMemories,
    30000,
    areDeeplyEqual,
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
  const [viewMode, setViewMode] = useState<'list' | 'scrapbook'>('list');
  const [imageUrl, setImageUrl] = useState('');

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
        new Date().toISOString(),
        imageUrl.trim() || undefined
      );
      setNote('');
      setMovieQuery('');
      setImageUrl('');
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
    <div className="memory-lane">
      <div className="memory-lane__header">
        <p className="memory-lane__eyebrow">Movie notes</p>
        <h3 className="memory-lane__title">Notes</h3>
        <p className="memory-lane__subtitle">
          Add, edit, pin, and search the notes you want to keep with your movies.
        </p>
      </div>

      <div className="memory-lane__composer">
        <Input
          label="Movie title"
          value={movieQuery}
          onChange={(event) => setMovieQuery(event.target.value)}
          placeholder="e.g. The Last Unicorn"
          list="memory-movie-suggestions"
          className="memory-lane__input"
          style={memoryLaneInputStyle}
        />
        <datalist id="memory-movie-suggestions">
          {movies.map((movie) => (
            <option key={movie.id} value={movie.title}>
              {movie.title}
            </option>
          ))}
        </datalist>
        <Input
          label="Image URL (optional)"
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          placeholder="https://example.com/photo.jpg"
          className="memory-lane__input"
          style={memoryLaneInputStyle}
        />
        <Textarea
          label="Memory"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="What made this one special?"
          className="memory-lane__textarea"
          style={{ ...memoryLaneTextareaStyle, minHeight: 90 }}
        />
        {currentUser ? (
          <Button
            onClick={createMemory}
            variant="primary"
            size="sm"
            disabled={submitting || !note.trim() || !movieQuery.trim()}
            className="memory-lane__action-btn memory-lane__save memory-lane__action-btn--save"
            style={memoryLaneAccentActionStyle}
          >
            {submitting ? 'Saving...' : 'Save Memory'}
          </Button>
        ) : (
          <p className="memory-lane__hint">Select Aaron or Electra to add memories.</p>
        )}
      </div>

      <div className="memory-lane__controls">
        <div className="memory-lane__search-row">
          <Input
            label="Search memories"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search notes, titles, or authors"
            className="memory-lane__input"
            style={{ ...memoryLaneInputStyle, flex: 1, minWidth: 220 }}
          />
          <Button
            size="sm"
            variant={showPinnedOnly ? 'primary' : 'ghost'}
            onClick={() => setShowPinnedOnly((current) => !current)}
            className="memory-lane__pin-toggle"
          >
            {showPinnedOnly ? 'Showing Pinned' : 'Show Pinned Only'}
          </Button>
          <div style={{ display: 'flex', gap: spacing.xs, background: colors.surface2, padding: '4px', borderRadius: radius.md }}>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('list')}
              style={{ padding: '4px 8px', minWidth: '40px' }}
              title="List View"
            >
              💬
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'scrapbook' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('scrapbook')}
              style={{ padding: '4px 8px', minWidth: '40px' }}
              title="Scrapbook View"
            >
              📸
            </Button>
          </div>
        </div>

        <h4 className="memory-lane__thread-title">
          Shared Notes {filtered.length > 0 ? `(${filtered.length})` : ''}
        </h4>
        {isLoading && filtered.length === 0 ? (
          <p className="memory-lane__status">Loading memories...</p>
        ) : error ? (
          <p className="memory-lane__status memory-lane__status--error">
            {error instanceof Error ? error.message : 'Unable to load memories.'}
          </p>
        ) : filtered.length === 0 ? (
          <p className="memory-lane__status">No memories match your filters.</p>
        ) : viewMode === 'scrapbook' ? (
          <div
            className="memory-lane__scrapbook"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '2rem',
              padding: '2rem 1rem',
              justifyItems: 'center',
            }}
          >
            {filtered.map((memory) => (
              <PolaroidMemory
                key={memory.id}
                memory={memory}
                onPin={async () => {
                  await toggleMemoryPin(memory.id);
                  refresh();
                }}
                onDelete={async () => {
                  if (window.confirm('Delete this memory forever?')) {
                    await deleteMemory(memory.id);
                    refresh();
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <div className="memory-lane__thread">
            {filtered.map((memory) => (
              <article
                key={memory.id}
                className={`memory-lane__message${currentUser === memory.author ? ' memory-lane__message--mine' : ' memory-lane__message--theirs'}`}
              >
                <div
                  className={`memory-lane__bubble${currentUser === memory.author ? ' memory-lane__bubble--mine' : ' memory-lane__bubble--theirs'}${memory.isPinned ? ' is-pinned' : ''}`}
                >
                  <div className="memory-lane__bubble-top">
                    <div className="memory-lane__bubble-copy">
                      <p className="memory-lane__movie">{memory.movieTitle}</p>
                      <p className="memory-lane__meta">
                        {memory.author} ·{' '}
                        {formatMemoryTimestamp(memory.updatedAt || memory.createdAt)}
                      </p>
                    </div>
                    {memory.isPinned ? <span className="memory-lane__tag">Pinned</span> : null}
                  </div>

                  {editingId === memory.id ? (
                    <Textarea
                      label="Edit memory"
                      value={editingNote}
                      onChange={(event) => setEditingNote(event.target.value)}
                      className="memory-lane__textarea"
                      style={{ ...memoryLaneTextareaStyle, minHeight: 80, marginTop: '0.35rem' }}
                    />
                  ) : (
                    <p className="memory-lane__note">{memory.note}</p>
                  )}

                  <div className="memory-lane__actions">
                    {editingId === memory.id ? (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => saveEdit(memory)}
                          className="memory-lane__action-btn memory-lane__action-btn--save"
                          style={memoryLaneAccentActionStyle}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(null);
                            setEditingNote('');
                          }}
                          className="memory-lane__action-btn memory-lane__action-btn--cancel"
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
                          className="memory-lane__action-btn memory-lane__action-btn--pin"
                        >
                          {memory.isPinned ? 'Unpin' : 'Pin'}
                        </Button>
                        {currentUser ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditing(memory)}
                              className="memory-lane__action-btn memory-lane__action-btn--edit"
                              style={memoryLaneAccentActionStyle}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={async () => {
                                await deleteMemory(memory.id);
                                refresh();
                              }}
                              className="memory-lane__action-btn memory-lane__action-btn--delete"
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
