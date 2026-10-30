import { useEffect } from "react";
import { spatialScore, type Direction } from "./tvSpatialGeometry";

declare global {
  interface Window { electronTvBack?: () => boolean; }
}

const SELECTOR = 'a[href],button,input,select,textarea,summary,[tabindex],[contenteditable="true"]';
const DIRECTIONS = new Set<string>(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

function visible(element: HTMLElement) {
  if (element.closest('[hidden],[inert],[aria-hidden="true"]')) return false;
  const style = getComputedStyle(element);
  if (style.visibility === "hidden" || style.display === "none") return false;
  if (element.closest("details:not([open])") && element.tagName !== "SUMMARY") return false;
  return element.getClientRects().length > 0 && element.offsetWidth > 0 && element.offsetHeight > 0;
}

function focusables(scope: ParentNode): HTMLElement[] {
  return Array.from(scope.querySelectorAll<HTMLElement>(SELECTOR)).filter(element =>
    element.tabIndex >= 0 && visible(element) &&
    !element.matches(':disabled,[aria-disabled="true"],.movie-details-modal__backdrop') &&
    // DriftWall wrappers duplicate their nested poster buttons. Choose the real action.
    !(element.matches('[role="gridcell"]') && element.querySelector('button,a[href]')),
  );
}

function scopeForFocus(): HTMLElement {
  const dialogs = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"],[role="alertdialog"]')).filter(visible);
  const modal = dialogs.filter(dialog => dialog.getAttribute("aria-modal") === "true").at(-1);
  if (modal) return modal;
  const panel = dialogs.at(-1);
  if (panel) return panel;
  const menu = Array.from(document.querySelectorAll<HTMLElement>('details[open]')).filter(visible).at(-1);
  return menu ?? document.body;
}

function focusAndReveal(element: HTMLElement) {
  element.focus({ preventScroll: true });
  const behavior = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  const grid = element.closest<HTMLElement>(".movie-library-grid");
  if (grid) {
    // Keep posters clear of the constant corner shelves, including when scrolling up.
    const box = element.getBoundingClientRect();
    const margin = 120;
    if (box.top < margin) grid.scrollBy({ top: box.top - margin, behavior });
    else if (box.bottom > innerHeight - margin) grid.scrollBy({ top: box.bottom - innerHeight + margin, behavior });
  } else {
    element.scrollIntoView({ behavior, block: "nearest", inline: "nearest" });
  }
}

/** TV-only: one spatial navigator owns directions, scopes overlays, and restores focus. */
export function useTvSpatialNavigation(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    let currentScope: HTMLElement = document.body;
    const returnFocus = new WeakMap<HTMLElement, HTMLElement>();
    let lastFocus: HTMLElement | null = null;
    let frame = 0;

    const reconcile = () => {
      const nextScope = scopeForFocus();
      if (nextScope !== currentScope) {
        if (nextScope !== document.body && lastFocus && !returnFocus.has(nextScope)) returnFocus.set(nextScope, lastFocus);
        const restore = returnFocus.get(currentScope);
        const active = document.activeElement;
        const alreadyMoved = active instanceof HTMLElement && active !== document.body &&
          nextScope.contains(active) && !currentScope.contains(active) && visible(active);
        currentScope = nextScope;
        if (restore?.isConnected && visible(restore) && nextScope.contains(restore)) {
          // A component or the user may already have moved focus while the overlay closed.
          if (!alreadyMoved) focusAndReveal(restore);
          return;
        }
        if (nextScope !== document.body) {
          const first = focusables(nextScope).find(element => element.tagName !== "SUMMARY");
          if (first) { focusAndReveal(first); return; }
        }
      }
      const active = document.activeElement;
      if (!(active instanceof HTMLElement) || active === document.body || !visible(active) || !currentScope.contains(active)) {
        const preferred = currentScope === document.body
          ? document.querySelector<HTMLElement>('.movie-library-grid [data-movie-id] .movie-item-details-hit-area')
          : null;
        const first = preferred ?? focusables(currentScope)[0];
        if (first) focusAndReveal(first);
      }
    };

    const dispatchEscape = () => {
      (document.activeElement ?? document.body).dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    };
    const collapseSuggestion = () => {
      const expanded = document.activeElement?.closest('[data-tv-expanded="true"]');
      const toggle = expanded?.querySelector<HTMLElement>(".movie-item-details-hit-area");
      if (!toggle) return false;
      toggle.click(); return true;
    };
    const back = () => {
      if (collapseSuggestion()) return true;
      const scope = scopeForFocus();
      if (scope !== document.body) {
        if (scope instanceof HTMLDetailsElement) {
          scope.open = false;
          scope.querySelector<HTMLElement>("summary")?.focus();
        } else {
          const close = scope.querySelector<HTMLElement>('[data-tv-close],button[aria-label="Close details"],button[aria-label="Close movie picker"],button[aria-label="Close"],button[aria-label="Cancel"]');
          if (close) close.click();
          else dispatchEscape();
        }
        return true;
      }
      if (document.querySelector('.is-autocomplete-active,.y2k-library-search.is-expanded,.y2k-add-form.is-expanded')) {
        dispatchEscape();
        return true;
      }
      return false;
    };
    window.electronTvBack = back;

    const onKey = (event: KeyboardEvent) => {
      const audio = (window as Window & { _sharedAudioContext?: AudioContext })._sharedAudioContext;
      if (audio?.state === "suspended") void audio.resume().catch(() => {});
      // Existing form, autocomplete, and dialog Escape/Enter handlers keep their behavior.
      if (event.defaultPrevented) return;
      const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      if (DIRECTIONS.has(event.key)) {
        const editing = active?.matches('input,textarea,[contenteditable="true"]');
        if (editing && (event.key === "ArrowLeft" || event.key === "ArrowRight")) return;
        if (active?.matches('input[role="combobox"][aria-expanded="true"]') && (event.key === "ArrowUp" || event.key === "ArrowDown")) return;
        if (active?.matches('input[type="range"],select')) return;
        reconcile();
        const scope = scopeForFocus();
        const origin = document.activeElement as HTMLElement;
        let candidates = focusables(scope).filter(element => element !== origin);
        const from = origin.getBoundingClientRect();
        const grid = origin.closest(".movie-library-grid");
        if (grid) {
          const inGrid = candidates.filter(element => grid.contains(element) && Number.isFinite(spatialScore(from, element.getBoundingClientRect(), event.key as Direction)));
          if (inGrid.length) candidates = inGrid;
        }
        let best: HTMLElement | undefined;
        let score = Infinity;
        for (const candidate of candidates) {
          const value = spatialScore(from, candidate.getBoundingClientRect(), event.key as Direction);
          if (value < score) { score = value; best = candidate; }
        }
        if (best) focusAndReveal(best);
        event.preventDefault();
        event.stopPropagation();
      } else if (event.key === "Escape") {
        if (collapseSuggestion()) { event.preventDefault(); event.stopPropagation(); return; }
        // Handle Back before component listeners, without redispatching recursively.
        const scope = scopeForFocus();
        const close = scope !== document.body && scope.querySelector<HTMLElement>('[data-tv-close],button[aria-label="Close details"],button[aria-label="Close movie picker"]');
        if (scope instanceof HTMLDetailsElement) {
          scope.open = false;
          scope.querySelector<HTMLElement>("summary")?.focus();
          event.preventDefault(); event.stopPropagation();
        } else if (close) {
          close.click(); event.preventDefault(); event.stopPropagation();
        }
      } else if (event.key === "Enter" && active?.matches('[role="button"]:not(button),[role="gridcell"]')) {
        if (!event.repeat) active.click();
        event.preventDefault(); event.stopPropagation();
      } else if (event.key === "MediaPlayPause" || event.key === "MediaPlay" || event.key === "MediaPause") {
        if (event.repeat) { event.preventDefault(); return; }
        const media = document.querySelector<HTMLMediaElement>("video,audio");
        if (media) {
          if (event.key === "MediaPause" || (event.key === "MediaPlayPause" && !media.paused)) media.pause();
          else void media.play().catch(() => {});
        }
        window.dispatchEvent(new CustomEvent("electron-tv-media", { detail: event.key }));
        event.preventDefault();
      }
    };
    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement && currentScope.contains(event.target) && scopeForFocus() === currentScope) lastFocus = event.target;
    };
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(reconcile);
    });
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["hidden", "inert", "open", "aria-hidden", "disabled"] });
    frame = requestAnimationFrame(reconcile);
    // Capture directions before DriftWall's local roving focus can trap the remote in the wall.
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("focusin", onFocus);
    return () => {
      observer.disconnect(); cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("focusin", onFocus);
      delete window.electronTvBack;
    };
  }, [enabled]);
}
