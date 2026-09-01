import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { spacing } from "../theme/tokens.js";

/** Merge Tailwind class names safely (clsx + twMerge). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// Layout Utilities
// ============================================================================

export const layouts = {
  centeredContainer: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: `0 ${spacing.md}`,
  },
  grid: (columns: number = 1, gap: string = spacing.md) => ({
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap,
  }),
  stack: (gap: string = spacing.md) => ({
    display: "flex",
    flexDirection: "column" as const,
    gap,
  }),
  inlineStack: (gap: string = spacing.md) => ({
    display: "flex",
    alignItems: "center",
    gap,
  }),
  flexRow: (
    justifyContent: string = "flex-start",
    alignItems: string = "center",
    gap: string = spacing.md,
  ) => ({
    display: "flex",
    flexDirection: "row" as const,
    justifyContent,
    alignItems,
    gap,
  }),
  flexColumn: (
    justifyContent: string = "flex-start",
    alignItems: string = "stretch",
    gap: string = spacing.md,
  ) => ({
    display: "flex",
    flexDirection: "column" as const,
    justifyContent,
    alignItems,
    gap,
  }),
  spaceBetween: (
    direction: "row" | "column" = "row",
    gap: string = spacing.md,
  ) => ({
    display: "flex",
    flexDirection: direction,
    justifyContent: "space-between",
    alignItems: direction === "row" ? "center" : "stretch",
    gap,
  }),
};

// ============================================================================
// Collection Sorting & State Utilities
// ============================================================================

export interface CollectionSections<T, S> {
  suggestions: S[];
  queue: T[];
  completed: T[];
}

export type WorkspaceCollectionState = "loading" | "empty" | "content";

export interface WorkspaceCollectionStateInput {
  itemCount: number;
  suggestionCount: number;
  isLoadingItems: boolean;
  isLoadingSuggestions: boolean;
}

export function getWorkspaceCollectionState({
  itemCount,
  suggestionCount,
  isLoadingItems,
  isLoadingSuggestions,
}: WorkspaceCollectionStateInput): WorkspaceCollectionState {
  if (itemCount > 0 || suggestionCount > 0) {
    return "content";
  }
  if (isLoadingItems || isLoadingSuggestions) {
    return "loading";
  }
  return "empty";
}

export const compareCreatedAtDesc = (
  left: { createdAt: string },
  right: { createdAt: string },
): number =>
  new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();

export const compareCreatedAtAsc = (
  left: { createdAt: string },
  right: { createdAt: string },
): number => compareCreatedAtDesc(right, left);

export const compareStringsAlpha = (left: string, right: string): number =>
  left.localeCompare(right, undefined, { sensitivity: "base" });

/**
 * Builds standard collection sections (Suggestions, Queue, Completed)
 */
export function buildCollectionSections<T, S>(
  items: T[],
  suggestions: S[] = [],
  isCompleted: (item: T) => boolean,
): CollectionSections<T, S> {
  const queue: T[] = [];
  const completed: T[] = [];

  for (const item of items) {
    if (isCompleted(item)) {
      completed.push(item);
    } else {
      queue.push(item);
    }
  }

  return { suggestions, queue, completed };
}
