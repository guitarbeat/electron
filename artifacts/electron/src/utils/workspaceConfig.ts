import type { MainTab } from "../shared/types.ts";

export interface WorkspaceMeta {
  eyebrow: string;
  title: string;
  icon: string;
}

export type WorkspaceSectionKey = "incoming" | "queue" | "completed";

export type WorkspaceSectionAvailability = Partial<
  Record<WorkspaceSectionKey, boolean>
>;

export type WorkspaceSectionIds = Record<WorkspaceSectionKey, string>;

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
  memories: {
    queue: { desktop: "Memories", mobile: "All" },
    completed: { desktop: "Pinned", mobile: "Pinned" },
  },
  messages: {
    queue: { desktop: "Messages", mobile: "All" },
    completed: { desktop: "Archived", mobile: "Done" },
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

  const tabLabels = (TAB_SECTION_LABELS as Record<string, typeof TAB_SECTION_LABELS[keyof typeof TAB_SECTION_LABELS]>)[tab];
  if (!tabLabels) return section;
  const labels = tabLabels[section];
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

const SECTION_IDS: Record<MainTab, WorkspaceSectionIds> = {
  movies: {
    incoming: "movies-section-incoming",
    queue: "movies-section-queue",
    completed: "movies-section-watched",
  },
  places: {
    incoming: "places-section-incoming",
    queue: "places-section-queue",
    completed: "places-section-visited",
  },
  memories: {
    incoming: "memories-section-incoming",
    queue: "memories-section-queue",
    completed: "memories-section-pinned",
  },
  messages: {
    incoming: "messages-section-incoming",
    queue: "messages-section-queue",
    completed: "messages-section-archived",
  },
};

export const workspaceSectionIds = (tab: MainTab): WorkspaceSectionIds =>
  SECTION_IDS[tab];

export const MOVIES_POSTER_GRID_MIN_COL = "clamp(3.25rem, 18vw, 5.5rem)";
export const PLACES_GRID_MIN_COL = "clamp(10.5rem, 24vw, 13rem)";
export const PLACES_GRID_CLASS = "workspace-content places-grid";

export interface WorkspaceEmptyCopy {
  icon: string;
  title: string;
  copy: string;
  actionLabel?: string;
}

export const WORKSPACE_GLOBAL_EMPTY: Record<MainTab, WorkspaceEmptyCopy> = {
  movies: {
    icon: "film",
    title: "Your movie list is wide open",
    copy: "No movies lined up yet. Add something you both want to watch and kick off movie night.",
    actionLabel: "Add a movie",
  },
  places: {
    icon: "map-pin",
    title: "No places yet",
    copy: "Add a restaurant, café, park, or anywhere else you'd like to visit together.",
    actionLabel: "Add a place",
  },
  memories: {
    icon: "camera",
    title: "No memories yet",
    copy: "Your shared memories from movies will appear here.",
  },
  messages: {
    icon: "message",
    title: "No messages yet",
    copy: "Send a message to start the conversation.",
    actionLabel: "Send a message",
  },
};

export const WORKSPACE_SECTION_EMPTY: Record<
  MainTab,
  { completed: string; queue: string }
> = {
  movies: {
    completed: "No watched movies yet",
    queue: "Your movie list is wide open",
  },
  places: {
    completed: "No visited places yet",
    queue: "Search above to add your first spot",
  },
  memories: {
    completed: "No pinned memories yet",
    queue: "No memories yet",
  },
  messages: {
    completed: "No archived messages",
    queue: "No messages yet",
  },
};

export const WORKSPACE_LOADING_COPY: Record<
  MainTab,
  { emoji?: string; label: string }
> = {
  movies: { label: "Loading your movies…" },
  places: { label: "Loading your places…" },
  memories: { label: "Loading your memories…" },
  messages: { label: "Loading your messages…" },
};

export const WORKSPACE_TAB_CONTAINER: Record<MainTab, string> = {
  movies: "workspace-container",
  places: "workspace-container places-container",
  memories: "workspace-container memories-container",
  messages: "workspace-container messages-container",
};

const WORKSPACE_META: Record<MainTab, WorkspaceMeta> = {
  movies: {
    eyebrow: "Movies",
    title: "Movies",
    icon: "film",
  },
  places: {
    eyebrow: "Dates",
    title: "Date Ideas",
    icon: "map-pin",
  },
  memories: {
    eyebrow: "Memories",
    title: "Memories",
    icon: "camera",
  },
  messages: {
    eyebrow: "Messages",
    title: "Messages",
    icon: "message",
  },
};

export const getWorkspaceMeta = (tab: MainTab): WorkspaceMeta =>
  WORKSPACE_META[tab];

export const WORKSPACE_SKELETON_KEYS = {
  movies: {
    mobile: ["m1", "m2", "m3", "m4"],
    desktop: ["d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8"],
  },
  places: {
    mobile: ["p1", "p2", "p3", "p4"],
    desktop: ["p1", "p2", "p3", "p4", "p5", "p6"],
  },
  memories: {
    mobile: ["r1", "r2", "r3"],
    desktop: ["r1", "r2", "r3", "r4", "r5", "r6"],
  },
  messages: {
    mobile: ["g1", "g2", "g3"],
    desktop: ["g1", "g2", "g3", "g4", "g5"],
  },
} as const;
