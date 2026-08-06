/**
 * FloatingWorkspacePanel — draggable FAB that expands into a glass command
 * panel with navigation, search, view modes, and quick actions.
 *
 * Architecture:
 *   useFabPosition  — position state + localStorage persistence
 *   useFabDrag      — pointer drag/tap discrimination
 *   FabToggleIcon   — animated sparkle ↔ X icon
 *   FabQuickActions — extensible action button row
 */
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AppNavStrip from "@/ui/AppNavStrip";
import ProfileMenu from "@/ui/ProfileMenu";
import { useAudio } from "@/hooks/useAudio";
import {
  getFloatingPanelPosition,
  type FloatingPanelPosition,
} from "../floatingWorkspacePanelLayout";
import MagicToggle, { type MagicToggleOption } from "../MagicToggle";
import type { MainTab } from "@/shared/types";

import { useFabPosition, getViewportBox, clampToViewport } from "./useFabPosition";
import { useFabDrag } from "./useFabDrag";
import FabToggleIcon from "./FabToggleIcon";
import FabQuickActions, { buildDefaultActions } from "./FabQuickActions";

import "@/app/WorkspaceTopbar.css";
import "../FloatingWorkspacePanel.css";

// ── Constants ─────────────────────────────────────────────────────

const DISCOVERED_KEY = "floatingPanel.discovered";

// ── Types ─────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────

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
  // ── Refs ──────────────────────────────────────────────────────
  const fabRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // ── State ─────────────────────────────────────────────────────
  const [isOpen, setIsOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState<FloatingPanelPosition>({
    left: 0,
    top: 0,
    placement: "above",
  });
  const [hasDiscovered, setHasDiscovered] = useState(() => {
    try {
      return window.localStorage.getItem(DISCOVERED_KEY) === "1";
    } catch {
      return false;
    }
  });

  // ── Position management ───────────────────────────────────────
  const { pos, reclamp, moveTo } = useFabPosition();
  const { playClick, playPop } = useAudio();

  // ── Panel positioning ─────────────────────────────────────────
  const positionPanel = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    setPanelPosition(
      getFloatingPanelPosition(
        pos,
        { width: panel.offsetWidth, height: panel.offsetHeight },
        getViewportBox(),
      ),
    );
  }, [pos]);

  useLayoutEffect(() => {
    if (isOpen) positionPanel();
  }, [isOpen, positionPanel]);

  // ── Toggle / close ────────────────────────────────────────────
  const markDiscovered = useCallback(() => {
    setHasDiscovered((prev) => {
      if (!prev) {
        try { window.localStorage.setItem(DISCOVERED_KEY, "1"); } catch { /* noop */ }
      }
      return true;
    });
  }, []);

  const toggle = useCallback(() => {
    reclamp();
    setIsOpen((prev) => {
      prev ? playClick() : playPop();
      return !prev;
    });
    markDiscovered();
  }, [reclamp, markDiscovered, playClick, playPop]);

  const close = useCallback(() => setIsOpen(false), []);

  // ── Drag behavior ─────────────────────────────────────────────
  const { isDragging, pointerHandlers } = useFabDrag({
    fabRef,
    onTap: toggle,
    onDragEnd: moveTo,
    onDragStart: close,
  });

  // ── Global listeners (outside click, resize, escape) ──────────
  useEffect(() => {
    const onOutside = (e: PointerEvent) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (!fabRef.current?.contains(t) && !panelRef.current?.contains(t)) close();
    };
    const onResize = () => {
      reclamp();
      if (isOpen) requestAnimationFrame(positionPanel);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

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
  }, [close, isOpen, positionPanel, reclamp]);

  // ── Quick actions ─────────────────────────────────────────────
  const handleAction = useCallback(
    (cb?: () => void) => { playClick(); cb?.(); close(); },
    [playClick, close],
  );

  const quickActions = useMemo(
    () =>
      buildDefaultActions({
        onMessages: () => handleAction(onOpenMessages),
        onQuiz: () => handleAction(onOpenQuiz),
        onSpin: () => handleAction(onOpenSpin),
      }),
    [handleAction, onOpenMessages, onOpenQuiz, onOpenSpin],
  );

  // ── Derived ───────────────────────────────────────────────────
  const hasViewModes =
    (viewModes?.length ?? 0) > 1 &&
    Boolean(activeViewMode) &&
    Boolean(onViewModeChange);

  // ── Render ────────────────────────────────────────────────────
  return (
    <div
      ref={fabRef}
      className={`fwp-fab ${isOpen ? "fwp-fab--open" : ""}`}
      style={{ left: pos.x, top: pos.y }}
      aria-label={ariaLabel ?? "Workspace controls"}
    >
      {/* Toggle button */}
      <button
        type="button"
        className={`fwp-toggle ${isOpen ? "fwp-toggle--active" : ""} ${isDragging ? "fwp-toggle--dragging" : ""} ${!hasDiscovered ? "discover-pulse" : ""}`}
        aria-label={isOpen ? "Close panel" : "Open workspace controls"}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        {...pointerHandlers}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
      >
        <FabToggleIcon isActive={isOpen} />
      </button>

      {/* Expanded panel */}
      <div
        ref={panelRef}
        className={`fwp-panel fwp-panel--${panelPosition.placement} ${isOpen ? "fwp-panel--open" : ""} bento-ctrl--${activeTab}`}
        style={{ left: panelPosition.left, top: panelPosition.top }}
        role="dialog"
        aria-label="Workspace controls panel"
        aria-hidden={!isOpen}
        inert={!isOpen}
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

        {/* Search slot */}
        <div className="fwp-panel__search bento-ctrl__search">
          {children}
        </div>

        {/* View mode toggle */}
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
        <FabQuickActions actions={quickActions} />
      </div>
    </div>
  );
};

export default FloatingWorkspacePanel;
