import type { MainTab } from "@/shared/types";

export const APP_VIEW_STATE_KEY = "electron.appViewState.v1";

export interface StoredAppViewState {
  activeTab: MainTab;
  showMessages: boolean;
}

export const parseMainTab = (
  value: string | null | undefined,
): MainTab | null => {
  if (value === "places") return "places";
  if (value === "movies") return "movies";
  return null;
};

export const readStoredAppViewState = (): StoredAppViewState | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(APP_VIEW_STATE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<StoredAppViewState>;
    return {
      activeTab: parsed.activeTab === "places" ? "places" : "movies",
      showMessages: Boolean(parsed.showMessages),
    };
  } catch {
    return null;
  }
};

/** Resolve the tab to show on first load (hash → stored state → movies). */
export const readInitialMainTab = (): MainTab => {
  if (typeof window === "undefined") {
    return "movies";
  }

  const fromHash = parseMainTab(window.location.hash.replace(/^#/, ""));
  if (fromHash) {
    return fromHash;
  }

  return readStoredAppViewState()?.activeTab ?? "movies";
};
