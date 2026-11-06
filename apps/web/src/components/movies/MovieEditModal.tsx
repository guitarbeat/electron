import React from "react";
import type { Movie } from "@/shared/types";
import { Modal, Input, Button } from "@/components/ui";
import { colors, spacing, typography, radius, shadows } from "@/theme/tokens";
import { MAX_MOVIE_TITLE_LENGTH, sanitizeInput } from "@/utils";
import { fetchWikipediaPosterOrSummary } from "@/services/metadata";
import { isTvSeriesItem } from "./movieWallFilterUtils";
import { FilmIcon, TvIcon, Spinner, CheckIcon, SparklesIcon } from "@/common/Icons";

interface MovieEditModalProps {
  movie: Movie;
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
  onSubmit: (updates: {
    title: string;
    customPosterUrl?: string;
    mediaType?: "movie" | "series";
    category?: string;
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
  const initialFormat = isTvSeriesItem(movie) ? "series" : "movie";
  const [draftTitle, setDraftTitle] = React.useState(movie.title);
  const [draftPosterUrl, setDraftPosterUrl] = React.useState(
    movie.customPosterUrl || "",
  );
  const [draftFormat, setDraftFormat] = React.useState<"movie" | "series">(initialFormat);
  const [error, setError] = React.useState<string | null>(null);
  const [posterFoundMessage, setPosterFoundMessage] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isFindingPoster, setIsFindingPoster] = React.useState(false);
  const [imageLoadError, setImageLoadError] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const activePosterUrl = draftPosterUrl.trim() || movie.customPosterUrl || movie.posterUrl || "";

  React.useEffect(() => {
    setImageLoadError(false);
  }, [activePosterUrl]);

  const handleAutoFindPoster = async () => {
    if (!draftTitle.trim() || isFindingPoster) return;
    setIsFindingPoster(true);
    setError(null);
    setPosterFoundMessage(null);
    try {
      const result = await fetchWikipediaPosterOrSummary(
        draftTitle.trim(),
        movie.year,
      );
      if (result?.posterUrl) {
        setDraftPosterUrl(result.posterUrl);
        setImageLoadError(false);
        setPosterFoundMessage("Official poster found from Wikipedia!");
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

    const currentFormat = isTvSeriesItem(movie) ? "series" : "movie";
    setDraftTitle(movie.title);
    setDraftPosterUrl(movie.customPosterUrl || "");
    setDraftFormat(currentFormat);
    setError(null);
    setPosterFoundMessage(null);
    setImageLoadError(false);

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);

    return () => window.clearTimeout(focusTimer);
  }, [isOpen, movie]);

  const cleanTitle = sanitizeInput(draftTitle);
  const cleanPosterUrl = draftPosterUrl.trim();
  const currentFormat = isTvSeriesItem(movie) ? "series" : "movie";
  const isUnchanged =
    cleanTitle === movie.title &&
    cleanPosterUrl === (movie.customPosterUrl || "") &&
    draftFormat === currentFormat;

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
        mediaType: draftFormat,
        category:
          draftFormat === "series"
            ? (movie.category && movie.category.toLowerCase().includes("series")
                ? movie.category
                : "TV Series")
            : undefined,
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
      dialogEyebrow="FILM & SHOW ENTRY"
      title="Edit Details"
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
          padding: `clamp(${spacing.md}, 3vw, ${spacing.xl})`,
          paddingBottom: `calc(clamp(${spacing.md}, 3vw, ${spacing.xl}) + env(safe-area-inset-bottom))`,
          maxWidth: 640,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Subtitle & Entry Meta Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: spacing.xs,
            padding: "0.5rem 0.875rem",
            borderRadius: radius.md,
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <span
            style={{
              color: colors.textSecondary,
              ...typography.presets.bodySm,
              fontSize: "0.8rem",
            }}
          >
            Update movie or series metadata, poster artwork, and format classification.
          </span>
          {movie.year ? (
            <span
              style={{
                fontSize: "0.75rem",
                color: colors.textTertiary,
                background: "rgba(255, 255, 255, 0.06)",
                padding: "0.15rem 0.45rem",
                borderRadius: radius.sm,
                fontWeight: 600,
              }}
            >
              {movie.year}
            </span>
          ) : null}
        </div>

        {/* Responsive 2-Column Section */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "152px 1fr",
            gap: spacing.lg,
            alignItems: "start",
          }}
        >
          {/* Left Column: Live Poster Preview Card */}
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "row" : "column",
              alignItems: isMobile ? "center" : "stretch",
              gap: spacing.sm,
            }}
          >
            <div
              style={{
                position: "relative",
                width: isMobile ? 110 : 152,
                height: isMobile ? 165 : 228,
                borderRadius: radius.lg,
                overflow: "hidden",
                background: "linear-gradient(180deg, rgba(30, 20, 45, 0.8) 0%, rgba(15, 10, 22, 0.95) 100%)",
                border: "1px solid rgba(255, 255, 255, 0.16)",
                boxShadow: "0 14px 28px -6px rgba(0, 0, 0, 0.6), 0 0 16px rgba(180, 100, 255, 0.12)",
                flexShrink: 0,
              }}
            >
              {activePosterUrl && !imageLoadError ? (
                <>
                  <img
                    src={activePosterUrl}
                    alt={draftTitle || movie.title}
                    onError={() => setImageLoadError(true)}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  {/* Subtle top/bottom sheen */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 40%, rgba(0,0,0,0.65) 100%)",
                      pointerEvents: "none",
                    }}
                  />
                </>
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: spacing.sm,
                    textAlign: "center",
                    gap: spacing.xs,
                    color: colors.textTertiary,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: radius.full,
                      background: "rgba(255, 255, 255, 0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: colors.accent,
                    }}
                  >
                    {draftFormat === "series" ? <TvIcon size={22} /> : <FilmIcon size={22} />}
                  </div>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      color: colors.textSecondary,
                    }}
                  >
                    {imageLoadError ? "Image failed" : "No poster"}
                  </span>
                </div>
              )}

              {/* Format Badge Overlay (Top Left) */}
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "0.2rem 0.5rem",
                  borderRadius: radius.full,
                  background: "rgba(15, 10, 25, 0.85)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#ffffff",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {draftFormat === "series" ? (
                  <>
                    <TvIcon size={12} style={{ color: "#38bdf8" }} />
                    <span>Show</span>
                  </>
                ) : (
                  <>
                    <FilmIcon size={12} style={{ color: "#ec4899" }} />
                    <span>Film</span>
                  </>
                )}
              </div>

              {/* Custom Poster Indicator (Bottom) */}
              {draftPosterUrl.trim() && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 8,
                    left: 8,
                    right: 8,
                    textAlign: "center",
                    padding: "0.15rem 0.35rem",
                    borderRadius: radius.sm,
                    background: "rgba(34, 197, 94, 0.85)",
                    backdropFilter: "blur(6px)",
                    WebkitBackdropFilter: "blur(6px)",
                    color: "#ffffff",
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    boxShadow: "0 2px 8px rgba(34, 197, 94, 0.4)",
                  }}
                >
                  Custom Art
                </div>
              )}
            </div>

            {/* Poster Quick Action (Clear / Reset) */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                width: isMobile ? "auto" : "100%",
              }}
            >
              {draftPosterUrl.trim() ? (
                <button
                  type="button"
                  onClick={() => {
                    setDraftPosterUrl("");
                    setImageLoadError(false);
                    setPosterFoundMessage(null);
                  }}
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: radius.md,
                    padding: "0.3rem 0.5rem",
                    color: colors.textSecondary,
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#ffffff";
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = colors.textSecondary;
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  }}
                >
                  Clear custom URL
                </button>
              ) : movie.customPosterUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    setDraftPosterUrl(movie.customPosterUrl || "");
                    setImageLoadError(false);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: colors.interactive,
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  Restore saved URL
                </button>
              ) : null}
            </div>
          </div>

          {/* Right Column: Form Controls */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: spacing.md,
              minWidth: 0,
            }}
          >
            {/* Format Classification Segmented Control */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: spacing.xs,
              }}
            >
              <div
                id="media-format-label"
                style={{
                  color: colors.textSecondary,
                  ...typography.presets.bodySm,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Media Format
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: spacing.xs,
                  padding: 4,
                  borderRadius: radius.md,
                  background: "rgba(0, 0, 0, 0.35)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
                role="group"
                aria-labelledby="media-format-label"
              >
                <button
                  type="button"
                  onClick={() => setDraftFormat("movie")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: spacing.xs,
                    padding: "0.45rem 0.75rem",
                    borderRadius: radius.sm,
                    border:
                      draftFormat === "movie"
                        ? "1px solid rgba(236, 72, 153, 0.6)"
                        : "1px solid transparent",
                    background:
                      draftFormat === "movie"
                        ? "linear-gradient(135deg, rgba(236, 72, 153, 0.25) 0%, rgba(168, 85, 247, 0.2) 100%)"
                        : "transparent",
                    color: draftFormat === "movie" ? "#ffffff" : colors.textSecondary,
                    fontWeight: draftFormat === "movie" ? 700 : 500,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    boxShadow:
                      draftFormat === "movie"
                        ? "0 0 12px rgba(236, 72, 153, 0.25)"
                        : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <FilmIcon size={14} style={{ color: draftFormat === "movie" ? "#f472b6" : "inherit" }} />
                  <span>Film</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDraftFormat("series")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: spacing.xs,
                    padding: "0.45rem 0.75rem",
                    borderRadius: radius.sm,
                    border:
                      draftFormat === "series"
                        ? "1px solid rgba(56, 189, 248, 0.6)"
                        : "1px solid transparent",
                    background:
                      draftFormat === "series"
                        ? "linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(99, 102, 241, 0.2) 100%)"
                        : "transparent",
                    color: draftFormat === "series" ? "#ffffff" : colors.textSecondary,
                    fontWeight: draftFormat === "series" ? 700 : 500,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    boxShadow:
                      draftFormat === "series"
                        ? "0 0 12px rgba(56, 189, 248, 0.25)"
                        : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <TvIcon size={14} style={{ color: draftFormat === "series" ? "#38bdf8" : "inherit" }} />
                  <span>TV Show</span>
                </button>
              </div>

              <span
                style={{
                  fontSize: "0.72rem",
                  color: colors.textTertiary,
                }}
              >
                {draftFormat === "series"
                  ? "Classified as TV Show in your Films / Shows wall filters."
                  : "Classified as Film in your Films / Shows wall filters."}
              </span>
            </div>

            {/* Title Input */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: spacing.xs,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <label
                  htmlFor="movie-edit-title-input"
                  style={{
                    color: colors.textSecondary,
                    ...typography.presets.bodySm,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Title
                </label>
                <span
                  style={{
                    fontSize: "0.7rem",
                    color:
                      draftTitle.length > MAX_MOVIE_TITLE_LENGTH * 0.9
                        ? colors.error
                        : colors.textTertiary,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {draftTitle.length}/{MAX_MOVIE_TITLE_LENGTH}
                </span>
              </div>

              <Input
                ref={inputRef}
                id="movie-edit-title-input"
                value={draftTitle}
                onChange={(event) => {
                  setDraftTitle(event.target.value);
                  if (error) setError(null);
                  if (posterFoundMessage) setPosterFoundMessage(null);
                }}
                maxLength={MAX_MOVIE_TITLE_LENGTH}
                placeholder="Enter title"
                error={error ?? undefined}
              />
            </div>

            {/* Poster URL & Auto-Find Action */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: spacing.xs,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: spacing.xs,
                  flexWrap: "wrap",
                }}
              >
                <label
                  htmlFor="movie-custom-poster-input"
                  style={{
                    color: colors.textSecondary,
                    ...typography.presets.bodySm,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Poster URL (optional)
                </label>

                <button
                  type="button"
                  onClick={handleAutoFindPoster}
                  disabled={isFindingPoster || !draftTitle.trim()}
                  style={{
                    background:
                      isFindingPoster || !draftTitle.trim()
                        ? "rgba(255, 255, 255, 0.04)"
                        : "linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: radius.full,
                    padding: "0.25rem 0.65rem",
                    color:
                      isFindingPoster || !draftTitle.trim()
                        ? colors.textTertiary
                        : "#f3e8ff",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    cursor:
                      isFindingPoster || !draftTitle.trim() ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isFindingPoster && draftTitle.trim()) {
                      e.currentTarget.style.borderColor = "rgba(236, 72, 153, 0.5)";
                      e.currentTarget.style.boxShadow = "0 0 10px rgba(236, 72, 153, 0.3)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {isFindingPoster ? (
                    <>
                      <Spinner size={12} style={{ color: colors.accent }} />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon size={12} style={{ color: "#ec4899" }} />
                      <span>Auto-find poster</span>
                    </>
                  )}
                </button>
              </div>

              <Input
                id="movie-custom-poster-input"
                value={draftPosterUrl}
                onChange={(event) => {
                  setDraftPosterUrl(event.target.value);
                  setImageLoadError(false);
                  if (error) setError(null);
                  if (posterFoundMessage) setPosterFoundMessage(null);
                }}
                placeholder="https://example.com/poster.jpg"
              />

              {/* Status Notice (Success / Error) */}
              {posterFoundMessage ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: "#34d399",
                    fontSize: "0.74rem",
                    fontWeight: 600,
                  }}
                >
                  <CheckIcon size={14} style={{ color: "#34d399" }} />
                  <span>{posterFoundMessage}</span>
                </div>
              ) : null}

              {error && (
                <div
                  style={{
                    color: "#f87171",
                    fontSize: "0.74rem",
                    fontWeight: 500,
                  }}
                >
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Hint */}
        <div
          aria-live="polite"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.35rem 0.5rem",
            color: colors.textTertiary,
            fontSize: "0.72rem",
          }}
        >
          <span>
            {isUnchanged
              ? "Make changes above to update this title."
              : "Ready to save — changes sync across viewers instantly."}
          </span>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: spacing.sm,
            paddingTop: spacing.xs,
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
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
              style={{
                color: "#f87171",
                fontSize: "0.82rem",
                padding: "0.45rem 0.75rem",
              }}
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
              style={{
                fontSize: "0.82rem",
                padding: "0.45rem 0.85rem",
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSaving}
              loadingText="Saving..."
              disabled={!canSubmit}
              style={{
                fontSize: "0.82rem",
                padding: "0.45rem 1rem",
                background: canSubmit
                  ? "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)"
                  : undefined,
                boxShadow: canSubmit ? shadows.glowStrong : undefined,
              }}
            >
              Save changes
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
