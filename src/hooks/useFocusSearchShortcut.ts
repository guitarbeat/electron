import { useEffect } from "react";
import { shouldIgnoreWorkspaceShortcut } from "@/utils/keyboardShortcutGuards";

/** Focus the workspace search field when the user presses `/` outside text inputs. */
export function useFocusSearchShortcut(focusSearch: () => void): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || shouldIgnoreWorkspaceShortcut(event)) {
        return;
      }

      event.preventDefault();
      focusSearch();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [focusSearch]);
}
