export type WorkspaceTab = "movies" | "places";

export type WorkspaceSectionKey = "incoming" | "queue" | "completed";

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
  tab: WorkspaceTab,
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
  tab: WorkspaceTab,
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
  tab: WorkspaceTab;
  isMobile: boolean;
  sectionIds: WorkspaceSectionIds;
  counts: WorkspaceSectionCounts;
}): WorkspaceStatTile[] {
  const completedId = tab === "movies" ? "watched" : "visited";

  return [
    {
      id: "incoming",
      label: workspaceSectionLabel(tab, "incoming", isMobile),
      count: counts.incoming,
      sectionId: sectionIds.incoming,
      tone: "incoming",
    },
    {
      id: "queue",
      label: workspaceSectionLabel(tab, "queue", isMobile),
      count: counts.queue,
      sectionId: sectionIds.queue,
      tone: "default",
    },
    {
      id: completedId,
      label: workspaceSectionLabel(tab, "completed", isMobile),
      count: counts.completed,
      sectionId: sectionIds.completed,
      tone: "completed",
    },
  ];
}
