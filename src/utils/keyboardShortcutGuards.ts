/** True when the event target is a text-entry control. */
export function isTypingInField(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

/** True when a modal dialog is open and should capture shortcuts. */
export function isModalOpen(): boolean {
  if (typeof document === "undefined") {
    return false;
  }
  return Boolean(document.querySelector('[aria-modal="true"]'));
}

/** Shared guard for global workspace keyboard shortcuts. */
export function shouldIgnoreWorkspaceShortcut(event: KeyboardEvent): boolean {
  if (event.metaKey || event.ctrlKey || event.altKey) {
    return true;
  }
  if (isTypingInField(event.target)) {
    return true;
  }
  if (isModalOpen()) {
    return true;
  }
  return false;
}
