import type { MainTab } from "@/shared/types";
import { buildSortChips } from "@/utils/buildSortChips";
import type { WorkspaceSectionIds } from "@/utils/workspaceSectionLabels";

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
};

export const workspaceSectionIds = (tab: MainTab): WorkspaceSectionIds =>
  SECTION_IDS[tab];

export const MOVIES_POSTER_GRID_MIN_COL = "clamp(3.25rem, 18vw, 5.5rem)";
export const PLACES_GRID_MIN_COL = "clamp(10.5rem, 24vw, 13rem)";
export const PLACES_GRID_CLASS = "watchlist-content places-grid";

const RECENT_ALPHA = [
  {
    value: "recent" as const,
    desktopLabel: "🕐 Recent",
    mobileLabel: "Recent",
    ariaLabel: "Recent",
  },
  {
    value: "alpha" as const,
    desktopLabel: "A→Z",
    mobileLabel: "A→Z",
    ariaLabel: "Alphabetical",
  },
];

export const BASE_COLLECTION_SORTS = buildSortChips(RECENT_ALPHA);

export const MOVIE_COLLECTION_SORTS = buildSortChips([
  ...RECENT_ALPHA,
  {
    value: "rating",
    desktopLabel: "★ Rating",
    mobileLabel: "Rating",
    ariaLabel: "Rating",
  },
]);

export const PLACE_COLLECTION_SORTS = BASE_COLLECTION_SORTS;

export interface WorkspaceEmptyCopy {
  icon: string;
  title: string;
  copy: string;
  actionLabel?: string;
}

export const WORKSPACE_GLOBAL_EMPTY: Record<MainTab, WorkspaceEmptyCopy> = {
  movies: {
    icon: "🎬",
    title: "Your movie list is wide open",
    copy: "No movies lined up yet. Add something you both want to watch and kick off movie night.",
    actionLabel: "Add a movie",
  },
  places: {
    icon: "🗺️",
    title: "No places yet",
    copy: "Add a restaurant, café, park, or anywhere else you'd like to visit together.",
    actionLabel: "Add a place",
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
};

export const WORKSPACE_LOADING_COPY: Record<
  MainTab,
  { emoji: string; label: string }
> = {
  movies: { emoji: "🍿", label: "Loading your movies…" },
  places: { emoji: "🗺️", label: "Loading your places…" },
};

export const WORKSPACE_SKELETON_KEYS = {
  movies: {
    mobile: ["m1", "m2", "m3", "m4"],
    desktop: ["d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8"],
  },
  places: {
    mobile: ["p1", "p2", "p3", "p4"],
    desktop: ["p1", "p2", "p3", "p4", "p5", "p6"],
  },
} as const;
