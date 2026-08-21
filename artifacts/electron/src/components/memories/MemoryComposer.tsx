import React from 'react';
import { Movie, User } from '@/shared/types';
import { Textarea } from '@/ui/FormFields';
import Button from '@/ui/Button';
import { radius, spacing, typography } from '@/theme/tokens';
import { canCreateMemory } from './lib/memoryUtils';

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
    watchedMovieOptions.find((movie) => movie.id === selectedMovieId) ??
    watchedMovieOptions[0] ??
    null;
  const isSingleMovieContext =
    watchedMovieOptions.length <= 1 && Boolean(selectedMovie);
  const showComposerToggle = !isSingleMovieContext || !isComposerOpen;

  const authorLabel = currentUser || "Guest";
  const authorInitial = authorLabel.charAt(0).toUpperCase();

  const authorAvatarStyles =
    currentUser === "Aaron"
      ? {
          color: "#fff",
          background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
          boxShadow: "0 2px 8px rgba(59, 130, 246, 0.45)",
        }
      : currentUser === "Electra"
        ? {
            color: "#fff",
            background: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
            boxShadow: "0 2px 8px rgba(236, 72, 153, 0.45)",
          }
        : {
            color: "#fff",
            background: "linear-gradient(135deg, #b45309 0%, #92400e 100%)",
            boxShadow: "0 2px 8px rgba(180, 83, 9, 0.35)",
          };

  React.useEffect(() => {
    if (isComposerOpen && noteInputRef.current) {
      const timer = setTimeout(() => {
        noteInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isComposerOpen, noteInputRef]);

  return (
    <>
      {showComposerToggle && (
        <div
          style={{
            marginBottom: spacing.md,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "flex-end",
            gap: spacing.sm,
          }}
        >
          <Button
            type="button"
            variant={isComposerOpen ? "ghost" : "primary"}
            size="sm"
            onClick={onComposerToggle}
            style={{
              border: "1px solid rgba(255, 214, 233, 0.45)",
              minHeight: "38px",
              color: isComposerOpen ? "#fff3f8" : "#241321",
              background: isComposerOpen
                ? "rgba(82, 34, 57, 0.36)"
                : "linear-gradient(135deg, #ffd3e5 0%, #ffb3d4 100%)",
              boxShadow: isComposerOpen
                ? "none"
                : "0 10px 22px rgba(255, 127, 198, 0.22)",
            }}
          >
            {isComposerOpen ? "Hide note" : "Add note"}
          </Button>
        </div>
      )}

      {isComposerOpen && (
        <div
          style={{
            marginBottom: spacing.md,
            position: "relative",
          }}
        >
          <form
            onSubmit={onSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: spacing.sm,
              marginBottom: 0,
              padding: isMobile ? spacing.sm : spacing.md,
              border: "1px solid rgba(255, 217, 234, 0.34)",
              borderRadius: "24px",
              background:
                "linear-gradient(160deg, rgba(49, 28, 50, 0.94) 0%, rgba(21, 24, 43, 0.95) 50%, rgba(19, 36, 56, 0.96) 100%)",
              boxShadow:
                "0 16px 30px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            {!isSingleMovieContext && (
              <label
                style={{ color: "#ffc9df", fontSize: typography.fontSize.xs }}
              >
                Movie
                <select
                  value={selectedMovieId}
                  onChange={(e) => onSelectedMovieIdChange(e.target.value)}
                  disabled={watchedMovieOptions.length === 0 || isSubmitting}
                  style={{
                    marginTop: spacing.xs,
                    width: "100%",
                    height: "48px",
                    borderRadius: "18px",
                    border: "1px solid rgba(255, 220, 236, 0.22)",
                    background: "rgba(255, 255, 255, 0.09)",
                    color: "#f8fafc",
                    padding: `0 ${spacing.sm}`,
                    fontFamily: typography.fontFamily.body.join(", "),
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
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: spacing.sm,
                marginBottom: "2px",
              }}
            >
              <div
                aria-hidden
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: radius.full,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.bold,
                  letterSpacing: "0.02em",
                  ...authorAvatarStyles,
                }}
              >
                {authorInitial}
              </div>
              <span
                style={{
                  color: "#bde4ff",
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.semibold,
                  letterSpacing: typography.letterSpacing.normal,
                }}
              >
                {authorLabel}
              </span>
            </div>

            <div style={{ position: "relative" }}>
              <Textarea
                ref={noteInputRef}
                label="Note"
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="What did you think? A quote, a reaction, a tiny moment..."
                disabled={
                  isSubmitting ||
                  watchedMovieOptions.length === 0 ||
                  creationLocked
                }
                style={{
                  minHeight: isMobile ? "104px" : "126px",
                  backgroundColor: "rgba(255,255,255,0.07)",
                  color: "#f0e8ff",
                  border: "1px solid rgba(255, 220, 236, 0.2)",
                  borderRadius: "16px",
                  fontSize: typography.fontSize.base,
                  paddingBottom: "28px",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  bottom: "10px",
                  right: "14px",
                  color:
                    remainingChars <= 30
                      ? "#ffd36b"
                      : "rgba(180, 180, 220, 0.55)",
                  fontSize: "11px",
                  fontWeight:
                    remainingChars <= 30
                      ? typography.fontWeight.bold
                      : typography.fontWeight.normal,
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              >
                {remainingChars}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: spacing.sm,
              }}
            >
              {error && (
                <span
                  style={{
                    color: "#ffd4d4",
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.bold,
                    flex: 1,
                  }}
                  role="status"
                  aria-live="polite"
                >
                  {error}
                </span>
              )}
              <Button
                type="submit"
                variant="primary"
                disabled={!canSubmit}
                isLoading={isSubmitting}
                style={{
                  minHeight: "44px",
                  minWidth: isMobile ? "100%" : "140px",
                  color: "#2a1732",
                  background: successMessage
                    ? "linear-gradient(135deg, #86efac 0%, #22c55e 100%)"
                    : "linear-gradient(135deg, #ffe39a 0%, #ffbf8b 100%)",
                  boxShadow: successMessage
                    ? "0 12px 22px rgba(34, 197, 94, 0.2)"
                    : "0 12px 22px rgba(255, 175, 120, 0.2)",
                  transition: "background 0.3s ease, box-shadow 0.3s ease",
                }}
              >
                {successMessage ? (
                  isMobile ? (
                    <span aria-label="Saved">✓</span>
                  ) : (
                    "✓ Saved"
                  )
                ) : isMobile ? (
                  <span aria-label="Save note">✓</span>
                ) : (
                  "Save note"
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default MemoryComposer;
