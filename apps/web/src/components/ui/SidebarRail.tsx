import React from "react";
import type { MainTab } from "@/shared/types";
import type { TogglePanel } from "@/app/AppWorkspaceShell";
import { isLibraryWorkspaceTab } from "@/utils/workspaceConfig";
import { ProfileMenu } from "./index";

// ── Icons ───────────────────────────────────────────────────────────────────

export const SearchIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7.5" />
    <line x1="21" y1="21" x2="16.5" y2="16.5" />
  </svg>
);

export const MoviesIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="2" y="3" width="20" height="18" rx="2.5" />
    <line x1="7" y1="3" x2="7" y2="21" />
    <line x1="17" y1="3" x2="17" y2="21" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="2" y1="7.5" x2="7" y2="7.5" />
    <line x1="2" y1="16.5" x2="7" y2="16.5" />
    <line x1="17" y1="7.5" x2="22" y2="7.5" />
    <line x1="17" y1="16.5" x2="22" y2="16.5" />
  </svg>
);

export const MessageIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

export const QuizIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9.5" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5" />
  </svg>
);

export const SpinIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9.5" />
    <path d="M12 2.5V12l6 3.5" />
    <circle cx="12" cy="12" r="2.5" fill="currentColor" fillOpacity="0.2" />
  </svg>
);

export const CloudOfflineIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M22.61 16.95A5 5 0 0 0 18 10h-1.26a8 8 0 0 0-7.05-6M5 5a8 8 0 0 0-4 7h1a5 5 0 0 0 8.2 3.8" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export const SyncRefreshIcon: React.FC<{ size?: number; spinning?: boolean }> = ({
  size = 16,
  spinning = false,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={spinning ? "sidebar-spin-animation" : ""}
    aria-hidden="true"
  >
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
  </svg>
);

export const DownloadAppIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export const SparklesIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 2l2.4 6.9L21.3 12l-6.9 3.1L12 22l-2.4-6.9L2.7 12l6.9-3.1L12 2z" />
  </svg>
);

// ── Types ───────────────────────────────────────────────────────────────────

export interface PwaStatus {
  isOnline: boolean;
  isStandalone: boolean;
  canInstall: boolean;
  hasUpdateReady: boolean;
  pendingSyncCount: number;
  blockedSyncCount: number;
}

export interface SidebarRailProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  pwaStatus?: PwaStatus;
  onInstallApp?: () => void;
  onApplyUpdate?: () => void;
  onRetrySync?: () => void;
  openPanels: Set<TogglePanel>;
  onTogglePanel: (panel: TogglePanel) => void;
  onSearchFocus?: () => void;
}

// ── Component_SidebarRail ───────────────────────────────────────────────────

export const SidebarRail: React.FC<SidebarRailProps> = ({
  activeTab,
  onTabChange,
  pwaStatus,
  onInstallApp,
  onApplyUpdate,
  onRetrySync,
  openPanels,
  onTogglePanel,
  onSearchFocus,
}) => {
  
  

  

  const isLibraryActive = isLibraryWorkspaceTab(activeTab);
  const isMessagesActive = openPanels.has("messages");
  const isQuizActive = openPanels.has("quiz");
  const isSpinActive = openPanels.has("spin");

  const hasSyncIssue = Boolean(
    pwaStatus && (pwaStatus.pendingSyncCount > 0 || pwaStatus.blockedSyncCount > 0)
  );
  const isOffline = pwaStatus && !pwaStatus.isOnline;
  const hasUpdate = Boolean(pwaStatus && pwaStatus.hasUpdateReady);
  const canInstall = Boolean(pwaStatus && pwaStatus.canInstall && !pwaStatus.isStandalone);

  
  
  
  

  return (
    <nav
      className="top-nav"
      aria-label="Main application navigation"
    >
      <div className="top-nav__left">
        <button
          type="button"
          className={`top-nav__item ${isLibraryActive ? "is-active" : ""}`}
          onClick={() => onTabChange("movies")}
          aria-label="Movies and Places workspace"
          aria-current={isLibraryActive ? "page" : undefined}
        >
          <span className="top-nav__item-icon">
            <MoviesIcon size={18} />
          </span>
          <span className="top-nav__item-label">Movies</span>
        </button>
      </div>

      <div className="top-nav__center">
        <button
          type="button"
          className="top-nav__item top-nav__item--search"
          onClick={onSearchFocus}
          aria-label="Search"
        >
          <span className="top-nav__item-icon">
            <SearchIcon size={18} />
          </span>
          <span className="top-nav__item-label">Search</span>
        </button>
      </div>

      <div className="top-nav__right">
        <button
          type="button"
          className={`top-nav__item ${isMessagesActive ? "is-toggled" : ""}`}
          onClick={() => onTogglePanel("messages")}
          aria-label="Messages"
        >
          <span className="top-nav__item-icon">
            <MessageIcon size={18} />
          </span>
        </button>
        <button
          type="button"
          className={`top-nav__item ${isQuizActive ? "is-toggled" : ""}`}
          onClick={() => onTogglePanel("quiz")}
          aria-label="Quiz"
        >
          <span className="top-nav__item-icon">
            <QuizIcon size={18} />
          </span>
        </button>
        <button
          type="button"
          className={`top-nav__item ${isSpinActive ? "is-toggled" : ""}`}
          onClick={() => onTogglePanel("spin")}
          aria-label="Spin"
        >
          <span className="top-nav__item-icon">
            <SpinIcon size={18} />
          </span>
        </button>

        {(isOffline || hasSyncIssue || hasUpdate || canInstall) && (
          <div className="top-nav__status-group">
            {isOffline && (
              <div className="top-nav__status-button is-offline" title="Offline">
                <CloudOfflineIcon size={15} />
              </div>
            )}
            {hasSyncIssue && (
              <button className="top-nav__status-button is-sync" onClick={onRetrySync}>
                <SyncRefreshIcon size={14} />
                <span>{pwaStatus?.pendingSyncCount ?? 0}</span>
              </button>
            )}
            {hasUpdate && (
              <button className="top-nav__status-button is-update" onClick={onApplyUpdate}>
                <SparklesIcon size={14} />
                Update
              </button>
            )}
            {canInstall && (
              <button className="top-nav__status-button is-install" onClick={onInstallApp}>
                <DownloadAppIcon size={14} />
                Install
              </button>
            )}
          </div>
        )}

        <div className="top-nav__profile">
          <ProfileMenu />
        </div>
      </div>
    </nav>
  );
};
