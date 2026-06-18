import React, { useState } from "react";
import type { MainTab } from "@/shared/types";
import AppNavStrip from "@/ui/AppNavStrip";
import ProfileMenu from "@/ui/ProfileMenu";
import { useViewport } from "@/app/ViewportContext";
import MagicToggle, { type MagicToggleOption } from "./MagicToggle";
import "@/app/WorkspaceTopbar.css";
import "./BentoWorkspaceController.css";

export interface WorkspaceChromeHeaderProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  onOpenMessages?: () => void;
  onOpenQuiz?: () => void;
  pwaStatus?: {
    isOnline: boolean;
    isStandalone: boolean;
    canInstall: boolean;
    hasUpdateReady: boolean;
    pendingSyncCount: number;
    blockedSyncCount: number;
  };
  onInstallApp?: () => void;
  onApplyUpdate?: () => void;
  onRetrySync?: () => void;
  onOpenSpin?: () => void;
}

interface ViewModeControlsProps {
  viewModes: MagicToggleOption<string>[];
  activeViewMode: string;
  onViewModeChange: (mode: string) => void;
  viewModeAriaLabel?: string;
}

const ViewModeControls: React.FC<ViewModeControlsProps> = ({
  viewModes,
  activeViewMode,
  onViewModeChange,
  viewModeAriaLabel,
}) => (
  <div className="bento-ctrl__sort-row">
    <MagicToggle<string>
      options={viewModes}
      activeValue={activeViewMode}
      onChange={onViewModeChange}
      ariaLabel={viewModeAriaLabel ?? "Browse view"}
    />
  </div>
);

interface BentoWorkspaceControllerProps extends WorkspaceChromeHeaderProps {
  children: React.ReactNode;
  ariaLabel?: string;
  viewModes?: MagicToggleOption<string>[];
  activeViewMode?: string;
  onViewModeChange?: (mode: string) => void;
  viewModeAriaLabel?: string;
  onOpenKeyboardHelp?: () => void;
}

function BentoWorkspaceController({
  children,
  ariaLabel,
  viewModes,
  activeViewMode,
  onViewModeChange,
  viewModeAriaLabel,
  onOpenKeyboardHelp,
  activeTab,
  onTabChange,
  onOpenMessages,
  onOpenQuiz,
  pwaStatus,
  onInstallApp,
  onApplyUpdate,
  onRetrySync,
  onOpenSpin,
}: BentoWorkspaceControllerProps) {
  const { isMobile } = useViewport();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const hasViewModes =
    (viewModes?.length ?? 0) > 1 &&
    Boolean(activeViewMode) &&
    Boolean(onViewModeChange);

  return (
    <section
      className={`workspace-control-panel bento-ctrl bento-ctrl--${activeTab}${isMobile ? " bento-ctrl--mobile" : ""}${isMenuOpen ? " is-profile-menu-open" : ""}`}
      aria-label={ariaLabel}
    >
      <header className="bento-ctrl__topbar" role="banner">
        <div className="bento-ctrl__topbar-left app-header__left">
          <AppNavStrip
            activeTab={activeTab}
            onTabChange={onTabChange}
            onOpenSpin={onOpenSpin}
            onOpenMessages={onOpenMessages}
            onOpenQuiz={onOpenQuiz}
            status={pwaStatus}
            onInstallApp={onInstallApp}
            onApplyUpdate={onApplyUpdate}
            onRetrySync={onRetrySync}
          />
        </div>
        <div className="bento-ctrl__topbar-right app-header__right">
          <ProfileMenu onOpenChange={setIsMenuOpen} />
        </div>
      </header>

      <div className="bento-ctrl__topbar-sep" aria-hidden="true" />

      <div className="bento-ctrl__search">{children}</div>

      {hasViewModes && viewModes && activeViewMode && onViewModeChange ? (
        <div className="bento-ctrl__controls">
          <ViewModeControls
            viewModes={viewModes}
            activeViewMode={activeViewMode}
            onViewModeChange={onViewModeChange}
            viewModeAriaLabel={viewModeAriaLabel}
          />
        </div>
      ) : null}

      {onOpenKeyboardHelp && !isMobile ? (
        <div className="bento-ctrl__shortcuts-row">
          <button
            type="button"
            className="bento-ctrl__shortcuts-btn"
            onClick={onOpenKeyboardHelp}
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts (?)"
          >
            <kbd className="bento-ctrl__shortcuts-kbd">?</kbd>
            {!isMobile ? <span>Shortcuts</span> : null}
          </button>
        </div>
      ) : null}
    </section>
  );
}

export default BentoWorkspaceController;
