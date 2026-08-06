import { MAIN_TABS, type MainTab } from "../shared/types.ts";

export const APP_VIEW_STATE_KEY = "electron.appViewState.v1";

export interface StoredAppViewState {
  activeTab: MainTab;
  showMessages?: boolean;
}

export const parseMainTab = (
  value: string | null | undefined,
): MainTab | null => {
  if (value == null || value === "") {
    return null;
  }

  return (MAIN_TABS as readonly string[]).includes(value)
    ? (value as MainTab)
    : null;
};

/** Read the main tab from the current URL hash, if present. */
export const readHashMainTab = (): MainTab | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return parseMainTab(window.location.hash.replace(/^#/, ""));
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
      activeTab: parseMainTab(parsed.activeTab) ?? "movies",
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
  const fromHash = readHashMainTab();
  const fromQuery = parseMainTab(search.get("tab"));

  const panelIsMessages = search.get("panel") === "messages";
  const activeTab =
    fromHash ??
    fromQuery ??
    (panelIsMessages ? "messages" : undefined) ??
    stored?.activeTab ??
    "movies";
  const showMessages = panelIsMessages || Boolean(stored?.showMessages);

  return { activeTab, showMessages };
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
