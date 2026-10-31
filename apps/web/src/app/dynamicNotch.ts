import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

/** The four frame notches. Only one may be expanded at a time. */
export type NotchName = "search" | "add" | "settings" | "profiles";

const EXPAND_EVENT = "dynamic-notch:expand";

/** Tell the other notches that `name` is expanding, so they collapse. */
export function announceNotchExpand(name: NotchName) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<NotchName>(EXPAND_EVENT, { detail: name }));
}

/**
 * While `open`, announces this notch as the expanded one and collapses it when another
 * notch announces itself.
 */
export function useExclusiveNotch(name: NotchName, open: boolean, collapse: () => void) {
  const collapseRef = useRef(collapse);
  collapseRef.current = collapse;
  useEffect(() => {
    if (!open) return;
    announceNotchExpand(name);
    const onExpand = (event: Event) => {
      if ((event as CustomEvent<NotchName>).detail !== name) collapseRef.current();
    };
    window.addEventListener(EXPAND_EVENT, onExpand);
    return () => window.removeEventListener(EXPAND_EVENT, onExpand);
  }, [name, open]);
}

/** Publishes an element's rendered height as a root CSS length so a notch body can grow around it. */
export function useNotchContentHeight(ref: RefObject<HTMLElement | null>, variable: string, active: boolean) {
  useLayoutEffect(() => {
    const element = ref.current;
    if (!active || !element) return;
    const root = document.documentElement;
    const publish = () => root.style.setProperty(variable, `${Math.ceil(element.getBoundingClientRect().height)}px`);
    publish();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(publish);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, variable, active]);
}

const GHOST_MS = 220;

/**
 * Leaves a fading, inert copy of panel content behind when it unmounts, so the notch can
 * fade its content out while the shape collapses instead of emptying at once.
 */
export function leaveNotchGhost(node: HTMLElement | null, host: HTMLElement | null) {
  if (!node || !host?.isConnected || typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const root = document.documentElement;
  if (root.classList.contains("is-tv-runtime") || root.classList.contains("is-silk-browser")) return;
  const ghost = node.cloneNode(true) as HTMLElement;
  ghost.removeAttribute("id");
  ghost.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
  ghost.setAttribute("aria-hidden", "true");
  ghost.setAttribute("inert", "");
  ghost.classList.add("dyn-notch-ghost");
  const width = node.getBoundingClientRect().width;
  if (width) ghost.style.width = `${width}px`;
  host.appendChild(ghost);
  window.setTimeout(() => ghost.remove(), GHOST_MS);
}
