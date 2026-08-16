import type { MainTab } from "../shared/types.ts";

/** Movies and places share one library workspace. */
export const isLibraryWorkspaceTab = (tab: MainTab): boolean =>
  tab === "movies" || tab === "places";

export const LIBRARY_TAB: MainTab = "movies";
export const LIBRARY_PLACES_ANCHOR_ID = "library-places";

export const libraryWorkspaceStackClass = (tab: MainTab): string =>
  isLibraryWorkspaceTab(tab)
    ? "app-workspace-stack--movies"
    : `app-workspace-stack--${tab}`;
