export type MainTab = "movies" | "suggestions" | "chat" | "quiz" | "places" | "spin" | "messages";

export function readHashMainTab(): MainTab {
  if (typeof window === "undefined") return "movies";
  const hash = window.location.hash.replace("#", "");
  if (["movies", "suggestions", "chat", "quiz", "places", "spin", "messages"].includes(hash)) {
    return hash as MainTab;
  }
  return "movies";
}

export function readInitialMainTab(): MainTab {
  return readHashMainTab();
}

export function setHashMainTab(tab: MainTab): void {
  if (typeof window !== "undefined") {
    window.location.hash = tab;
  }
}
