import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Movie, SharedMemory, User } from '../types';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import Textarea from './ui/Textarea';
import { spacing, typography, colors, radius } from '../design-system/tokens';
import { useMemories } from '../hooks/useMemories';
import { useMediaQuery, breakpoints } from '../hooks/useMediaQuery';

interface MemoryWallProps {
  watchedMovies: Movie[];
  currentUser: User | null;
}

const MAX_NOTE_LENGTH = 280;
const MAX_AUTHOR_LENGTH = 40;
const INITIAL_VISIBLE_COUNT = 6;
const VISIBLE_COUNT_STEP = 6;
const ALL_MOVIES_FILTER = 'all';

type MemorySortMode = 'newest' | 'oldest';

interface StickyNoteTheme {
  background: string;
  border: string;
  heading: string;
  text: string;
  meta: string;
  signature: string;
  pin: string;
}

const STICKY_NOTE_THEMES: StickyNoteTheme[] = [
  {
    background: 'linear-gradient(165deg, #fff4a6 0%, #f9e07a 72%, #efd46a 100%)',
    border: '#d0b45b',
    heading: '#4b3810',
    text: '#44330f',
    meta: '#6a5523',
    signature: '#7a3f00',
    pin: '#e45858',
  },
  {
    background: 'linear-gradient(165deg, #b7f5ff 0%, #98e4f5 70%, #7ed2e8 100%)',
    border: '#72bccf',
    heading: '#12394a',
    text: '#113341',
    meta: '#2c5160',
    signature: '#115073',
    pin: '#f56f42',
  },
  {
    background: 'linear-gradient(165deg, #ffd3b2 0%, #ffbf96 74%, #f8ad84 100%)',
    border: '#dd9367',
    heading: '#5e2c10',
    text: '#4e2a12',
    meta: '#754220',
    signature: '#8a3412',
    pin: '#47906f',
  },
  {
    background: 'linear-gradient(165deg, #dcf8c5 0%, #c8ebaa 73%, #b2d78f 100%)',
    border: '#95b572',
    heading: '#2e4b1e',
    text: '#2d461d',
    meta: '#496838',
    signature: '#3f6a1f',
    pin: '#4168d6',
  },
];

const STICKY_NOTE_ROTATIONS = [-2.3, 1.8, -1.2, 2.4, -0.7, 1.1, -1.8, 2.7];

const getMemoryMovieKey = (memory: SharedMemory): string => {
  return memory.movieId || `title:${memory.movieTitle.trim().toLowerCase()}`;
};

const getMemorySeed = (memory: SharedMemory): number => {
  const source = `${memory.id}|${memory.movieTitle}|${memory.author}|${memory.createdAt}`;
  let hash = 0;

  for (let index = 0; index < source.length; index += 1) {
    hash = (hash << 5) - hash + source.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
};

const getStickyNoteTheme = (memory: SharedMemory): StickyNoteTheme => {
  const seed = getMemorySeed(memory);
  return STICKY_NOTE_THEMES[seed % STICKY_NOTE_THEMES.length];
};

const getStickyNoteRotation = (memory: SharedMemory): number => {
  const seed = getMemorySeed(memory);
  return STICKY_NOTE_ROTATIONS[seed % STICKY_NOTE_ROTATIONS.length];
};

const formatMemoryTimestamp = (createdAt: string): string => {
  const parsedDate = new Date(createdAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return 'Unknown date';
  }

  return parsedDate.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const MemoryWall: React.FC<MemoryWallProps> = ({ watchedMovies, currentUser }) => {
  const { memories, addMemory, isLoading, error: memoriesError } = useMemories();
  const isMobile = useMediaQuery(breakpoints.sm);
  const noteInputRef = useRef<HTMLTextAreaElement | null>(null);

  const [selectedMovieId, setSelectedMovieId] = useState<string>('');
  const [author, setAuthor] = useState(currentUser || '');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [activeMovieFilter, setActiveMovieFilter] = useState(ALL_MOVIES_FILTER);
  const [sortMode, setSortMode] = useState<MemorySortMode>('newest');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setAuthor(currentUser);
    }
  }, [currentUser]);

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
      setActiveMovieFilter(ALL_MOVIES_FILTER);
    }
  }, [activeMovieFilter, memories]);

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

  const authorSuggestions = useMemo(() => {
    const memoryAuthorCounts = new Map<string, number>();

    memories.forEach((memory) => {
      const trimmedAuthor = memory.author.trim();
      if (!trimmedAuthor) return;
      memoryAuthorCounts.set(trimmedAuthor, (memoryAuthorCounts.get(trimmedAuthor) || 0) + 1);
    });

    const frequentAuthors = Array.from(memoryAuthorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);

    const seeds = [currentUser || '', ...frequentAuthors];
    return Array.from(
      new Set(seeds.map((name) => name.trim()).filter((name) => name.length > 0))
    ).slice(0, 4);
  }, [currentUser, memories]);

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
    Boolean(selectedMovie) &&
    Boolean(author.trim()) &&
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
    if (!author.trim() || !note.trim()) {
      setError('Please add your name and a memory note.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await addMemory(selectedMovie.id, selectedMovie.title, author, note);
      setNote('');
      setSuccessMessage(`Memory saved for ${selectedMovie.title}.`);
      setActiveMovieFilter(selectedMovie.id);
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
        <div
          style={{
            marginBottom: spacing.md,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: spacing.sm,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                color: '#fff5e6',
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                fontFamily: typography.fontFamily.heading.join(', '),
                letterSpacing: typography.letterSpacing.wide,
              }}
            >
              Shared Memory Wall
            </h3>
            <p
              style={{
                margin: `${spacing.xs} 0 0`,
                color: '#f7e0c3',
                fontSize: typography.fontSize.sm,
              }}
            >
              Pin your favorite movie-night moments like sticky notes on a board.
            </p>
          </div>

          <Button
            type="button"
            variant={isComposerOpen ? 'ghost' : 'secondary'}
            size="sm"
            onClick={handleComposerToggle}
            style={{
              border: '1px solid rgba(255, 227, 173, 0.5)',
              minHeight: '38px',
              color: '#fff4dc',
              backgroundColor: isComposerOpen ? 'rgba(44, 25, 11, 0.42)' : undefined,
            }}
          >
            {isComposerOpen ? 'Hide Composer' : 'Add Memory'}
          </Button>
        </div>

        {watchedMovies.length === 0 && (
          <div
            style={{
              marginBottom: spacing.md,
              border: '1px solid rgba(209, 162, 79, 0.75)',
              background:
                'linear-gradient(160deg, rgba(255, 233, 174, 0.95) 0%, rgba(244, 202, 124, 0.95) 100%)',
              color: '#4a2e15',
              borderRadius: radius.sm,
              padding: spacing.sm,
              fontSize: typography.fontSize.sm,
              boxShadow: '0 8px 14px rgba(0,0,0,0.25)',
            }}
          >
            Mark a movie as watched by both of you first, then memories unlock automatically.
          </div>
        )}

        {isComposerOpen && (
          <div
            style={{
              marginBottom: spacing.md,
              position: 'relative',
            }}
          >
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: '-10px',
                left: isMobile ? '12px' : '22px',
                width: '72px',
                height: '20px',
                background: 'rgba(252, 241, 214, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                transform: 'rotate(-8deg)',
                borderRadius: radius.sm,
                boxShadow: '0 2px 3px rgba(0,0,0,0.18)',
                pointerEvents: 'none',
              }}
            />
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: '-10px',
                right: isMobile ? '12px' : '26px',
                width: '72px',
                height: '20px',
                background: 'rgba(252, 241, 214, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                transform: 'rotate(7deg)',
                borderRadius: radius.sm,
                boxShadow: '0 2px 3px rgba(0,0,0,0.18)',
                pointerEvents: 'none',
              }}
            />
            <form
              onSubmit={handleAddMemory}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.sm,
                marginBottom: 0,
                padding: isMobile ? spacing.sm : spacing.md,
                border: '1px solid rgba(255, 228, 177, 0.35)',
                borderRadius: radius.md,
                background:
                  'linear-gradient(165deg, rgba(25, 35, 60, 0.86) 0%, rgba(17, 24, 42, 0.93) 100%)',
                boxShadow: '0 12px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1.2fr 0.8fr',
                  gap: spacing.sm,
                }}
              >
                <label style={{ color: colors.textSecondary, fontSize: typography.fontSize.xs }}>
                  Movie
                  <select
                    value={selectedMovieId}
                    onChange={(e) => {
                      setSelectedMovieId(e.target.value);
                      setSuccessMessage(null);
                    }}
                    disabled={watchedMovies.length === 0 || isSubmitting}
                    style={{
                      marginTop: spacing.xs,
                      width: '100%',
                      height: '44px',
                      borderRadius: radius.md,
                      border: `1px solid ${colors.borderSecondary}40`,
                      backgroundColor: colors.surface,
                      color: colors.textPrimary,
                      padding: `0 ${spacing.sm}`,
                      fontFamily: typography.fontFamily.body.join(', '),
                    }}
                  >
                    {watchedMovies.length === 0 ? (
                      <option value="">No shared watches yet</option>
                    ) : (
                      watchedMovieOptions.map((movie) => (
                        <option key={movie.id} value={movie.id}>
                          {movie.title}
                        </option>
                      ))
                    )}
                  </select>
                </label>

                <Input
                  label="By"
                  value={author}
                  onChange={(e) => {
                    setAuthor(e.target.value.slice(0, MAX_AUTHOR_LENGTH));
                    setSuccessMessage(null);
                  }}
                  placeholder="Your name"
                  disabled={isSubmitting}
                  style={{ height: '44px' }}
                />
              </div>

              {authorSuggestions.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.xs,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ color: colors.textTertiary, fontSize: typography.fontSize.xs }}>
                    Quick names:
                  </span>
                  {authorSuggestions.map((suggestedAuthor) => (
                    <button
                      key={suggestedAuthor}
                      type="button"
                      onClick={() => {
                        setAuthor(suggestedAuthor);
                        setSuccessMessage(null);
                      }}
                      style={{
                        border: `1px solid ${colors.borderSecondary}50`,
                        borderRadius: radius.full,
                        padding: `2px ${spacing.sm}`,
                        background:
                          author.trim() === suggestedAuthor
                            ? 'rgba(135, 206, 250, 0.24)'
                            : 'rgba(135, 206, 250, 0.12)',
                        color: colors.textPrimary,
                        fontSize: typography.fontSize.xs,
                        cursor: 'pointer',
                      }}
                    >
                      {suggestedAuthor}
                    </button>
                  ))}
                </div>
              )}

              <Textarea
                ref={noteInputRef}
                label="Memory"
                value={note}
                onChange={(e) => {
                  setNote(e.target.value.slice(0, MAX_NOTE_LENGTH));
                  setSuccessMessage(null);
                }}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="What made this movie night special?"
                disabled={isSubmitting || watchedMovies.length === 0}
                style={{ minHeight: isMobile ? '100px' : '120px' }}
              />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: isMobile ? 'flex-start' : 'center',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: spacing.sm,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span
                    style={{
                      color: remainingChars <= 30 ? colors.warning : colors.textTertiary,
                      fontSize: typography.fontSize.xs,
                      fontWeight:
                        remainingChars <= 30
                          ? typography.fontWeight.bold
                          : typography.fontWeight.normal,
                    }}
                  >
                    {remainingChars} chars left
                  </span>
                  <span style={{ color: colors.textTertiary, fontSize: typography.fontSize.xs }}>
                    Tip: press Ctrl/Cmd + Enter to save.
                  </span>
                </div>
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={!canSubmit}
                  isLoading={isSubmitting}
                  style={{ minHeight: '44px', minWidth: isMobile ? '100%' : '140px' }}
                >
                  Save Memory
                </Button>
              </div>

              {error && (
                <div
                  style={{
                    color: colors.error,
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.bold,
                  }}
                  role="status"
                  aria-live="polite"
                >
                  {error}
                </div>
              )}
              {successMessage && (
                <div
                  style={{
                    color: colors.success,
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.bold,
                  }}
                  role="status"
                  aria-live="polite"
                >
                  {successMessage}
                </div>
              )}
            </form>
          </div>
        )}

        <div
          style={{
            marginTop: spacing.lg,
            padding: isMobile ? spacing.sm : spacing.md,
            borderRadius: radius.md,
            border: '1px solid rgba(255, 228, 177, 0.34)',
            background:
              'linear-gradient(165deg, rgba(57, 34, 18, 0.45) 0%, rgba(38, 22, 11, 0.55) 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: spacing.sm,
              flexWrap: 'wrap',
              marginBottom: spacing.sm,
            }}
          >
            <h4
              style={{
                margin: 0,
                color: '#ffe3b1',
                fontSize: typography.fontSize.base,
                fontFamily: typography.fontFamily.heading.join(', '),
                letterSpacing: typography.letterSpacing.normal,
              }}
            >
              Latest Memories
            </h4>
            <span style={{ color: '#f7ddba', fontSize: typography.fontSize.xs }}>
              {sortedMemories.length} pinned
            </span>
          </div>

          {memories.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr auto',
                gap: spacing.sm,
                marginBottom: spacing.sm,
                padding: spacing.sm,
                border: '1px dashed rgba(255, 227, 172, 0.3)',
                borderRadius: radius.sm,
                background: 'rgba(18, 25, 43, 0.32)',
              }}
            >
              <label style={{ color: colors.textSecondary, fontSize: typography.fontSize.xs }}>
                Filter by movie
                <select
                  value={activeMovieFilter}
                  onChange={(e) => setActiveMovieFilter(e.target.value)}
                  style={{
                    marginTop: spacing.xs,
                    width: '100%',
                    height: '40px',
                    borderRadius: radius.md,
                    border: `1px solid ${colors.borderSecondary}40`,
                    backgroundColor: colors.surface,
                    color: colors.textPrimary,
                    padding: `0 ${spacing.sm}`,
                    fontFamily: typography.fontFamily.body.join(', '),
                  }}
                >
                  <option value={ALL_MOVIES_FILTER}>All movies</option>
                  {movieFilterOptions.map((movieOption) => (
                    <option key={movieOption.id} value={movieOption.id}>
                      {movieOption.title}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ color: colors.textSecondary, fontSize: typography.fontSize.xs }}>
                Sort
                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as MemorySortMode)}
                  style={{
                    marginTop: spacing.xs,
                    width: '100%',
                    minWidth: isMobile ? '100%' : '170px',
                    height: '40px',
                    borderRadius: radius.md,
                    border: `1px solid ${colors.borderSecondary}40`,
                    backgroundColor: colors.surface,
                    color: colors.textPrimary,
                    padding: `0 ${spacing.sm}`,
                    fontFamily: typography.fontFamily.body.join(', '),
                  }}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </label>
            </div>
          )}

          {isLoading && memories.length === 0 && (
            <p style={{ margin: 0, color: colors.textSecondary }}>Loading memories...</p>
          )}

          {memoriesError && memories.length === 0 && (
            <p style={{ margin: 0, color: colors.error, fontSize: typography.fontSize.sm }}>
              Couldn&apos;t load memories right now. Try again in a few seconds.
            </p>
          )}

          {!isLoading && !memoriesError && visibleMemories.length === 0 && (
            <p style={{ margin: 0, color: '#f6e4cb' }}>
              {activeMovieFilter === ALL_MOVIES_FILTER
                ? 'No memories yet. Add your first one after your next shared watch.'
                : 'No memories match this movie yet.'}
            </p>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: spacing.md,
            }}
          >
            {visibleMemories.map((memory) => {
              const noteTheme = getStickyNoteTheme(memory);
              const noteRotation = getStickyNoteRotation(memory);

              return (
                <div
                  key={memory.id}
                  style={{
                    position: 'relative',
                    border: `1px solid ${noteTheme.border}`,
                    borderRadius: radius.sm,
                    padding: `${spacing.md} ${spacing.sm} ${spacing.sm}`,
                    background: noteTheme.background,
                    boxShadow: '0 10px 15px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.45)',
                    minHeight: isMobile ? 'auto' : '190px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing.xs,
                    transform: isMobile ? 'none' : `rotate(${noteRotation}deg)`,
                    transformOrigin: 'top center',
                  }}
                >
                  <div
                    aria-hidden
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '16px',
                      height: '16px',
                      borderRadius: radius.full,
                      background: noteTheme.pin,
                      border: '1px solid rgba(0,0,0,0.22)',
                      boxShadow: '0 3px 5px rgba(0,0,0,0.35)',
                    }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: spacing.sm,
                      flexWrap: 'wrap',
                    }}
                  >
                    <strong style={{ color: noteTheme.heading, fontSize: typography.fontSize.sm }}>
                      {memory.movieTitle}
                    </strong>
                    <span style={{ color: noteTheme.meta, fontSize: typography.fontSize.xs }}>
                      {formatMemoryTimestamp(memory.createdAt)}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: `${spacing.xs} 0`,
                      color: noteTheme.text,
                      fontSize: typography.fontSize.sm,
                      lineHeight: typography.lineHeight.normal,
                      whiteSpace: 'pre-wrap',
                      flex: 1,
                    }}
                  >
                    {memory.note}
                  </p>
                  <span
                    style={{
                      color: noteTheme.signature,
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.semibold,
                    }}
                  >
                    - {memory.author}
                  </span>
                </div>
              );
            })}
          </div>

          {sortedMemories.length > visibleCount && (
            <div style={{ marginTop: spacing.sm, display: 'flex', justifyContent: 'center' }}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setVisibleCount((prev) => prev + VISIBLE_COUNT_STEP)}
                style={{
                  border: `1px solid ${colors.borderSecondary}40`,
                  color: colors.textPrimary,
                }}
              >
                Show More
              </Button>
            </div>
          )}

          {sortedMemories.length <= visibleCount && visibleCount > INITIAL_VISIBLE_COUNT && (
            <div style={{ marginTop: spacing.sm, display: 'flex', justifyContent: 'center' }}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setVisibleCount(INITIAL_VISIBLE_COUNT)}
                style={{
                  border: `1px solid ${colors.borderSecondary}40`,
                  color: colors.textPrimary,
                }}
              >
                Show Less
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default MemoryWall;
