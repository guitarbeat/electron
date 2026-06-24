import React from "react";
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
}

function BentoWorkspaceController({
  children,
  ariaLabel,
  viewModes,
  activeViewMode,
  onViewModeChange,
  viewModeAriaLabel,
  activeTab,
  onTabChange,
  pwaStatus,
  onInstallApp,
  onApplyUpdate,
  onRetrySync,
}: BentoWorkspaceControllerProps) {
  const { isMobile } = useViewport();
  const hasViewModes =
    (viewModes?.length ?? 0) > 1 &&
    Boolean(activeViewMode) &&
    Boolean(onViewModeChange);

  return (
    <section
      className={`workspace-control-panel bento-ctrl bento-ctrl--${activeTab}${isMobile ? " bento-ctrl--mobile" : ""}`}
      aria-label={ariaLabel}
    >
      <header className="bento-ctrl__topbar" role="banner">
        <div className="bento-ctrl__topbar-left app-header__left">
          <AppNavStrip
            activeTab={activeTab}
            onTabChange={onTabChange}
            status={pwaStatus}
            onInstallApp={onInstallApp}
            onApplyUpdate={onApplyUpdate}
            onRetrySync={onRetrySync}
          />
        </div>
        <div className="bento-ctrl__topbar-right app-header__right">
          <ProfileMenu />
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
    </section>
  );
}

export default BentoWorkspaceController;
