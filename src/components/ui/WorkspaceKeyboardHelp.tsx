import { useEffect, useId, useRef, type FC } from "react";
import { createPortal } from "react-dom";
import Button from "@/ui/Button";
import { trapFocusOnTab } from "@/ui/lib/modalPrimitives";

interface ShortcutRow {
  keys: string;
  description: string;
}

const WORKSPACE_SHORTCUTS: ShortcutRow[] = [
  { keys: "/", description: "Focus search" },
  { keys: "1 2 3", description: "Jump to Incoming, Queue, and Done sections" },
  { keys: "M P", description: "Switch to Movies or Places" },
  { keys: "?", description: "Show or hide this help" },
  { keys: "Esc", description: "Close menus, autocomplete, or this help" },
];

interface WorkspaceKeyboardHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const WorkspaceKeyboardHelp: FC<WorkspaceKeyboardHelpProps> = ({
  isOpen,
  onClose,
}) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      previousFocusRef.current?.focus?.();
      return undefined;
    }

    previousFocusRef.current = document.activeElement as HTMLElement;
    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      trapFocusOnTab(event, panelRef.current);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="workspace-kbd-help">
      <button
        type="button"
        className="workspace-kbd-help__backdrop"
        aria-label="Close keyboard shortcuts"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="workspace-kbd-help__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="workspace-kbd-help__header">
          <h2 id={titleId} className="workspace-kbd-help__title">
            Keyboard shortcuts
          </h2>
          <Button
            ref={closeButtonRef}
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close keyboard shortcuts"
          >
            Close
          </Button>
        </header>
        <dl className="workspace-kbd-help__list">
          {WORKSPACE_SHORTCUTS.map((shortcut) => (
            <div key={shortcut.keys} className="workspace-kbd-help__row">
              <dt>
                <kbd className="workspace-kbd-help__keys">{shortcut.keys}</kbd>
              </dt>
              <dd>{shortcut.description}</dd>
            </div>
          ))}
        </dl>
        <p className="workspace-kbd-help__footnote">
          Shortcuts work on the Movies and Places tabs when no dialog is open.
        </p>
      </div>
    </div>,
    document.body,
  );
};

export default WorkspaceKeyboardHelp;
