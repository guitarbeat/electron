import type { FC } from "react";
import { useState, useRef } from "react";
import type { MainTab } from "@/shared/types";
import AppNavStrip from "@/ui/AppNavStrip";
import ProfileMenu from "@/ui/ProfileMenu";
import "./AppHeader.css";

interface AppHeaderProps {
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
  onOpenSpin?: () => void;
}

const AppHeader: FC<AppHeaderProps> = ({
  activeTab,
  onTabChange,
  pwaStatus,
  onInstallApp,
  onApplyUpdate,
  onRetrySync,
  onOpenSpin,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  return (
    <header
      ref={headerRef}
      className={`app-header app-header--${activeTab}${isMenuOpen ? " is-profile-menu-open" : ""}`}
      role="banner"
    >
      <div className="app-header__left">
        <AppNavStrip
          activeTab={activeTab}
          onTabChange={onTabChange}
          onOpenSpin={onOpenSpin}
          status={pwaStatus}
          onInstallApp={onInstallApp}
          onApplyUpdate={onApplyUpdate}
          onRetrySync={onRetrySync}
        />
      </div>

      <div className="app-header__right">
        <ProfileMenu onOpenChange={setIsMenuOpen} />
      </div>
    </header>
  );
};

export default AppHeader;
