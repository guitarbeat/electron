import type { MainTab } from "@/shared/types";

export type WorkspaceSectionKey = "incoming" | "queue" | "completed";

export type WorkspaceSectionAvailability = Partial<
  Record<WorkspaceSectionKey, boolean>
>;

/** Map bento stat tile id → section key (`watched` / `visited` → completed). */
export function workspaceTileSectionKey(tileId: string): WorkspaceSectionKey {
  if (tileId === "incoming" || tileId === "queue") {
    return tileId;
  }
  return "completed";
}

export type WorkspaceSectionIds = Record<WorkspaceSectionKey, string>;

export interface WorkspaceSectionCounts {
  incoming: number;
  queue: number;
  completed: number;
}

const INCOMING_LABELS = { desktop: "Incoming", mobile: "New" } as const;

const TAB_SECTION_LABELS = {
  movies: {
    queue: { desktop: "Up Next", mobile: "Queue" },
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

/** Full section name for navigation affordances (tooltips, aria). */
export function workspaceSectionNavLabel(
  tab: MainTab,
  section: WorkspaceSectionKey,
): string {
  return workspaceSectionLabel(tab, section, false);
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

export interface WorkspaceStatTile {
  id: string;
  label: string;
  navLabel: string;
  count: number;
  sectionId: string;
  tone: "default" | "incoming" | "completed";
}

export function buildWorkspaceStatTiles({
  tab,
  isMobile,
  sectionIds,
  counts,
}: {
  tab: MainTab;
  isMobile: boolean;
  sectionIds: WorkspaceSectionIds;
  counts: WorkspaceSectionCounts;
}): WorkspaceStatTile[] {
  const completedId = tab === "movies" ? "watched" : "visited";

  const tile = (
    id: string,
    section: WorkspaceSectionKey,
    sectionId: string,
    count: number,
    tone: WorkspaceStatTile["tone"],
  ): WorkspaceStatTile => ({
    id,
    label: workspaceSectionLabel(tab, section, isMobile),
    navLabel: workspaceSectionNavLabel(tab, section),
    count,
    sectionId,
    tone,
  });

  return [
    tile("incoming", "incoming", sectionIds.incoming, counts.incoming, "incoming"),
    tile("queue", "queue", sectionIds.queue, counts.queue, "default"),
    tile(completedId, "completed", sectionIds.completed, counts.completed, "completed"),
  ];
}
