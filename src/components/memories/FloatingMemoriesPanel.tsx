import React, { useMemo, useState } from 'react';
import Button from '@/ui/Button';
import Input from '@/ui/Input';
import Textarea from '@/ui/Textarea';
import { useMovies } from '@/hooks/useMovies';
import { usePolling } from '@/hooks/usePolling';
import { useUser } from '@/context';
import {
  addMemory,
  deleteMemory,
  getMemories,
  toggleMemoryPin,
  updateMemory,
} from '@/services/memoryService';
import { formatMemoryTimestamp, sortMemories } from './memoryUtils';
import type { SharedMemory } from '@/types';
import { areDeeplyEqual } from '@/utils';

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
    <div className="memory-lane">
      <div className="memory-lane__header">
        <p className="memory-lane__eyebrow">iMessage scrapbook</p>
        <h3 className="memory-lane__title">Memory Lane</h3>
        <p className="memory-lane__subtitle">
          Add, edit, pin, and search little movie-night texts to your future selves.
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
          className="memory-lane__textarea"
          style={{ minHeight: 90 }}
        />
        {currentUser ? (
          <Button
            onClick={createMemory}
            variant="primary"
            size="sm"
            disabled={submitting || !note.trim() || !movieQuery.trim()}
            className="memory-lane__action-btn memory-lane__save memory-lane__action-btn--save"
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
            style={{ flex: 1, minWidth: 220 }}
          />
          <Button
            size="sm"
            variant={showPinnedOnly ? 'primary' : 'ghost'}
            onClick={() => setShowPinnedOnly((current) => !current)}
            className="memory-lane__pin-toggle"
          >
            {showPinnedOnly ? 'Showing Pinned' : 'Show Pinned Only'}
          </Button>
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
                    {memory.isPinned ? <span className="memory-lane__tag">★ Pinned</span> : null}
                  </div>

                  {editingId === memory.id ? (
                    <Textarea
                      label="Edit memory"
                      value={editingNote}
                      onChange={(event) => setEditingNote(event.target.value)}
                      className="memory-lane__textarea"
                      style={{ minHeight: 80, marginTop: '0.35rem' }}
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
