import React from 'react';
import { Movie, User } from '@/types';
import Input from '@/ui/Input';
import Button from '@/ui/Button';
import Textarea from '@/ui/Textarea';
import { colors, radius, spacing, typography } from '@/design-system';
import { canCreateMemory } from './memoryUtils';

interface MemoryComposerProps {
  watchedMovieOptions: Movie[];
  selectedMovieId: string;
  onSelectedMovieIdChange: (movieId: string) => void;
  currentUser: User | null;
  note: string;
  onNoteChange: (note: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  canSubmit: boolean;
  remainingChars: number;
  error: string | null;
  successMessage: string | null;
  isMobile: boolean;
  isComposerOpen: boolean;
  onComposerToggle: () => void;
  noteInputRef: React.RefObject<HTMLTextAreaElement | null>;
}

const MemoryComposer: React.FC<MemoryComposerProps> = ({
  watchedMovieOptions,
  selectedMovieId,
  onSelectedMovieIdChange,
  currentUser,
  note,
  onNoteChange,
  onSubmit,
  isSubmitting,
  canSubmit,
  remainingChars,
  error,
  successMessage,
  isMobile,
  isComposerOpen,
  onComposerToggle,
  noteInputRef,
}) => {
  const creationLocked = !canCreateMemory(currentUser);

  return (
    <>
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
          onClick={onComposerToggle}
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

      {creationLocked && (
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
          Pick Aaron or Electra to add memories. Guests can still browse everything below.
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
            onSubmit={onSubmit}
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
                  onChange={(e) => onSelectedMovieIdChange(e.target.value)}
                  disabled={watchedMovieOptions.length === 0 || isSubmitting}
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
                  {watchedMovieOptions.length === 0 ? (
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
                value={currentUser || 'Guest'}
                onChange={() => {}}
                disabled
                style={{ height: '44px' }}
              />
            </div>

            <Textarea
              ref={noteInputRef}
              label="Memory"
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="What made this movie night special?"
              disabled={isSubmitting || watchedMovieOptions.length === 0 || creationLocked}
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
                  Tip: press Ctrl/Cmd + Enter to save. Mentions: @Aaron or @Electra.
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
    </>
  );
};

export default MemoryComposer;
