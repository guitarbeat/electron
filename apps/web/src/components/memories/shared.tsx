/* eslint-disable react-refresh/only-export-components */
/**
 * MemoriesView — standalone tab view for shared memories.
 * Surfaces all memories across all movies in one place with
 * sort, filter by movie, pagination, and full CRUD actions.
 *
 * This file is consolidated and exports MemoriesView, MemoryComposer, and MemoryList.
 */
import React, { useCallback, useMemo, useState } from "react";
import type { Movie, SharedMemory, User } from "@/shared/types";
import {
  compareCreatedAtAsc,
  compareCreatedAtDesc,
  normalizeMovieTitle,
  sanitizeInput,
  formatMemoryTimestamp,
  layouts,
} from "@/utils";
import { radius, spacing, typography } from "@/theme/tokens";
import { Textarea, Button, ConfirmDialog } from "@/components/ui";

// ─────────────────────────────────────────────────────────────────────────────
// CONSOLIDATED UTILS, CONSTANTS & HOOKS (formerly memories/lib)
// ─────────────────────────────────────────────────────────────────────────────

export const INITIAL_VISIBLE_COUNT = 6;
export const ALL_MOVIES_FILTER = "all";

export type MemorySortMode = "newest" | "oldest";
export const MEMORY_MENTION_REGEX = /(@Aaron|@Electra)\b/gi;

export interface StickyNoteTheme {
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
    background:
      "linear-gradient(165deg, #fff4a6 0%, #f9e07a 72%, #efd46a 100%)",
    border: "#d0b45b",
    heading: "#4b3810",
    text: "#44330f",
    meta: "#6a5523",
    signature: "#7a3f00",
    pin: "#e45858",
  },
  {
    background:
      "linear-gradient(165deg, #b7f5ff 0%, #98e4f5 70%, #7ed2e8 100%)",
    border: "#72bccf",
    heading: "#12394a",
    text: "#113341",
    meta: "#2c5160",
    signature: "#115073",
    pin: "#f56f42",
  },
  {
    background:
      "linear-gradient(165deg, #ffd3b2 0%, #ffbf96 74%, #f8ad84 100%)",
    border: "#dd9367",
    heading: "#5e2c10",
    text: "#4e2a12",
    meta: "#754220",
    signature: "#8a3412",
    pin: "#47906f",
  },
  {
    background:
      "linear-gradient(165deg, #dcf8c5 0%, #c8ebaa 73%, #b2d78f 100%)",
    border: "#95b572",
    heading: "#2e4b1e",
    text: "#2d461d",
    meta: "#496838",
    signature: "#3f6a1f",
    pin: "#4168d6",
  },
];

const STICKY_NOTE_ROTATIONS = [-2.3, 1.8, -1.2, 2.4, -0.7, 1.1, -1.8, 2.7];

export const groupMemoriesByMovieId = (
  movies: Movie[],
  memories: SharedMemory[],
): Map<string, SharedMemory[]> => {
  const movieLookupByTitle = new Map(
    movies.map((movie) => [normalizeMovieTitle(movie.title), movie.id]),
  );
  const memoriesByMovieId = new Map<string, SharedMemory[]>();

  for (const memory of memories) {
    const targetMovieId =
      memory.movieId ??
      movieLookupByTitle.get(normalizeMovieTitle(memory.movieTitle));
    if (!targetMovieId) {
      continue;
    }

    const group = memoriesByMovieId.get(targetMovieId);
    if (group) {
      group.push(memory);
    } else {
      memoriesByMovieId.set(targetMovieId, [memory]);
    }
  }

  return memoriesByMovieId;
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

export const getStickyNoteTheme = (memory: SharedMemory): StickyNoteTheme => {
  const seed = getMemorySeed(memory);
  return STICKY_NOTE_THEMES[seed % STICKY_NOTE_THEMES.length];
};

export const getStickyNoteRotation = (memory: SharedMemory): number => {
  const seed = getMemorySeed(memory);
  return STICKY_NOTE_ROTATIONS[seed % STICKY_NOTE_ROTATIONS.length];
};

export const sortMemories = (
  memories: SharedMemory[],
  sortMode: MemorySortMode,
): SharedMemory[] => {
  const byDate =
    sortMode === "oldest" ? compareCreatedAtAsc : compareCreatedAtDesc;

  return [...memories].sort((a, b) => {
    if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
      return a.isPinned ? -1 : 1;
    }

    return byDate(a, b);
  });
};

export const canCreateMemory = (currentUser: string | null): boolean =>
  Boolean(currentUser);

export interface MemoryListActions {
  currentUser: User | null;
  onEditMemory: (memory: SharedMemory, note: string) => Promise<void>;
  onDeleteMemory: (memory: SharedMemory) => Promise<void>;
  onTogglePin: (memory: SharedMemory) => Promise<void>;
}

export const useMemoryListActions = ({
  currentUser,
  onEditMemory,
  onDeleteMemory,
  onTogglePin,
}: MemoryListActions) => {
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState("");
  const [isBusyMemoryId, setIsBusyMemoryId] = useState<string | null>(null);
  const [memoryToDelete, setMemoryToDelete] = useState<SharedMemory | null>(null);

  const confirmDeleteMemory = useCallback(async () => {
    if (!memoryToDelete) return;
    if (!currentUser || memoryToDelete.author !== currentUser) {
      setMemoryToDelete(null);
      return;
    }
    setIsBusyMemoryId(memoryToDelete.id);
    try {
      await onDeleteMemory(memoryToDelete);
      setMemoryToDelete(null);
    } finally {
      setIsBusyMemoryId(null);
    }
  }, [currentUser, memoryToDelete, onDeleteMemory]);

  const startEditing = useCallback((memory: SharedMemory) => {
    setEditingMemoryId(memory.id);
    setDraftNote(memory.note);
  }, []);

  const saveEdit = useCallback(
    async (memory: SharedMemory) => {
      const trimmedNote = sanitizeInput(draftNote.trim());
      if (!trimmedNote) return;
      setIsBusyMemoryId(memory.id);
      try {
        await onEditMemory(memory, trimmedNote);
        setEditingMemoryId(null);
        setDraftNote("");
      } finally {
        setIsBusyMemoryId(null);
      }
    },
    [draftNote, onEditMemory],
  );

  const cancelEdit = useCallback(() => {
    setEditingMemoryId(null);
    setDraftNote("");
  }, []);

  const togglePin = useCallback(
    async (memory: SharedMemory) => {
      setIsBusyMemoryId(memory.id);
      try {
        await onTogglePin(memory);
      } finally {
        setIsBusyMemoryId(null);
      }
    },
    [onTogglePin],
  );

  return {
    editingMemoryId,
    draftNote,
    setDraftNote,
    isBusyMemoryId,
    memoryToDelete,
    setMemoryToDelete,
    confirmDeleteMemory,
    startEditing,
    saveEdit,
    cancelEdit,
    togglePin,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT: MemoryComposer
// ─────────────────────────────────────────────────────────────────────────────

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

export const MemoryComposer: React.FC<MemoryComposerProps> = ({
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

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT: MemoryList
// ─────────────────────────────────────────────────────────────────────────────

interface MemoryListProps {
  memories: SharedMemory[];
  visibleMemories: SharedMemory[];
  sortedMemories: SharedMemory[];
  contextMovieTitle?: string;
  movieFilterOptions: Array<{ id: string; title: string }>;
  activeMovieFilter: string;
  onActiveMovieFilterChange: (nextFilter: string) => void;
  sortMode: MemorySortMode;
  onSortModeChange: (nextSort: MemorySortMode) => void;
  onShowMore: () => void;
  onShowLess: () => void;
  visibleCount: number;
  isLoading: boolean;
  memoriesError: string | null;
  isMobile: boolean;
  currentUser: User | null;
  onJumpToMovie: (memory: SharedMemory) => void;
  onEditMemory: (memory: SharedMemory, note: string) => Promise<void>;
  onDeleteMemory: (memory: SharedMemory) => Promise<void>;
  onTogglePin: (memory: SharedMemory) => Promise<void>;
}

const mentionStyle: React.CSSProperties = {
  fontWeight: 700,
  textDecoration: "underline",
  textUnderlineOffset: "2px",
};

const renderMemoryNote = (text: string) => {
  const parts = text.split(MEMORY_MENTION_REGEX);
  return parts.map((part, index) => {
    const normalized = part.toLowerCase();
    if (normalized !== "@aaron" && normalized !== "@electra") {
      return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
    }
    const color = normalized === "@aaron" ? "#376dff" : "#e45858";
    return (
      <span
        key={`${part}-${index}`}
        style={{
          ...mentionStyle,
          color,
        }}
      >
        {part}
      </span>
    );
  });
};

export const MemoryList: React.FC<MemoryListProps> = ({
  memories,
  visibleMemories,
  sortedMemories,
  contextMovieTitle,
  movieFilterOptions,
  activeMovieFilter,
  onActiveMovieFilterChange,
  sortMode,
  onSortModeChange,
  onShowMore,
  onShowLess,
  visibleCount,
  isLoading,
  memoriesError,
  isMobile,
  currentUser,
  onJumpToMovie,
  onEditMemory,
  onDeleteMemory,
  onTogglePin,
}) => {
  const {
    editingMemoryId,
    draftNote,
    setDraftNote,
    isBusyMemoryId,
    memoryToDelete,
    setMemoryToDelete,
    confirmDeleteMemory,
    startEditing,
    saveEdit,
    cancelEdit,
    togglePin,
  } = useMemoryListActions({
    currentUser,
    onEditMemory,
    onDeleteMemory,
    onTogglePin,
  });

  const canManageMemories = Boolean(currentUser);
  const isSingleMovieContext = Boolean(contextMovieTitle);
  const pinnedCount = useMemo(
    () => sortedMemories.filter((memory) => memory.isPinned).length,
    [sortedMemories],
  );

  return (
    <div
      style={{
        marginTop: spacing.lg,
        padding: isMobile ? spacing.sm : spacing.md,
        borderRadius: radius.md,
        border: "1px solid rgba(255, 228, 177, 0.34)",
        background:
          "linear-gradient(165deg, rgba(57, 34, 18, 0.45) 0%, rgba(38, 22, 11, 0.55) 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          ...layouts.spaceBetween("row", spacing.sm),
          flexWrap: "wrap",
          marginBottom: spacing.sm,
        }}
      >
        <h4
          style={{
            margin: 0,
            color: "#ffe3b1",
            fontSize: typography.fontSize.base,
            fontFamily: typography.fontFamily.heading.join(", "),
            letterSpacing: typography.letterSpacing.normal,
          }}
        >
          {contextMovieTitle ? `Notes on ${contextMovieTitle}` : "Latest notes"}
        </h4>
        <span style={{ color: "#f7ddba", fontSize: typography.fontSize.xs }}>
          {pinnedCount} pinned note{pinnedCount === 1 ? "" : "s"}
        </span>
      </div>

      {memories.length > 0 && !isSingleMovieContext && (
        <div
          style={{
            ...layouts.grid(isMobile ? 1 : 2, spacing.sm),
            marginBottom: spacing.sm,
            padding: spacing.sm,
            border: "1px dashed rgba(255, 227, 172, 0.3)",
            borderRadius: radius.sm,
            background: "rgba(18, 25, 43, 0.32)",
          }}
        >
          <label
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: typography.fontSize.xs,
            }}
          >
            Filter by title
            <select
              value={activeMovieFilter}
              onChange={(e) => onActiveMovieFilterChange(e.target.value)}
              style={{
                marginTop: spacing.xs,
                width: "100%",
                height: "40px",
                borderRadius: radius.md,
                border: "1px solid rgba(255,255,255,0.12)",
                backgroundColor: "rgba(18, 25, 43, 0.7)",
                color: "#f8fafc",
                padding: `0 ${spacing.sm}`,
                fontFamily: typography.fontFamily.body.join(", "),
              }}
            >
              <option value={ALL_MOVIES_FILTER}>All titles</option>
              {movieFilterOptions.map((movieOption) => (
                <option key={movieOption.id} value={movieOption.id}>
                  {movieOption.title}
                </option>
              ))}
            </select>
          </label>

          <label
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: typography.fontSize.xs,
            }}
          >
            Sort
            <select
              value={sortMode}
              onChange={(e) =>
                onSortModeChange(e.target.value as MemorySortMode)
              }
              style={{
                marginTop: spacing.xs,
                width: "100%",
                minWidth: isMobile ? "100%" : "170px",
                height: "40px",
                borderRadius: radius.md,
                border: "1px solid rgba(255,255,255,0.12)",
                backgroundColor: "rgba(18, 25, 43, 0.7)",
                color: "#f8fafc",
                padding: `0 ${spacing.sm}`,
                fontFamily: typography.fontFamily.body.join(", "),
              }}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
        </div>
      )}

      {isLoading && memories.length === 0 && (
        <p style={{ margin: 0, color: "rgba(255,255,255,0.6)" }}>
          Loading notes...
        </p>
      )}

      {memoriesError && memories.length === 0 && (
        <p
          style={{
            margin: 0,
            color: "#f87171",
            fontSize: typography.fontSize.sm,
          }}
        >
          Couldn&apos;t load notes right now. Try again in a few seconds.
        </p>
      )}

      {!isLoading && !memoriesError && visibleMemories.length === 0 && (
        <p style={{ margin: 0, color: "#f6e4cb" }}>
          {isSingleMovieContext
            ? "No notes yet."
            : activeMovieFilter === ALL_MOVIES_FILTER
              ? "No notes yet."
              : "No matching notes."}
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr"
            : "repeat(auto-fill, minmax(220px, 1fr))",
          gap: spacing.md,
        }}
      >
        {visibleMemories.map((memory) => {
          const noteTheme = getStickyNoteTheme(memory);
          const noteRotation = getStickyNoteRotation(memory);
          const isEditing = editingMemoryId === memory.id;
          const isBusy = isBusyMemoryId === memory.id;
          const isMemoryOwner = currentUser === memory.author;

          return (
            <div
              key={memory.id}
              style={{
                position: "relative",
                border: `1px solid ${noteTheme.border}`,
                borderRadius: radius.sm,
                padding: `${spacing.md} ${spacing.sm} ${spacing.sm}`,
                background: noteTheme.background,
                boxShadow:
                  "0 10px 15px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.45)",
                minHeight: isMobile ? "auto" : "220px",
                display: "flex",
                flexDirection: "column",
                gap: spacing.xs,
                transform: isMobile ? "none" : `rotate(${noteRotation}deg)`,
                transformOrigin: "top center",
              }}
            >
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  top: "-8px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "16px",
                  height: "16px",
                  borderRadius: radius.full,
                  background: noteTheme.pin,
                  border: "1px solid rgba(0,0,0,0.22)",
                  boxShadow: "0 3px 5px rgba(0,0,0,0.35)",
                }}
              />

              <div
                style={{
                  ...layouts.spaceBetween("row", spacing.sm),
                  flexWrap: "wrap",
                }}
              >
                <strong
                  style={{
                    color: noteTheme.heading,
                    fontSize: typography.fontSize.sm,
                  }}
                >
                  {isSingleMovieContext
                    ? "Quote or thought"
                    : memory.movieTitle}
                </strong>
                <div
                  style={{
                    ...layouts.flexRow("flex-start", "center", spacing.xs),
                  }}
                >
                  {memory.isPinned && (
                    <span
                      style={{
                        color: "#6b3f00",
                        background: "rgba(255, 235, 179, 0.8)",
                        borderRadius: radius.full,
                        fontSize: typography.fontSize["2xs"],
                        padding: "1px 8px",
                        border: "1px solid rgba(125, 87, 16, 0.35)",
                      }}
                    >
                      PINNED
                    </span>
                  )}
                  <span
                    style={{
                      color: noteTheme.meta,
                      fontSize: typography.fontSize.xs,
                    }}
                  >
                    {formatMemoryTimestamp(
                      memory.updatedAt || memory.createdAt,
                    )}
                  </span>
                </div>
              </div>

              {isEditing ? (
                <>
                  <Textarea
                    label="Edit note"
                    value={draftNote}
                    onChange={(e) => setDraftNote(e.target.value)}
                    style={{ minHeight: "100px" }}
                    disabled={isBusy}
                  />
                  <div
                    style={{
                      display: "flex",
                      gap: spacing.xs,
                      flexWrap: "wrap",
                    }}
                  >
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={isBusy || !draftNote.trim()}
                      onClick={() => saveEdit(memory)}
                    >
                      Save note
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={isBusy}
                      onClick={cancelEdit}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : isSingleMovieContext ? (
                <div
                  style={{
                    margin: `${spacing.xs} 0`,
                    color: noteTheme.text,
                    fontSize: typography.fontSize.sm,
                    lineHeight: typography.lineHeight.normal,
                    whiteSpace: "pre-wrap",
                    flex: 1,
                  }}
                >
                  {renderMemoryNote(memory.note)}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onJumpToMovie(memory)}
                  style={{
                    margin: `${spacing.xs} 0`,
                    color: noteTheme.text,
                    fontSize: typography.fontSize.sm,
                    lineHeight: typography.lineHeight.normal,
                    whiteSpace: "pre-wrap",
                    flex: 1,
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                  aria-label={`Jump to movie ${memory.movieTitle}`}
                >
                  {renderMemoryNote(memory.note)}
                </button>
              )}

              <span
                style={{
                  color: noteTheme.signature,
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.semibold,
                }}
              >
                - {memory.author}
              </span>

              {!isEditing && (
                <div
                  style={{
                    ...layouts.flexRow("flex-start", "center", spacing.xs),
                    flexWrap: "wrap",
                    marginTop: "auto",
                  }}
                >
                  {!isSingleMovieContext && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => onJumpToMovie(memory)}
                      style={{
                        border: "1px solid rgba(106, 77, 40, 0.45)",
                        color: "#4e2d11",
                      }}
                    >
                      Open movie
                    </Button>
                  )}

                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={!canManageMemories || isBusy}
                    onClick={() => togglePin(memory)}
                    style={{
                      border: "1px solid rgba(106, 77, 40, 0.45)",
                      color: "#4e2d11",
                    }}
                  >
                    {memory.isPinned ? "Unpin note" : "Keep pinned"}
                  </Button>

                  {isMemoryOwner ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={!canManageMemories || isBusy}
                        onClick={() => startEditing(memory)}
                        style={{
                          border: "1px solid rgba(106, 77, 40, 0.45)",
                          color: "#4e2d11",
                        }}
                      >
                        Edit note
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={!canManageMemories || isBusy}
                        onClick={() => setMemoryToDelete(memory)}
                        style={{
                          border: "1px solid rgba(153, 66, 58, 0.45)",
                          color: "#7a261f",
                        }}
                      >
                        Delete note
                      </Button>
                    </>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {sortedMemories.length > visibleCount && (
        <div
          style={{
            marginTop: spacing.sm,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onShowMore}
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#f8fafc",
            }}
          >
            Show More
          </Button>
        </div>
      )}

      {sortedMemories.length <= visibleCount &&
        visibleCount > INITIAL_VISIBLE_COUNT && (
          <div
            style={{
              marginTop: spacing.sm,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onShowLess}
              style={{
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#f8fafc",
              }}
            >
              Show Less
            </Button>
          </div>
        )}

      <ConfirmDialog
        isOpen={!!memoryToDelete}
        title="Delete Note"
        message={`Delete this note from ${memoryToDelete?.author || "Unknown"}?`}
        confirmText="Delete note"
        onConfirm={confirmDeleteMemory}
        onCancel={() => setMemoryToDelete(null)}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT: MemoriesView Main Component
// ─────────────────────────────────────────────────────────────────────────────

export interface MemoriesViewProps {
  onJumpToMovies?: () => void;
}
