import { useEffect } from "react";
import type { MainTab } from "@/shared/types";
import { shouldIgnoreWorkspaceShortcut } from "@/utils/keyboardShortcutGuards";

const TAB_BY_KEY: Record<string, MainTab> = {
  m: "movies",
  p: "places",
};

/** Switch workspace tabs with M (movies) and P (places). */
export function useWorkspaceTabShortcuts(
  onTabChange: (tab: MainTab) => void,
): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreWorkspaceShortcut(event)) {
        return;
      }

      const tab = TAB_BY_KEY[event.key.toLowerCase()];
      if (!tab) {
        return;
      }

      event.preventDefault();
      onTabChange(tab);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onTabChange]);
}
