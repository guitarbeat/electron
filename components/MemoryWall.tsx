import React, { useEffect, useMemo, useState } from 'react';
import { Movie, User } from '../types';
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

const MemoryWall: React.FC<MemoryWallProps> = ({ watchedMovies, currentUser }) => {
  const { memories, addMemory, isLoading } = useMemories();
  const isMobile = useMediaQuery(breakpoints.sm);
  const [selectedMovieId, setSelectedMovieId] = useState<string>('');
  const [author, setAuthor] = useState(currentUser || '');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setAuthor(currentUser);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!selectedMovieId && watchedMovies.length > 0) {
      setSelectedMovieId(watchedMovies[0].id);
    }
  }, [selectedMovieId, watchedMovies]);

  const selectedMovie = useMemo(
    () => watchedMovies.find((movie) => movie.id === selectedMovieId),
    [watchedMovies, selectedMovieId]
  );

  const visibleMemories = useMemo(() => memories.slice(0, 12), [memories]);

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } catch (err: any) {
      setError(err.message || 'Failed to save memory');
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
        border: `1px solid ${colors.accentMuted}`,
        background: 'linear-gradient(135deg, rgba(30, 42, 75, 0.92) 0%, rgba(20, 28, 52, 0.95) 100%)',
      }}
    >
      <div style={{ marginBottom: spacing.md }}>
        <h3
          style={{
            margin: 0,
            color: colors.textPrimary,
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.bold,
          }}
        >
          Shared Memory Wall
        </h3>
        <p
          style={{
            margin: `${spacing.xs} 0 0`,
            color: colors.textSecondary,
            fontSize: typography.fontSize.sm,
          }}
        >
          Save little moments from movies you both watched.
        </p>
      </div>

      <form onSubmit={handleAddMemory} style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
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
              onChange={(e) => setSelectedMovieId(e.target.value)}
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
                watchedMovies.map((movie) => (
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
            onChange={(e) => setAuthor(e.target.value.slice(0, MAX_AUTHOR_LENGTH))}
            placeholder="Your name"
            disabled={isSubmitting}
            style={{ height: '44px' }}
          />
        </div>

        <Textarea
          label="Memory"
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, MAX_NOTE_LENGTH))}
          placeholder="What made this movie night special?"
          disabled={isSubmitting || watchedMovies.length === 0}
          style={{ textAlign: 'left', minHeight: isMobile ? '90px' : '110px' }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: colors.textTertiary, fontSize: typography.fontSize.xs }}>
            {MAX_NOTE_LENGTH - note.length} chars left
          </span>
          <Button
            type="submit"
            variant="secondary"
            disabled={watchedMovies.length === 0 || isSubmitting || !note.trim() || !author.trim()}
            isLoading={isSubmitting}
            style={{ minHeight: '44px' }}
          >
            Save Memory
          </Button>
        </div>

        {error && (
          <div style={{ color: colors.error, fontSize: typography.fontSize.xs, fontWeight: 600 }}>
            {error}
          </div>
        )}
      </form>

      <div style={{ marginTop: spacing.lg }}>
        <h4
          style={{
            margin: 0,
            marginBottom: spacing.sm,
            color: colors.accentLight,
            fontSize: typography.fontSize.base,
          }}
        >
          Latest Memories
        </h4>

        {isLoading && memories.length === 0 && (
          <p style={{ margin: 0, color: colors.textSecondary }}>Loading memories...</p>
        )}

        {!isLoading && visibleMemories.length === 0 && (
          <p style={{ margin: 0, color: colors.textSecondary }}>
            No memories yet. Add your first one after your next shared watch.
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          {visibleMemories.map((memory) => (
            <div
              key={memory.id}
              style={{
                border: `1px solid ${colors.borderSecondary}25`,
                borderRadius: radius.md,
                padding: spacing.sm,
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: spacing.sm,
                  flexWrap: 'wrap',
                }}
              >
                <strong style={{ color: colors.textPrimary }}>{memory.movieTitle}</strong>
                <span style={{ color: colors.textTertiary, fontSize: typography.fontSize.xs }}>
                  {new Date(memory.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p
                style={{
                  margin: `${spacing.xs} 0`,
                  color: colors.textSecondary,
                  fontSize: typography.fontSize.sm,
                  lineHeight: typography.lineHeight.normal,
                }}
              >
                {memory.note}
              </p>
              <span style={{ color: colors.accentLight, fontSize: typography.fontSize.xs }}>
                — {memory.author}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default MemoryWall;
