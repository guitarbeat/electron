/**
 * useFabPosition — manages FAB position state with localStorage persistence
 * and viewport clamping. Separated from the UI component for testability.
 */
import { useState, useCallback } from "react";
import {
  clampFloatingControlPosition,
  getDockedFloatingControlPosition,
  type FloatingViewport,
} from "../floatingWorkspacePanelLayout";

const STORAGE_KEY = "floatingPanel.position";
const MOBILE_BREAKPOINT = 768;

// ── Viewport helpers ──────────────────────────────────────────────

const isMobileViewport = () =>
  typeof window !== "undefined" && window.innerWidth <= MOBILE_BREAKPOINT;

const getSafeAreaInset = (edge: "top" | "right" | "bottom" | "left"): number => {
  if (typeof window === "undefined") return 0;
  const v = getComputedStyle(document.documentElement).getPropertyValue(
    `--radial-safe-${edge}`,
  );
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

export const getViewportBox = (): FloatingViewport & { chromeTop: number } => {
  const vv = window.visualViewport;
  return {
    width: vv?.width ?? window.innerWidth,
    height: vv?.height ?? window.innerHeight,
    offsetLeft: vv?.offsetLeft ?? 0,
    offsetTop: vv?.offsetTop ?? 0,
    chromeTop: isMobileViewport() ? 0 : 92,
    insetTop: getSafeAreaInset("top"),
    insetRight: getSafeAreaInset("right"),
    insetBottom: getSafeAreaInset("bottom"),
    insetLeft: getSafeAreaInset("left"),
  };
};

// ── Persistence ───────────────────────────────────────────────────

const readStoredPos = (): { x: number; y: number } | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as { x?: unknown; y?: unknown };
    if (typeof p.x !== "number" || typeof p.y !== "number") return null;
    return { x: p.x, y: p.y };
  } catch {
    return null;
  }
};

const persistPos = (pos: { x: number; y: number }) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
  } catch {
    /* noop */
  }
};

// ── Clamping ──────────────────────────────────────────────────────

export const clampToViewport = (pos: { x: number; y: number }) =>
  typeof window === "undefined"
    ? pos
    : clampFloatingControlPosition(pos, getViewportBox());

// ── Hook ──────────────────────────────────────────────────────────

const getInitialPos = () => {
  if (typeof window === "undefined") return { x: 0, y: 0 };
  const stored = readStoredPos();
  return stored
    ? clampToViewport(stored)
    : getDockedFloatingControlPosition(getViewportBox());
};

export function useFabPosition() {
  const [pos, setPos] = useState(getInitialPos);

  const reclamp = useCallback(() => {
    setPos((prev) => clampToViewport(prev));
  }, []);

  const moveTo = useCallback((newPos: { x: number; y: number }) => {
    const clamped = clampToViewport(newPos);
    setPos(clamped);
    persistPos(clamped);
  }, []);

  return { pos, setPos, reclamp, moveTo } as const;
}
