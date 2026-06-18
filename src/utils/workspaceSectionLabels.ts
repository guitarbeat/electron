import type { MainTab } from "@/shared/types";

export type WorkspaceSectionKey = "incoming" | "queue" | "completed";

export type WorkspaceSectionAvailability = Partial<
  Record<WorkspaceSectionKey, boolean>
>;

export type WorkspaceSectionIds = Record<WorkspaceSectionKey, string>;

export interface WorkspaceSectionCounts {
  incoming: number;
  queue: number;
  completed: number;
}

const INCOMING_LABELS = { desktop: "Incoming", mobile: "New" } as const;

const TAB_SECTION_LABELS = {
  movies: {
    queue: { desktop: "Movies", mobile: "All" },
    completed: { desktop: "Watched", mobile: "Done" },
  },
  places: {
    queue: { desktop: "To Try", mobile: "Try" },
    completed: { desktop: "Visited", mobile: "Done" },
  },
} as const;

export function workspaceSectionLabel(
  tab: MainTab,
  section: WorkspaceSectionKey,
  isMobile: boolean,
): string {
  if (section === "incoming") {
    return isMobile ? INCOMING_LABELS.mobile : INCOMING_LABELS.desktop;
  }

  const labels = TAB_SECTION_LABELS[tab][section];
  return isMobile ? labels.mobile : labels.desktop;
}

export function workspaceSectionLabels(
  tab: MainTab,
  isMobile: boolean,
): Record<WorkspaceSectionKey, string> {
  return {
    incoming: workspaceSectionLabel(tab, "incoming", isMobile),
    queue: workspaceSectionLabel(tab, "queue", isMobile),
    completed: workspaceSectionLabel(tab, "completed", isMobile),
  };
}
