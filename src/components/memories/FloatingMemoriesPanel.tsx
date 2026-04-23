import React, { useCallback, useMemo, useState } from 'react';
import Button from '@/ui/Button';
import BottomSheet from '@/ui/BottomSheet';
import { Input, Textarea } from '@/ui/FormFields';
import { useMovies } from '@/hooks/movies/useMovies';
import { usePolling } from '@/services/polling';
import { useUser } from '@/app/useProviders';
import { mediaBreakpoints, useMediaQuery } from '@/hooks/useMediaQuery';
import {
  addMemory,
  deleteMemory,
  toggleMemoryPin,
  updateMemory,
} from '@/services/content/memoryService';
import { readScope } from '@/services/state';
import type { ScopeSnapshot } from '@/services/state/stateTypes';
import { formatMemoryTimestamp } from '@/utils';
import { sortMemories, type MemorySortMode } from './lib/memoryUtils';
import type { Movie, SharedMemory, User } from '@/shared/types';
import { areDeeplyEqual } from '@/utils';

const MEMORIES_POLLING_INTERVAL = 30000;

const FloatingMemoriesPanel: React.FC = () => {
  const { currentUser } = useUser();
  const isMobile = useMediaQuery(mediaBreakpoints.sm);
  const { movies } = useMovies(currentUser, false);
  const readMemories = useCallback(
    (): Promise<ScopeSnapshot<SharedMemory[]>> => readScope('memories'),
    []
  );
  const { data: snapshot, isLoading, error, refresh } = usePolling(
    readMemories,
    MEMORIES_POLLING_INTERVAL,
    areDeeplyEqual,
    { key: 'memories' }
  );

  const [note, setNote] = useState('');
  const [movieQuery, setMovieQuery] = useState('');
  const [search, setSearch] = useState('');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState('');
  const [sortMode, setSortMode] = useState<MemorySortMode>('newest');
  const [imageUrl, setImageUrl] = useState('');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [showPinnedRail, setShowPinnedRail] = useState(false);

  const memories = useMemo(() => snapshot?.data ?? [], [snapshot?.data]);
  const sorted = useMemo(() => sortMemories(memories, sortMode), [memories, sortMode]);
  const pinnedMemories = useMemo(
    () => sorted.filter((memory) => memory.isPinned),
    [sorted]
  );

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

  const movieCount = useMemo(
    () => new Set(memories.map((memory) => memory.movieTitle.trim().toLowerCase())).size,
    [memories]
  );
  const moviesById = useMemo(
    () => new Map(movies.map((movie) => [movie.id, movie])),
    [movies]
  );
  const moviesByTitle = useMemo(
    () =>
      new Map(
        movies.map((movie) => [movie.title.trim().toLowerCase(), movie])
      ),
    [movies]
  );
  const movieByMemoryId = useMemo(() => {
    const resolved = new Map<string, Movie | null>();

    memories.forEach((memory) => {
      const normalizedTitle = memory.movieTitle.trim().toLowerCase();
      resolved.set(
        memory.id,
        (memory.movieId ? moviesById.get(memory.movieId) : undefined) ??
          moviesByTitle.get(normalizedTitle) ??
          null
      );
    });

    return resolved;
  }, [memories, moviesById, moviesByTitle]);

  const canSubmit = Boolean(currentUser && note.trim() && movieQuery.trim());
  const showPinnedSection = pinnedMemories.length > 0 && (!isMobile || showPinnedRail);

  const closeComposer = () => setIsComposerOpen(false);

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
      setIsComposerOpen(false);
      refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (memory: SharedMemory) => {
    if (!currentUser || memory.author !== currentUser) {
      return;
    }
    setEditingId(memory.id);
    setEditingNote(memory.note);
  };

  const saveEdit = async (memory: SharedMemory) => {
    if (!currentUser || memory.author !== currentUser) {
      setEditingId(null);
      setEditingNote('');
      return;
    }
    const trimmed = editingNote.trim();
    if (!trimmed) return;
    await updateMemory(memory.id, { note: trimmed });
    setEditingId(null);
    setEditingNote('');
    refresh();
  };

  const composerContent = (
    <>
      <div className="memory-ledger__section-head">
        <p className="memory-ledger__section-title">New entry</p>
        <p className="memory-ledger__section-meta">
          {currentUser ? `${currentUser} can add to the shared archive.` : 'Sign in to add a memory.'}
        </p>
      </div>

      <Input
        label="Title"
        value={movieQuery}
        onChange={(event) => setMovieQuery(event.target.value)}
        placeholder="Movie or episode"
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

      <Input
        label="Image URL"
        value={imageUrl}
        onChange={(event) => setImageUrl(event.target.value)}
        placeholder="Optional still or photo"
        className="memory-lane__input"
      />

      <Textarea
        label="Memory"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Quote the moment, reaction, or detail worth keeping."
        className="memory-lane__textarea"
        style={{ minHeight: isMobile ? 176 : 220 }}
      />

      {currentUser ? (
        <div className="memory-ledger__composer-actions">
          <Button
            onClick={createMemory}
            variant="primary"
            size="sm"
            disabled={submitting || !canSubmit}
            className="memory-lane__action-btn memory-lane__action-btn--save"
          >
            {submitting ? 'Saving...' : 'Save memory'}
          </Button>
          <Button
            onClick={closeComposer}
            variant="ghost"
            size="sm"
            className="memory-lane__action-btn"
          >
            Close
          </Button>
        </div>
      ) : (
        <p className="memory-lane__hint">Select Aaron or Electra to add memories.</p>
      )}
    </>
  );

  return (
    <div className="memory-lane memory-lane--editorial">
      <section className="memory-ledger">
        <header className="memory-ledger__header">
          <div className="memory-ledger__title-block">
            <p className="memory-ledger__eyebrow">Notes and memories</p>
            <h3 className="memory-ledger__title">Notes on the posters</h3>
          </div>

          <div className="memory-ledger__stats" aria-label="Memory summary">
            <div className="memory-ledger__stat">
              <span className="memory-ledger__stat-value">{memories.length}</span>
              <span className="memory-ledger__stat-label">Entries</span>
            </div>
            <div className="memory-ledger__stat">
              <span className="memory-ledger__stat-value">{pinnedMemories.length}</span>
              <span className="memory-ledger__stat-label">Pinned</span>
            </div>
            <div className="memory-ledger__stat">
              <span className="memory-ledger__stat-value">{movieCount}</span>
              <span className="memory-ledger__stat-label">Titles</span>
            </div>
          </div>
        </header>

        <div className="memory-ledger__toolbar">
          <div className="memory-ledger__toolbar-group">
            <Button
              size="sm"
              variant={isComposerOpen ? 'primary' : 'ghost'}
              onClick={() => setIsComposerOpen((current) => !current)}
              className="memory-lane__action-btn"
            >
              {isComposerOpen ? 'Hide composer' : 'New memory'}
            </Button>
            {pinnedMemories.length > 0 ? (
              <Button
                size="sm"
                variant={showPinnedRail ? 'primary' : 'ghost'}
                onClick={() => setShowPinnedRail((current) => !current)}
                className="memory-lane__action-btn"
              >
                {showPinnedRail ? 'Hide pinned' : `Pinned (${pinnedMemories.length})`}
              </Button>
            ) : null}
          </div>

          <div className="memory-ledger__toolbar-group">
            <Button
              size="sm"
              variant={showPinnedOnly ? 'primary' : 'ghost'}
              onClick={() => setShowPinnedOnly((current) => !current)}
              className="memory-lane__action-btn"
            >
              {showPinnedOnly ? 'Pinned only' : 'All entries'}
            </Button>
          </div>
        </div>

        {showPinnedSection ? (
          <section className="memory-ledger__pinned" aria-label="Pinned memories">
            <div className="memory-ledger__section-head">
              <p className="memory-ledger__section-title">Pinned</p>
              <p className="memory-ledger__section-meta">Keep a few notes on their posters.</p>
            </div>
            <div className="memory-ledger__poster-grid">
              {pinnedMemories.map((memory) => (
                <MemoryPosterCard
                  key={memory.id}
                  memory={memory}
                  movie={movieByMemoryId.get(memory.id) ?? null}
                  currentUser={currentUser}
                  isEditing={editingId === memory.id}
                  editingNote={editingNote}
                  onEditingNoteChange={setEditingNote}
                  onStartEditing={() => startEditing(memory)}
                  onCancelEditing={() => {
                    setEditingId(null);
                    setEditingNote('');
                  }}
                  onSaveEdit={async () => {
                    await saveEdit(memory);
                  }}
                  onPin={async () => {
                    await toggleMemoryPin(memory.id);
                    refresh();
                  }}
                  onDelete={
                    currentUser === memory.author
                      ? async () => {
                          await deleteMemory(memory.id);
                          refresh();
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          </section>
        ) : null}

        {!isMobile && isComposerOpen ? (
          <section className="memory-ledger__composer-stage">
            <div className="memory-ledger__composer memory-ledger__composer--stage">
              {composerContent}
            </div>
          </section>
        ) : null}

        <section className="memory-ledger__workspace">
          <section className="memory-ledger__stream">
            <div className="memory-ledger__controls">
              <Input
                label="Search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search titles, notes, or authors"
                className="memory-lane__input memory-ledger__search"
              />

              <div className="memory-ledger__toggle-row">
                <Button
                  size="sm"
                  variant={sortMode === 'newest' ? 'primary' : 'ghost'}
                  onClick={() => setSortMode(sortMode === 'newest' ? 'oldest' : 'newest')}
                  className="memory-lane__action-btn"
                >
                  {sortMode === 'newest' ? 'Newest first' : 'Oldest first'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsComposerOpen((current) => !current)}
                  className="memory-lane__action-btn"
                >
                  {isComposerOpen ? 'Hide composer' : 'Write memory'}
                </Button>
              </div>
            </div>

            <div className="memory-ledger__section-head">
              <p className="memory-ledger__section-title">Archive</p>
              <p className="memory-ledger__section-meta">
                {filtered.length} visible {filtered.length === 1 ? 'poster' : 'posters'}
              </p>
            </div>

            {isLoading && filtered.length === 0 ? (
              <p className="memory-lane__status">Loading memories...</p>
            ) : null}
            {error ? (
              <p className="memory-lane__status memory-lane__status--error">
                {error instanceof Error ? error.message : 'Unable to load memories.'}
              </p>
            ) : null}
            {!isLoading && !error && filtered.length === 0 ? (
              <p className="memory-lane__status">No memories match the current filters.</p>
            ) : null}

            {!error && filtered.length > 0 ? (
              <div className="memory-ledger__poster-grid">
                {filtered.map((memory) => (
                  <MemoryPosterCard
                    key={memory.id}
                    memory={memory}
                    movie={movieByMemoryId.get(memory.id) ?? null}
                    currentUser={currentUser}
                    isEditing={editingId === memory.id}
                    editingNote={editingNote}
                    onEditingNoteChange={setEditingNote}
                    onStartEditing={() => startEditing(memory)}
                    onCancelEditing={() => {
                      setEditingId(null);
                      setEditingNote('');
                    }}
                    onSaveEdit={async () => {
                      await saveEdit(memory);
                    }}
                    onPin={async () => {
                      await toggleMemoryPin(memory.id);
                      refresh();
                    }}
                    onDelete={
                      currentUser === memory.author
                        ? async () => {
                            await deleteMemory(memory.id);
                            refresh();
                          }
                        : undefined
                    }
                  />
                ))}
              </div>
            ) : null}
          </section>
        </section>

        {isMobile ? (
          <BottomSheet
            isOpen={isComposerOpen}
            onClose={closeComposer}
            title="Write Memory"
          >
            <div className="memory-ledger__composer memory-ledger__composer--sheet">
              {composerContent}
            </div>
          </BottomSheet>
        ) : null}
      </section>
    </div>
  );
};

export default FloatingMemoriesPanel;

interface MemoryPosterCardProps {
  memory: SharedMemory;
  movie: Movie | null;
  currentUser: User | null;
  isEditing: boolean;
  editingNote: string;
  onEditingNoteChange: (value: string) => void;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onSaveEdit: () => Promise<void>;
  onPin: () => Promise<void>;
  onDelete?: () => Promise<void>;
}

const MemoryPosterCard: React.FC<MemoryPosterCardProps> = ({
  memory,
  movie,
  currentUser,
  isEditing,
  editingNote,
  onEditingNoteChange,
  onStartEditing,
  onCancelEditing,
  onSaveEdit,
  onPin,
  onDelete,
}) => {
  const isMine = currentUser === memory.author;
  const posterUrl = movie?.posterUrl || memory.imageUrl;
  const timestamp = formatMemoryTimestamp(memory.updatedAt || memory.createdAt);
  const posterStyle = posterUrl
    ? ({
        backgroundImage: `linear-gradient(180deg, rgba(7, 5, 9, 0.12) 0%, rgba(7, 5, 9, 0.36) 36%, rgba(7, 5, 9, 0.92) 100%), url("${posterUrl}")`,
      } as React.CSSProperties)
    : undefined;

  return (
    <article
      className={`memory-poster-card${memory.isPinned ? ' is-pinned' : ''}${isMine ? ' is-mine' : ''}`}
    >
      <div
        className={`memory-poster-card__surface${posterUrl ? ' has-poster' : ' is-fallback'}`}
        style={posterStyle}
      >
        {!posterUrl ? (
          <div className="memory-poster-card__fallback-mark" aria-hidden>
            {memory.movieTitle}
          </div>
        ) : null}

        <div className="memory-poster-card__chips">
          <span className="memory-poster-card__chip">{memory.author}</span>
          {memory.isPinned ? <span className="memory-poster-card__chip">Pinned</span> : null}
        </div>

        <div className="memory-poster-card__caption">
          <div className="memory-poster-card__header">
            <div>
              <p className="memory-poster-card__title">{memory.movieTitle}</p>
              <p className="memory-poster-card__meta">{timestamp}</p>
            </div>
          </div>

          {isEditing ? (
            <Textarea
              label="Edit note"
              value={editingNote}
              onChange={(event) => onEditingNoteChange(event.target.value)}
              className="memory-lane__textarea memory-poster-card__textarea"
              style={{ minHeight: 126 }}
            />
          ) : (
            <p className="memory-poster-card__note" title={memory.note}>
              {memory.note}
            </p>
          )}

          <div className="memory-poster-card__actions">
            {isEditing ? (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={onSaveEdit}
                  className="memory-lane__action-btn memory-lane__action-btn--save"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onCancelEditing}
                  className="memory-lane__action-btn"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onPin}
                  className="memory-lane__action-btn"
                >
                  {memory.isPinned ? 'Unpin' : 'Pin'}
                </Button>
                {isMine ? (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onStartEditing}
                      className="memory-lane__action-btn"
                    >
                      Edit
                    </Button>
                    {onDelete ? (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={onDelete}
                        className="memory-lane__action-btn"
                      >
                        Delete
                      </Button>
                    ) : null}
                  </>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
