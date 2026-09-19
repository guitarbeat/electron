



import React from "react";
import type {
  Movie,
} from "@/shared/types";


import {
  Modal,
  Input,
  Button,
} from "@/components/ui";


import { colors, spacing, typography } from "@/theme/tokens";
import {
  MAX_MOVIE_TITLE_LENGTH,
  sanitizeInput,
} from "@/utils";
import { fetchWikipediaPosterOrSummary } from "@/services/metadata";








interface MovieEditModalProps {
  movie: Movie;
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
  onSubmit: (updates: {
    title: string;
    customPosterUrl?: string;
  }) => Promise<void>;
  onDelete?: () => void;
}

export const MovieEditModal: React.FC<MovieEditModalProps> = ({
  movie,
  isOpen,
  isMobile,
  onClose,
  onSubmit,
  onDelete,
}) => {
  const [draftTitle, setDraftTitle] = React.useState(movie.title);
  const [draftPosterUrl, setDraftPosterUrl] = React.useState(
    movie.customPosterUrl || "",
  );
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isFindingPoster, setIsFindingPoster] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleAutoFindPoster = async () => {
    if (!draftTitle.trim() || isFindingPoster) return;
    setIsFindingPoster(true);
    setError(null);
    try {
      const result = await fetchWikipediaPosterOrSummary(
        draftTitle.trim(),
        movie.year,
      );
      if (result?.posterUrl) {
        setDraftPosterUrl(result.posterUrl);
      } else {
        setError("No poster found on Wikipedia for this title");
      }
    } catch {
      setError("Failed to fetch poster");
    } finally {
      setIsFindingPoster(false);
    }
  };

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraftTitle(movie.title);
    setDraftPosterUrl(movie.customPosterUrl || "");
    setError(null);

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 40);

    return () => window.clearTimeout(focusTimer);
  }, [isOpen, movie.title, movie.customPosterUrl]);

  const cleanTitle = sanitizeInput(draftTitle);
  const cleanPosterUrl = draftPosterUrl.trim();
  const isUnchanged =
    cleanTitle === movie.title &&
    cleanPosterUrl === (movie.customPosterUrl || "");

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
      await onSubmit({
        title: cleanTitle,
        customPosterUrl: cleanPosterUrl || undefined,
      });
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to update movie",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Movie"
      ariaLabel={`Edit details for ${movie.title}`}
      closeDisabled={isSaving}
      closeDisabledLabel="Saving changes"
      variant={isMobile ? "bottom-sheet" : "centered"}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: spacing.lg,
          padding: `clamp(${spacing.md}, 4vw, ${spacing.lg})`,
          paddingBottom: `calc(clamp(${spacing.md}, 4vw, ${spacing.lg}) + env(safe-area-inset-bottom))`,
        }}
      >
        <div
          style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}
        >
          <p
            style={{
              margin: 0,
              color: colors.textSecondary,
              ...typography.presets.bodySm,
            }}
          >
            Update the shared movie title or provide a custom poster image URL.
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

          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: spacing.xs,
              }}
            >
              <label
                htmlFor="movie-custom-poster-input"
                style={{
                  color: colors.textSecondary,
                  ...typography.presets.bodySm,
                  fontWeight: 600,
                }}
              >
                Poster URL (optional)
              </label>
              <button
                type="button"
                onClick={handleAutoFindPoster}
                disabled={isFindingPoster || !draftTitle.trim()}
                style={{
                  background: "none",
                  border: "none",
                  padding: "0.125rem 0.375rem",
                  color: colors.interactive,
                  ...typography.presets.caption,
                  cursor: isFindingPoster || !draftTitle.trim() ? "not-allowed" : "pointer",
                  opacity: isFindingPoster || !draftTitle.trim() ? 0.5 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: spacing.xs,
                  fontWeight: 600,
                }}
              >
                {isFindingPoster ? "Searching..." : "🔍 Auto-find poster"}
              </button>
            </div>
            <Input
              id="movie-custom-poster-input"
              value={draftPosterUrl}
              onChange={(event) => {
                setDraftPosterUrl(event.target.value);
                if (error) {
                  setError(null);
                }
              }}
              placeholder="https://example.com/poster.jpg"
            />
          </div>

          <div
            aria-live="polite"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: spacing.sm,
              color: colors.textTertiary,
              ...typography.presets.caption,
            }}
          >
            <span>
              {isUnchanged
                ? "Make a change to save."
                : "Changes are shared immediately."}
            </span>
            <span>
              {draftTitle.length}/{MAX_MOVIE_TITLE_LENGTH}
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: spacing.sm,
          }}
        >
          {onDelete ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onDelete();
                onClose();
              }}
              disabled={isSaving}
              style={{ color: colors.error ?? "#c0392b" }}
            >
              Remove
            </Button>
          ) : (
            <span />
          )}

          <div style={{ display: "flex", gap: spacing.sm }}>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSaving}
              loadingText="Saving..."
              disabled={!canSubmit}
            >
              Save changes
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

