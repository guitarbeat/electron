import { useCallback, useEffect, useState } from "react";
import { shouldIgnoreWorkspaceShortcut } from "@/utils/keyboardShortcutGuards";

interface UseWorkspaceKeyboardHelpResult {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

/** Toggle keyboard shortcuts help with `?` (when not typing in a field). */
export function useWorkspaceKeyboardHelp(): UseWorkspaceKeyboardHelpResult {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "?") {
        if (event.key === "Escape" && isOpen) {
          event.preventDefault();
          close();
        }
        return;
      }

      event.preventDefault();
      if (isOpen) {
        close();
        return;
      }

      if (!shouldIgnoreWorkspaceShortcut(event)) {
        open();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [close, isOpen, open]);

  return { isOpen, open, close };
}
