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

/**
 * The five interactive frame corner notches in the Y2K viewport border.
 * Only one notch may be in an expanded state at a given time.
 */
export type NotchName = "search" | "add" | "settings" | "profiles" | "activities";

const EXPAND_EVENT = "dynamic-notch:expand";
const COLLAPSE_ALL_EVENT = "dynamic-notch:collapse-all";

/**
 * Broadcasts an event notifying other notches that `name` is expanding,
 * causing any currently expanded notch to automatically collapse.
 *
 * @param name The NotchName currently expanding
 */
export function announceNotchExpand(name: NotchName) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<NotchName>(EXPAND_EVENT, { detail: name }));
}

/**
 * Global trigger to collapse whichever notch is currently expanded
 * (for example, when clicking the background scrim or pressing Escape).
 */
export function collapseAllNotches() {
  if (typeof window === "undefined") return;
  playXmbCue("cancel");
  window.dispatchEvent(new CustomEvent(COLLAPSE_ALL_EVENT));
}

/**
 * React hook that enforces exclusive notch expansion. While `open` is true,
 * it broadcasts this notch as active and registers listeners to collapse it
 * when another notch expands or a global collapse is requested.
 *
 * @param name The notch identifier
 * @param open Whether this notch is currently expanded
 * @param collapse Callback function to collapse this notch
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

/**
 * Measures the rendered height of a panel element and publishes it as a CSS
 * custom property on document element so notch bodies can dynamically size around content.
 *
 * @param ref Ref to the panel HTML element
 * @param variable The CSS variable name to update (e.g. "--dyn-panel-h")
 * @param active Whether measurement is currently active
 */
export function useNotchContentHeight(ref: RefObject<HTMLElement | null>, variable: string, active: boolean) {
  useLayoutEffect(() => {
    const element = ref.current;
    const root = document.documentElement;

    if (!active || !element) {
      root.style.setProperty(variable, "0px");
      return;
    }

    const publish = () => {
      root.style.setProperty(variable, `${Math.ceil(element.getBoundingClientRect().height)}px`);
    };

    publish();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(publish);
    observer.observe(element);

    return () => observer.disconnect();
  }, [ref, variable, active]);
}

/**
 * Helper to locate the corresponding difference-blended SVG frame notch for a host element.
 */
function resolveFrameNotch(host: HTMLElement | null): HTMLElement | null {
  if (!host || typeof document === "undefined") return null;
  const notchName =
    host.dataset.notch ?? host.querySelector<HTMLElement>("[data-notch]")?.dataset.notch;
  if (!notchName) return null;
  return document.querySelector<HTMLElement>(`.viewport-frame .dyn-notch[data-notch="${notchName}"]`);
}

/**
 * Adds tactile magnetic cursor physics (`--dyn-pull-x`, `--dyn-pull-y`) and press
 * compression (`--dyn-press`) to a notch element and its frame notch counterpart.
 *
 * @param hostRef Ref to the notch container element
 */
export function useNotchMagneticPhysics(hostRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = hostRef.current;
    if (!el || typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const setVar = (name: string, value: string) => {
      el.style.setProperty(name, value);
      resolveFrameNotch(el)?.style.setProperty(name, value);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const nx = Math.max(-1, Math.min(1, (event.clientX - cx) / (rect.width * 0.6)));
      const ny = Math.max(-1, Math.min(1, (event.clientY - cy) / (rect.height * 0.6)));
      setVar("--dyn-pull-x", `${(nx * 5).toFixed(2)}px`);
      setVar("--dyn-pull-y", `${(ny * 4).toFixed(2)}px`);
    };

    const handlePointerDown = () => {
      setVar("--dyn-press", "1");
    };

    const resetPress = () => {
      setVar("--dyn-press", "0");
    };

    const handlePointerLeave = () => {
      setVar("--dyn-pull-x", "0px");
      setVar("--dyn-pull-y", "0px");
      setVar("--dyn-press", "0");
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

/**
 * Options for configuring interactive drag and click handlers on a `.dyn-notch__grip` handle.
 */
export interface NotchGripOptions {
  /** Edge orientation of the notch ("top" or "bottom") */
  edge: "top" | "bottom";
  /** Current expansion state */
  isOpen: boolean;
  /** Callback fired when drag or click triggers notch expansion */
  onOpen: () => void;
  /** Callback fired when drag or click triggers notch collapse */
  onClose: () => void;
  /** Ref to the host container element */
  hostRef?: RefObject<HTMLElement | null>;
}

/**
 * Hook providing pointer event handlers (`onClick`, `onPointerDown`, etc.) for notch grip handles
 * to enable both click-to-toggle and live drag-to-expand/collapse gestures.
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
    const host = hostRef?.current ?? null;
    host?.style.removeProperty("--dyn-drag-h");
    host?.removeAttribute("data-dragging");
    const frameNotch = resolveFrameNotch(host);
    frameNotch?.style.removeProperty("--dyn-drag-h");
    frameNotch?.removeAttribute("data-dragging");
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
        // Synthetic pointer events in tests may not implement setPointerCapture
      }
    },
    [],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const state = dragStateRef.current;
      if (!state || state.pointerId !== event.pointerId) return;
      const rawDy = event.clientY - state.startY;
      const directionalDelta = edge === "top" ? rawDy : -rawDy;

      if (Math.abs(directionalDelta) > 5) {
        state.moved = true;
      }
      state.delta = directionalDelta;

      if (hostRef?.current && state.moved) {
        const clamped = Math.max(-72, Math.min(96, directionalDelta));
        const px = `${Math.round(clamped)}px`;
        hostRef.current.setAttribute("data-dragging", "true");
        hostRef.current.style.setProperty("--dyn-drag-h", px);

        const frameNotch = resolveFrameNotch(hostRef.current);
        frameNotch?.setAttribute("data-dragging", "true");
        frameNotch?.style.setProperty("--dyn-drag-h", px);
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
const GHOST_STRIPPED_ATTRIBUTES = [
  "data-notch-panel",
  "role",
  "aria-modal",
  "aria-labelledby",
  "aria-describedby",
] as const;

/**
 * Leaves a temporary inert clone of panel content behind when unmounting, allowing
 * the notch to smoothly fade out its content during shape collapse.
 *
 * @param node The panel element being unmounted
 * @param host The host container element to attach the ghost clone to
 */
export function leaveNotchGhost(node: HTMLElement | null, host: HTMLElement | null) {
  if (!node || !host?.isConnected || typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const ghost = node.cloneNode(true) as HTMLElement;
  ghost.removeAttribute("id");
  ghost.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));

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
