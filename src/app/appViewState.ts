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

/** Resolve launch view state (hash → query → stored state → defaults). */
export const readInitialAppViewState = (): StoredAppViewState => {
  if (typeof window === "undefined") {
    return { activeTab: "movies", showMessages: false };
  }

  const stored = readStoredAppViewState();
  const search = new URLSearchParams(window.location.search);
  const fromHash = parseMainTab(window.location.hash.replace(/^#/, ""));
  const fromQuery = parseMainTab(search.get("tab"));

  return {
    activeTab: fromHash ?? fromQuery ?? stored?.activeTab ?? "movies",
    showMessages:
      search.get("panel") === "messages"
        ? true
        : (stored?.showMessages ?? false),
  };
};

/** Resolve the tab to show on first load. */
export const readInitialMainTab = (): MainTab =>
  readInitialAppViewState().activeTab;

/** True when the URL includes one-time launch shortcuts (?tab=, ?panel=). */
export const hasLaunchUrlShortcuts = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  const search = new URLSearchParams(window.location.search);
  return (
    parseMainTab(search.get("tab")) !== null ||
    search.get("panel") === "messages"
  );
};

/** Remove one-time launch shortcuts from the URL without navigation. */
export const stripLaunchUrlShortcuts = (): void => {
  if (typeof window === "undefined" || !hasLaunchUrlShortcuts()) {
    return;
  }

  const search = new URLSearchParams(window.location.search);
  search.delete("tab");
  search.delete("panel");
  const query = search.toString();
  const next = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
  window.history.replaceState({}, "", next);
};
