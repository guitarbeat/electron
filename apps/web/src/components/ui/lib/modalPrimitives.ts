import React from "react";

export function isFocusWithin(container: HTMLElement | null): boolean {
  if (!container || typeof document === "undefined") return false;
  return container.contains(document.activeElement);
}

export function trapFocusOnTab(
  event: React.KeyboardEvent | KeyboardEvent,
  container: HTMLElement | null,
): void {
  if (!container || event.key !== "Tab") return;

  const focusables = Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0);

  if (focusables.length === 0) {
    event.preventDefault();
    return;
  }

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (event.shiftKey) {
    if (document.activeElement === first) {
      last.focus();
      event.preventDefault();
    }
  } else {
    if (document.activeElement === last) {
      first.focus();
      event.preventDefault();
    }
  }
}
