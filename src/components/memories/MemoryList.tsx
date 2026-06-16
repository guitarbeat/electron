import React, { useState, useMemo, useCallback } from "react";
import { SharedMemory, User } from "@/shared/types";
import Button from "@/ui/Button";
import { Textarea } from "@/ui/FormFields";
import ConfirmDialog from "@/ui/ConfirmDialog";
import {
  colors,
  radius,
  spacing,
  typography,
  layouts,
  sanitizeInput,
  formatMemoryTimestamp,
} from "@/utils";
import {
  ALL_MOVIES_FILTER,
  INITIAL_VISIBLE_COUNT,
  MEMORY_MENTION_REGEX,
  MemorySortMode,
  getStickyNoteRotation,
  getStickyNoteTheme,
} from "./lib/memoryUtils";

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

const MemoryList: React.FC<MemoryListProps> = ({
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
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState("");
  const [isBusyMemoryId, setIsBusyMemoryId] = useState<string | null>(null);
  const [memoryToDelete, setMemoryToDelete] = useState<SharedMemory | null>(
    null,
  );

  // Validation for memory editing
  const canManageMemories = Boolean(currentUser);
  const isSingleMovieContext = Boolean(contextMovieTitle);
  const pinnedCount = useMemo(
    () => sortedMemories.filter((memory) => memory.isPinned).length,
    [sortedMemories],
  );

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
  }, [memoryToDelete, currentUser, onDeleteMemory]);

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
              color: colors.textSecondary,
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
                border: `1px solid ${colors.borderSecondary}40`,
                backgroundColor: colors.surface,
                color: colors.textPrimary,
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
              color: colors.textSecondary,
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
                border: `1px solid ${colors.borderSecondary}40`,
                backgroundColor: colors.surface,
                color: colors.textPrimary,
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
        <p style={{ margin: 0, color: colors.textSecondary }}>
          Loading notes...
        </p>
      )}

      {memoriesError && memories.length === 0 && (
        <p
          style={{
            margin: 0,
            color: colors.error,
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
              border: `1px solid ${colors.borderSecondary}40`,
              color: colors.textPrimary,
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
                border: `1px solid ${colors.borderSecondary}40`,
                color: colors.textPrimary,
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

export default MemoryList;
