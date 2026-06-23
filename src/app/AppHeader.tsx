import type { FC } from "react";
import { useState, useRef, useEffect } from "react";
import type { MainTab } from "@/shared/types";
import { useAppHeaderSlot } from "@/app/AppHeaderContext";
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
  onOpenMessages?: () => void;
  onOpenQuiz?: () => void;
}

const AppHeader: FC<AppHeaderProps> = ({
  activeTab,
  onTabChange,
  pwaStatus,
  onInstallApp,
  onApplyUpdate,
  onRetrySync,
  onOpenSpin,
  onOpenMessages,
  onOpenQuiz,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const slot = useAppHeaderSlot();

  useEffect(() => {
    if (!slot) return;
    slot.setCenterNode(centerRef.current);
    return () => slot.setCenterNode(null);
  }, [slot]);

  return (
    <header
      ref={headerRef}
      className={`app-header app-header--${activeTab}${isMenuOpen ? " is-profile-menu-open" : ""}${slot?.hasSearch ? " app-header--has-search" : ""}`}
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
          onOpenMessages={onOpenMessages}
          onOpenQuiz={onOpenQuiz}
        />
      </div>

      <div
        ref={centerRef}
        className={`app-header__center${slot?.hasSearch ? " app-header__center--search" : ""}`}
      />

      <div className="app-header__right">
        <ProfileMenu onOpenChange={setIsMenuOpen} />
      </div>
    </header>
  );
};

export default AppHeader;
