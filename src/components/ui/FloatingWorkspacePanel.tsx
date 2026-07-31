import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import AppNavStrip from "@/ui/AppNavStrip";
import ProfileMenu from "@/ui/ProfileMenu";
import RadialFabToggleIcon from "@/components/effects/RadialFabToggleIcon";
import { useAudio } from "@/hooks/useAudio";
import {
  clampPositionToViewport,
  getDockedPositionForViewport,
  getRadialMenuMetricsForWidth,
  MOBILE_BREAKPOINT,
} from "@/components/effects/lib/radialMenuLayout";
import MagicToggle, { type MagicToggleOption } from "./MagicToggle";
import { MessageIcon } from "@/common/Icons";
import type { MainTab } from "@/shared/types";
import "@/app/WorkspaceTopbar.css";
import "./FloatingWorkspacePanel.css";

const QuizIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);

const SpinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="2" x2="12" y2="12" />
    <line x1="12" y1="12" x2="20" y2="16" />
  </svg>
);

const STORAGE_KEY = "floatingPanel.position";
const DISCOVERED_KEY = "floatingPanel.discovered";
const FAB_SIZE = 52;

interface PwaStatus {
  isOnline: boolean;
  isStandalone: boolean;
  canInstall: boolean;
  hasUpdateReady: boolean;
  pendingSyncCount: number;
  blockedSyncCount: number;
}

export interface FloatingWorkspacePanelProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  pwaStatus?: PwaStatus;
  onInstallApp?: () => void;
  onApplyUpdate?: () => void;
  onRetrySync?: () => void;
  ariaLabel?: string;
  viewModes?: MagicToggleOption<string>[];
  activeViewMode?: string;
  onViewModeChange?: (mode: string) => void;
  viewModeAriaLabel?: string;
  onOpenMessages?: () => void;
  onOpenQuiz?: () => void;
  onOpenSpin?: () => void;
  children?: React.ReactNode;
}

// ── Helpers (mirrors RadialMenu) ────────────────────────────────────

const isMobileViewport = () =>
  typeof window !== "undefined" && window.innerWidth <= MOBILE_BREAKPOINT;

const getSafeAreaInset = (edge: "top" | "right" | "bottom" | "left"): number => {
  if (typeof window === "undefined") return 0;
  const v = getComputedStyle(document.documentElement).getPropertyValue(`--radial-safe-${edge}`);
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

const getViewportBox = () => {
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

const getMetrics = () => getRadialMenuMetricsForWidth(window.innerWidth);

const readStoredPos = (): { x: number; y: number } | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as { x?: unknown; y?: unknown };
    if (typeof p.x !== "number" || typeof p.y !== "number") return null;
    return { x: p.x, y: p.y };
  } catch { return null; }
};

const clamp = (pos: { x: number; y: number }) =>
  typeof window === "undefined"
    ? pos
    : clampPositionToViewport(pos, getViewportBox(), getMetrics());

const getInitialPos = () => {
  if (typeof window === "undefined") return { x: 0, y: 0 };
  const stored = readStoredPos();
  return stored ? clamp(stored) : getDockedPositionForViewport(getViewportBox(), getMetrics());
};

const persistPos = (pos: { x: number; y: number }) => {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pos)); } catch { /* noop */ }
};

/** Which side has more space — panel expands toward the open area */
const getPanelDirection = (pos: { x: number; y: number }): "up" | "down" | "left" | "right" => {
  if (typeof window === "undefined") return "up";
  const vb = getViewportBox();
  const cx = pos.x + FAB_SIZE / 2;
  const cy = pos.y + FAB_SIZE / 2;
  const spaceRight = vb.width - cx;
  const spaceLeft = cx;
  const spaceDown = vb.height - cy;
  const spaceUp = cy;
  const max = Math.max(spaceRight, spaceLeft, spaceDown, spaceUp);
  if (max === spaceUp) return "up";
  if (max === spaceDown) return "down";
  if (max === spaceRight) return "right";
  return "left";
};

// ── Component ───────────────────────────────────────────────────────

const FloatingWorkspacePanel: React.FC<FloatingWorkspacePanelProps> = ({
  activeTab,
  onTabChange,
  pwaStatus,
  onInstallApp,
  onApplyUpdate,
  onRetrySync,
  ariaLabel,
  viewModes,
  activeViewMode,
  onViewModeChange,
  viewModeAriaLabel,
  onOpenMessages,
  onOpenQuiz,
  onOpenSpin,
  children,
}) => {
  const fabRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState(getInitialPos);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDiscovered, setHasDiscovered] = useState(() => {
    try { return window.localStorage.getItem(DISCOVERED_KEY) === "1"; } catch { return false; }
  });
  const { playClick, playPop } = useAudio();

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragPointerIdRef = useRef<number | null>(null);
const DRAG_THRESHOLD = 8;

  const panelDir = getPanelDirection(pos);
  const hasViewModes = (viewModes?.length ?? 0) > 1 && Boolean(activeViewMode) && Boolean(onViewModeChange);

  const markDiscovered = useCallback(() => {
    setHasDiscovered((prev) => {
      if (!prev) { try { window.localStorage.setItem(DISCOVERED_KEY, "1"); } catch { /* noop */ } }
      return true;
    });
  }, []);

  const toggle = useCallback(() => {
    setPos((prev) => clamp(prev));
    setIsOpen((prev) => {
      prev ? playClick() : playPop();
      return !prev;
    });
    markDiscovered();
  }, [markDiscovered, playClick, playPop]);

  const close = useCallback(() => setIsOpen(false), []);

  // ── Drag ────────────────────────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    dragPointerIdRef.current = e.pointerId;
    isDraggingRef.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (dragPointerIdRef.current !== e.pointerId) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.hypot(dx, dy) > DRAG_THRESHOLD && !isDraggingRef.current) {
      isDraggingRef.current = true;
      setIsDragging(true);
      setIsOpen(false);
      e.preventDefault();
    }
    if (!isDraggingRef.current || !fabRef.current) return;
    e.preventDefault();
    const newX = e.clientX - FAB_SIZE / 2;
    const newY = e.clientY - FAB_SIZE / 2;
    fabRef.current.style.left = `${newX}px`;
    fabRef.current.style.top = `${newY}px`;
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (dragPointerIdRef.current !== null && dragPointerIdRef.current !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (dragPointerIdRef.current === null) return;
    const wasDragging = isDraggingRef.current;
    if (!wasDragging) {
      toggle();
    } else if (fabRef.current) {
      const left = parseFloat(fabRef.current.style.left || "0");
      const top = parseFloat(fabRef.current.style.top || "0");
      const clamped = clamp({ x: left, y: top });
      fabRef.current.style.left = `${clamped.x}px`;
      fabRef.current.style.top = `${clamped.y}px`;
      setPos(clamped);
      persistPos(clamped);
    }
    isDraggingRef.current = false;
    setIsDragging(false);
    dragPointerIdRef.current = null;
  }, [toggle]);

  // ── Global listeners ─────────────────────────────────────────────
  useEffect(() => {
    const onOutside = (e: PointerEvent) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (!fabRef.current?.contains(t) && !panelRef.current?.contains(t)) close();
    };
    const onResize = () => setPos((prev) => clamp(prev));
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onOutside);
    return () => {
      document.removeEventListener("pointerdown", onOutside);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
    };
  }, [close]);

  const handleAction = (cb?: () => void) => { playClick(); cb?.(); close(); };

  const quickActions = [
    { label: "Messages", icon: <MessageIcon size={18} />, color: "teal", onClick: () => handleAction(onOpenMessages) },
    { label: "Quiz",     icon: <QuizIcon />,              color: "violet", onClick: () => handleAction(onOpenQuiz) },
    { label: "Spin",     icon: <SpinIcon />,              color: "amber",  onClick: () => handleAction(onOpenSpin) },
  ] as const;

  return (
    <div
        ref={fabRef}
        className={`fwp-fab fwp-fab--dir-${panelDir} ${isOpen ? "fwp-fab--open" : ""}`}
        style={{ left: pos.x, top: pos.y }}
        aria-label={ariaLabel ?? "Workspace controls"}
      >
        <button
          type="button"
          className={`fwp-toggle ${isOpen ? "fwp-toggle--active" : ""} ${isDragging ? "fwp-toggle--dragging" : ""} ${!hasDiscovered ? "discover-pulse" : ""}`}
          aria-label={isOpen ? "Close panel" : "Open workspace controls"}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
          }}
        >
          <RadialFabToggleIcon isActive={isOpen} />
        </button>

        {/* ── Floating panel ── */}
        <div
          ref={panelRef}
          className={`fwp-panel fwp-panel--${panelDir} ${isOpen ? "fwp-panel--open" : ""} bento-ctrl--${activeTab}`}
          role="dialog"
          aria-label="Workspace controls panel"
          aria-hidden={!isOpen}
        >
          {/* Nav + Profile */}
          <div className="fwp-panel__topbar">
            <div className="fwp-panel__nav app-header__left">
              <AppNavStrip
                activeTab={activeTab}
                onTabChange={onTabChange}
                status={pwaStatus}
                onInstallApp={onInstallApp}
                onApplyUpdate={onApplyUpdate}
                onRetrySync={onRetrySync}
              />
            </div>
            <div className="fwp-panel__profile app-header__right">
              <ProfileMenu />
            </div>
          </div>

          {/* Search */}
          <div className="fwp-panel__search bento-ctrl__search">
            {children}
          </div>

          {/* View modes */}
          {hasViewModes && viewModes && activeViewMode && onViewModeChange && (
            <div className="fwp-panel__viewmodes">
              <MagicToggle
                options={viewModes}
                activeValue={activeViewMode}
                onChange={onViewModeChange}
                ariaLabel={viewModeAriaLabel ?? "Browse view"}
              />
            </div>
          )}

          {/* Quick actions */}
          <div className="fwp-panel__actions">
            {quickActions.map((a) => (
              <button
                key={a.label}
                type="button"
                className={`fwp-action fwp-action--${a.color}`}
                onClick={a.onClick}
                aria-label={a.label}
                title={a.label}
              >
                <span className="fwp-action__icon">{a.icon}</span>
                <span className="fwp-action__label">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
  );
};

export default FloatingWorkspacePanel;
