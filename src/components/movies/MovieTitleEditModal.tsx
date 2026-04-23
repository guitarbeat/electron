import React from 'react';
import type { Movie } from '@/shared/types';
import { colors, spacing, typography } from '@/theme/tokens';
import Button from '@/ui/Button';
import { Input } from '@/ui/FormFields';
import { Modal } from '@/ui/ModalSystem';
import { MAX_MOVIE_TITLE_LENGTH, sanitizeInput } from '@/utils';

interface MovieTitleEditModalProps {
  movie: Movie;
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
  onSubmit: (title: string) => Promise<void>;
  onDelete?: () => void;
}

const MovieTitleEditModal: React.FC<MovieTitleEditModalProps> = ({
  movie,
  isOpen,
  isMobile,
  onClose,
  onSubmit,
  onDelete,
}) => {
  const [draftTitle, setDraftTitle] = React.useState(movie.title);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraftTitle(movie.title);
    setError(null);

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 40);

    return () => window.clearTimeout(focusTimer);
  }, [isOpen, movie.title]);

  const cleanTitle = sanitizeInput(draftTitle);
  const isUnchanged = cleanTitle === movie.title;
  const canSubmit =
    !isSaving &&
    Boolean(cleanTitle) &&
    cleanTitle.length <= MAX_MOVIE_TITLE_LENGTH &&
    !isUnchanged;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSubmit(cleanTitle);
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to update title');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Movie Title"
      ariaLabel={`Edit title for ${movie.title}`}
      closeDisabled={isSaving}
      closeDisabledLabel="Saving title"
      variant={isMobile ? 'bottom-sheet' : 'centered'}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.lg,
          padding: spacing.lg,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          <p
            style={{
              margin: 0,
              color: colors.textSecondary,
              ...typography.presets.bodySm,
            }}
          >
            Update the shared movie title. Poster details will refresh automatically in the
            background.
          </p>

          <Input
            ref={inputRef}
            label="Movie title"
            value={draftTitle}
            onChange={(event) => {
              setDraftTitle(event.target.value);
              if (error) {
                setError(null);
              }
            }}
            maxLength={MAX_MOVIE_TITLE_LENGTH}
            placeholder="Enter movie title"
            error={error ?? undefined}
          />

          <div
            aria-live="polite"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: spacing.sm,
              color: colors.textTertiary,
              ...typography.presets.caption,
            }}
          >
            <span>{isUnchanged ? 'Make a change to save the new title.' : 'Title changes are shared immediately.'}</span>
            <span>{draftTitle.length}/{MAX_MOVIE_TITLE_LENGTH}</span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: spacing.sm,
          }}
        >
          {onDelete ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => { onDelete(); onClose(); }}
              disabled={isSaving}
              style={{ color: colors.error ?? '#c0392b' }}
            >
              Remove
            </Button>
          ) : <span />}

          <div style={{ display: 'flex', gap: spacing.sm }}>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} loadingText="Saving..." disabled={!canSubmit}>
              Save title
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default MovieTitleEditModal;
