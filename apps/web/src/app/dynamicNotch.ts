import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { playXmbCue, playXmbOpen, playXmbSelect } from "@/services/xmbAudio";

/** The four frame notches. Only one may be expanded at a time. */
export type NotchName = "search" | "add" | "settings" | "profiles";

const EXPAND_EVENT = "dynamic-notch:expand";
const COLLAPSE_ALL_EVENT = "dynamic-notch:collapse-all";

/** Tell the other notches that `name` is expanding, so they collapse. */
export function announceNotchExpand(name: NotchName) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<NotchName>(EXPAND_EVENT, { detail: name }));
}

/** Collapse whichever notch is currently open (e.g., when clicking the dimmed scrim). */
export function collapseAllNotches() {
  if (typeof window === "undefined") return;
  playXmbCue("cancel");
  window.dispatchEvent(new CustomEvent(COLLAPSE_ALL_EVENT));
}

/**
 * While `open`, announces this notch as the expanded one and collapses it when another
 * notch announces itself or when a global scrim collapse is triggered.
 */
export function useExclusiveNotch(name: NotchName, open: boolean, collapse: () => void) {
  const collapseRef = useRef(collapse);
  collapseRef.current = collapse;
  useEffect(() => {
    if (!open) return;
    playXmbOpen();
    announceNotchExpand(name);
    const onExpand = (event: Event) => {
      if ((event as CustomEvent<NotchName>).detail !== name) collapseRef.current();
    };
    const onCollapseAll = () => {
      collapseRef.current();
    };
    window.addEventListener(EXPAND_EVENT, onExpand);
    window.addEventListener(COLLAPSE_ALL_EVENT, onCollapseAll);
    return () => {
      window.removeEventListener(EXPAND_EVENT, onExpand);
      window.removeEventListener(COLLAPSE_ALL_EVENT, onCollapseAll);
    };
  }, [name, open]);
}

/** Publishes an element's rendered height as a root CSS length so a notch body can grow around it. */
export function useNotchContentHeight(ref: RefObject<HTMLElement | null>, variable: string, active: boolean) {
  useLayoutEffect(() => {
    const element = ref.current;
    const root = document.documentElement;
    if (!active || !element) {
      root.style.setProperty(variable, "0px");
      return;
    }
    const publish = () => root.style.setProperty(variable, `${Math.ceil(element.getBoundingClientRect().height)}px`);
    publish();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(publish);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, variable, active]);
}

/**
 * Adds tactile magnetic pull (--dyn-pull-x, --dyn-pull-y) and press compression (--dyn-press)
 * to a corner notch host element.
 */
export function useNotchMagneticPhysics(hostRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = hostRef.current;
    if (!el || typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const nx = Math.max(-1, Math.min(1, (event.clientX - cx) / (rect.width * 0.6)));
      const ny = Math.max(-1, Math.min(1, (event.clientY - cy) / (rect.height * 0.6)));
      el.style.setProperty("--dyn-pull-x", `${(nx * 5).toFixed(2)}px`);
      el.style.setProperty("--dyn-pull-y", `${(ny * 4).toFixed(2)}px`);
    };

    const handlePointerDown = () => {
      el.style.setProperty("--dyn-press", "1");
    };

    const resetPress = () => {
      el.style.setProperty("--dyn-press", "0");
    };

    const handlePointerLeave = () => {
      el.style.setProperty("--dyn-pull-x", "0px");
      el.style.setProperty("--dyn-pull-y", "0px");
      el.style.setProperty("--dyn-press", "0");
    };

    el.addEventListener("pointermove", handlePointerMove, { passive: true });
    el.addEventListener("pointerdown", handlePointerDown, { passive: true });
    el.addEventListener("pointerup", resetPress, { passive: true });
    el.addEventListener("pointercancel", handlePointerLeave, { passive: true });
    el.addEventListener("pointerleave", handlePointerLeave, { passive: true });

    return () => {
      el.removeEventListener("pointermove", handlePointerMove);
      el.removeEventListener("pointerdown", handlePointerDown);
      el.removeEventListener("pointerup", resetPress);
      el.removeEventListener("pointercancel", handlePointerLeave);
      el.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [hostRef]);
}

export interface NotchGripOptions {
  edge: "top" | "bottom";
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  hostRef?: RefObject<HTMLElement | null>;
}

/**
 * Provides click-to-toggle and pointer drag-to-expand/collapse behavior for a `.dyn-notch__grip` handle.
 */
export function useNotchGripDrag({
  edge,
  isOpen,
  onOpen,
  onClose,
  hostRef,
}: NotchGripOptions) {
  const dragStateRef = useRef<{
    pointerId: number;
    startY: number;
    moved: boolean;
    delta: number;
  } | null>(null);

  const clearDragStyle = useCallback(() => {
    hostRef?.current?.style.removeProperty("--dyn-drag-h");
    hostRef?.current?.removeAttribute("data-dragging");
  }, [hostRef]);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      event.stopPropagation();
      dragStateRef.current = {
        pointerId: event.pointerId,
        startY: event.clientY,
        moved: false,
        delta: 0,
      };
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Synthetic events in tests may not implement setPointerCapture.
      }
    },
    [],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const state = dragStateRef.current;
      if (!state || state.pointerId !== event.pointerId) return;
      const rawDy = event.clientY - state.startY;
      // Positive delta means pulling outward into the screen; negative means pushing back toward the corner.
      const directionalDelta = edge === "top" ? rawDy : -rawDy;
      if (Math.abs(directionalDelta) > 5) {
        state.moved = true;
      }
      state.delta = directionalDelta;
      if (hostRef?.current && state.moved) {
        const clamped = Math.max(-72, Math.min(96, directionalDelta));
        hostRef.current.setAttribute("data-dragging", "true");
        hostRef.current.style.setProperty("--dyn-drag-h", `${Math.round(clamped)}px`);
      }
    },
    [edge, hostRef],
  );

  const finishDrag = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const state = dragStateRef.current;
      if (!state || state.pointerId !== event.pointerId) return;
      dragStateRef.current = null;
      clearDragStyle();
      try {
        if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      } catch {
        // Ignore capture release errors
      }
      if (!state.moved) return;
      event.preventDefault();
      event.stopPropagation();
      if (!isOpen && state.delta >= 24) {
        playXmbSelect();
        onOpen();
      } else if (isOpen && state.delta <= -24) {
        playXmbCue("cancel");
        onClose();
      }
    },
    [clearDragStyle, isOpen, onClose, onOpen],
  );

  const onClick = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      event.stopPropagation();
      if (isOpen) {
        playXmbCue("cancel");
        onClose();
      } else {
        playXmbSelect();
        onOpen();
      }
    },
    [isOpen, onClose, onOpen],
  );

  return {
    onClick,
    onPointerDown,
    onPointerMove,
    onPointerUp: finishDrag,
    onPointerCancel: () => {
      dragStateRef.current = null;
      clearDragStyle();
    },
  };
}

const GHOST_MS = 220;
const GHOST_STRIPPED_ATTRIBUTES = ["data-notch-panel", "role", "aria-modal", "aria-labelledby", "aria-describedby"] as const;

/**
 * Leaves a fading, inert copy of panel content behind when it unmounts, so the notch can
 * fade its content out while the shape collapses instead of emptying at once.
 */
export function leaveNotchGhost(node: HTMLElement | null, host: HTMLElement | null) {
  if (!node || !host?.isConnected || typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const ghost = node.cloneNode(true) as HTMLElement;
  ghost.removeAttribute("id");
  ghost.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
  // The copy must not read as a second open panel to queries, TV focus scoping or assistive tech.
  for (const element of [ghost, ...Array.from(ghost.querySelectorAll<HTMLElement>("*"))]) {
    for (const name of GHOST_STRIPPED_ATTRIBUTES) element.removeAttribute(name);
  }
  ghost.setAttribute("aria-hidden", "true");
  ghost.setAttribute("inert", "");
  ghost.classList.add("dyn-notch-ghost");
  const width = node.getBoundingClientRect().width;
  if (width) ghost.style.width = `${width}px`;
  host.appendChild(ghost);
  window.setTimeout(() => ghost.remove(), GHOST_MS);
}
