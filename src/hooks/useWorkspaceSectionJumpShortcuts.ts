import { useEffect, useMemo } from "react";
import { scrollToWorkspaceSection } from "@/utils/scrollToWorkspaceSection";
import { shouldIgnoreWorkspaceShortcut } from "@/utils/keyboardShortcutGuards";

export interface WorkspaceSectionJumpTarget {
  sectionId: string;
  count: number;
  isDisabled?: boolean;
}

const SECTION_JUMP_KEYS = ["1", "2", "3"] as const;

interface UseWorkspaceSectionJumpShortcutsOptions {
  enabled?: boolean;
}

/**
 * Jump to workspace sections with number keys 1–3 (incoming → queue → completed).
 */
export function useWorkspaceSectionJumpShortcuts(
  targets: readonly WorkspaceSectionJumpTarget[],
  { enabled = true }: UseWorkspaceSectionJumpShortcutsOptions = {},
): void {
  const jumpMap = useMemo(() => {
    const map = new Map<string, WorkspaceSectionJumpTarget>();
    SECTION_JUMP_KEYS.forEach((key, index) => {
      const target = targets[index];
      if (target) {
        map.set(key, target);
      }
    });
    return map;
  }, [targets]);

  useEffect(() => {
    if (!enabled || jumpMap.size === 0) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreWorkspaceShortcut(event)) {
        return;
      }

      const target = jumpMap.get(event.key);
      if (!target) {
        return;
      }

      const isDisabled = target.isDisabled ?? target.count === 0;
      if (isDisabled) {
        return;
      }

      event.preventDefault();
      scrollToWorkspaceSection(target.sectionId);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled, jumpMap]);
}
