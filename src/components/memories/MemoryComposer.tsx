import React from 'react';
import { Movie, User } from '@/types';
import { Textarea } from '@/ui/FormFields';
import Button from '@/ui/Button';
import { radius, spacing, typography } from '@/design-system';
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
  const selectedMovie =
    watchedMovieOptions.find((movie) => movie.id === selectedMovieId) ?? watchedMovieOptions[0] ?? null;
  const isSingleMovieContext = watchedMovieOptions.length <= 1 && Boolean(selectedMovie);
  const showComposerToggle = !isSingleMovieContext || !isComposerOpen;
  const authorLabel = currentUser || 'Guest';
  const authorBadgeStyles =
    currentUser === 'Aaron'
      ? {
          color: '#17356d',
          background:
            'linear-gradient(135deg, rgba(170, 220, 255, 0.98) 0%, rgba(118, 196, 255, 0.98) 100%)',
          border: '1px solid rgba(83, 152, 214, 0.5)',
        }
      : currentUser === 'Electra'
        ? {
            color: '#6b173a',
            background:
              'linear-gradient(135deg, rgba(255, 205, 229, 0.98) 0%, rgba(255, 165, 208, 0.98) 100%)',
            border: '1px solid rgba(216, 107, 158, 0.5)',
          }
        : {
            color: '#51433a',
            background:
              'linear-gradient(135deg, rgba(255, 240, 214, 0.98) 0%, rgba(243, 219, 182, 0.98) 100%)',
            border: '1px solid rgba(179, 145, 100, 0.45)',
          };

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
              color: '#fff2e8',
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              fontFamily: typography.fontFamily.heading.join(', '),
              letterSpacing: typography.letterSpacing.normal,
            }}
          >
            Movie notes
          </h3>
        </div>

        {showComposerToggle && (
          <Button
            type="button"
            variant={isComposerOpen ? 'ghost' : 'primary'}
            size="sm"
            onClick={onComposerToggle}
            style={{
              border: '1px solid rgba(255, 214, 233, 0.45)',
              minHeight: '38px',
              color: isComposerOpen ? '#fff3f8' : '#241321',
              background: isComposerOpen
                ? 'rgba(82, 34, 57, 0.36)'
                : 'linear-gradient(135deg, #ffd3e5 0%, #ffb3d4 100%)',
              boxShadow: isComposerOpen ? 'none' : '0 10px 22px rgba(255, 127, 198, 0.22)',
            }}
          >
            {isComposerOpen ? 'Hide note' : 'Add note'}
          </Button>
        )}
      </div>

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
              top: isMobile ? '-8px' : '-12px',
              left: isMobile ? '14px' : '22px',
              width: isMobile ? '34px' : '42px',
              height: isMobile ? '34px' : '42px',
              background:
                'radial-gradient(circle at 35% 35%, rgba(255, 244, 187, 0.98) 0%, rgba(255, 206, 121, 0.95) 72%, rgba(235, 156, 84, 0.92) 100%)',
              border: '1px solid rgba(255, 241, 206, 0.5)',
              borderRadius: radius.full,
              boxShadow: '0 10px 18px rgba(0,0,0,0.24)',
              pointerEvents: 'none',
            }}
          />
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: isMobile ? '18px' : '12px',
              right: isMobile ? '16px' : '24px',
              width: isMobile ? '16px' : '18px',
              height: isMobile ? '16px' : '18px',
              background: 'rgba(255, 214, 170, 0.78)',
              borderRadius: radius.full,
              boxShadow: '0 0 0 6px rgba(255, 214, 170, 0.12)',
              pointerEvents: 'none',
            }}
          />
          <form
            onSubmit={onSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.md,
              marginBottom: 0,
              padding: isMobile ? spacing.sm : spacing.md,
              border: '1px solid rgba(255, 217, 234, 0.34)',
              borderRadius: '24px',
              background:
                'linear-gradient(160deg, rgba(49, 28, 50, 0.94) 0%, rgba(21, 24, 43, 0.95) 50%, rgba(19, 36, 56, 0.96) 100%)',
              boxShadow: '0 16px 30px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.25fr) minmax(180px, 0.75fr)',
                gap: spacing.sm,
              }}
            >
              {isSingleMovieContext && selectedMovie ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing.xs,
                  }}
                >
                  <span
                    style={{
                      ...typography.presets.eyebrow,
                      color: '#ffc9df',
                    }}
                  >
                    For movie
                  </span>
                  <div
                    style={{
                      minHeight: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.sm,
                      flexWrap: 'wrap',
                      padding: `${spacing.sm} ${spacing.md}`,
                      borderRadius: '18px',
                      background: 'rgba(255, 255, 255, 0.09)',
                      border: '1px solid rgba(255, 220, 236, 0.22)',
                      color: '#fff4fa',
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        fontSize: typography.fontSize.lg,
                        lineHeight: 1,
                      }}
                    >
                      {'"'}
                    </span>
                    <strong
                      style={{
                        fontSize: typography.fontSize.base,
                        fontWeight: typography.fontWeight.semibold,
                      }}
                    >
                      {selectedMovie.title}
                    </strong>
                    {selectedMovie.year ? (
                      <span style={{ color: '#ffc9df', fontSize: typography.fontSize.xs }}>
                        {selectedMovie.year}
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : (
                <label style={{ color: '#ffc9df', fontSize: typography.fontSize.xs }}>
                  Movie
                  <select
                    value={selectedMovieId}
                    onChange={(e) => onSelectedMovieIdChange(e.target.value)}
                    disabled={watchedMovieOptions.length === 0 || isSubmitting}
                    style={{
                      marginTop: spacing.xs,
                      width: '100%',
                      height: '48px',
                      borderRadius: '18px',
                      border: '1px solid rgba(255, 220, 236, 0.22)',
                      background: 'rgba(255, 255, 255, 0.09)',
                      color: '#f8fafc',
                      padding: `0 ${spacing.sm}`,
                      fontFamily: typography.fontFamily.body.join(', '),
                    }}
                  >
                    {watchedMovieOptions.length === 0 ? (
                      <option value="">No watched titles</option>
                    ) : (
                      watchedMovieOptions.map((movie) => (
                        <option key={movie.id} value={movie.id}>
                          {movie.title}
                        </option>
                      ))
                    )}
                  </select>
                </label>
              )}

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing.xs,
                }}
              >
                <span
                  style={{
                    ...typography.presets.eyebrow,
                    color: '#bde4ff',
                  }}
                >
                  From
                </span>
                <div
                  style={{
                    minHeight: '48px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: spacing.xs,
                    padding: `${spacing.sm} ${spacing.md}`,
                    borderRadius: '18px',
                    width: isMobile ? '100%' : 'fit-content',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28)',
                    ...authorBadgeStyles,
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      fontSize: typography.fontSize.base,
                      lineHeight: 1,
                    }}
                  >
                    o
                  </span>
                  <strong
                    style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.semibold,
                      letterSpacing: typography.letterSpacing.normal,
                    }}
                  >
                    {authorLabel}
                  </strong>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: isMobile ? spacing.sm : spacing.md,
                borderRadius: isMobile ? '22px' : '26px',
                background:
                  'linear-gradient(145deg, rgba(255, 241, 247, 0.96) 0%, rgba(255, 236, 223, 0.95) 100%)',
                border: '1px solid rgba(255, 219, 188, 0.88)',
                boxShadow: '0 12px 22px rgba(16, 24, 40, 0.14)',
              }}
            >
              <Textarea
                ref={noteInputRef}
                label="Note"
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="Note"
                disabled={isSubmitting || watchedMovieOptions.length === 0 || creationLocked}
                style={{
                  minHeight: isMobile ? '104px' : '126px',
                  backgroundColor: 'transparent',
                  color: '#42263e',
                  border: 'none',
                  boxShadow: 'none',
                  padding: 0,
                  fontSize: typography.fontSize.base,
                }}
              />
            </div>

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
                    color: remainingChars <= 30 ? '#ffd36b' : '#dfe6ff',
                    fontSize: typography.fontSize.xs,
                    fontWeight:
                      remainingChars <= 30
                        ? typography.fontWeight.bold
                        : typography.fontWeight.normal,
                  }}
                >
                  {remainingChars} chars left
                </span>
              </div>
              <Button
                type="submit"
                variant="primary"
                disabled={!canSubmit}
                isLoading={isSubmitting}
                style={{
                  minHeight: '44px',
                  minWidth: isMobile ? '100%' : '174px',
                  color: '#2a1732',
                  background: 'linear-gradient(135deg, #ffe39a 0%, #ffbf8b 100%)',
                  boxShadow: '0 12px 22px rgba(255, 175, 120, 0.2)',
                }}
              >
                Add note
              </Button>
            </div>

            {error && (
              <div
                style={{
                  color: '#ffd4d4',
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.bold,
                  padding: `${spacing.xs} ${spacing.sm}`,
                  borderRadius: radius.md,
                  background: 'rgba(248, 113, 113, 0.14)',
                  border: '1px solid rgba(248, 113, 113, 0.3)',
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
                  color: '#d5ffe2',
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.bold,
                  padding: `${spacing.xs} ${spacing.sm}`,
                  borderRadius: radius.md,
                  background: 'rgba(74, 222, 128, 0.12)',
                  border: '1px solid rgba(74, 222, 128, 0.28)',
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
