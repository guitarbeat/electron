/**
 * SidebarRail — persistent left navigation rail (Disney+/HBO Max style).
 * Collapsed: 60px icon strip. Expanded: 200px with labels on hover.
 */
import React from "react";
import type { MainTab } from "@/shared/types";
import { USER_PHOTOS } from "@/shared/types";
import { useUser } from "@/app/useProviders";
import ProfileMenu from "@/ui/ProfileMenu";
import { MessageIcon } from "@/common/Icons";
import type { TogglePanel } from "@/app/AppWorkspaceShell";
import "./SidebarRail.css";

// ── Icons ─────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const PlusIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// ── Icons ─────────────────────────────────────────────────────────

const MoviesIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
    <line x1="7" y1="2" x2="7" y2="22" />
    <line x1="17" y1="2" x2="17" y2="22" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="2" y1="7" x2="7" y2="7" />
    <line x1="2" y1="17" x2="7" y2="17" />
    <line x1="17" y1="7" x2="22" y2="7" />
    <line x1="17" y1="17" x2="22" y2="17" />
  </svg>
);

const PlacesIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const QuizIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);

const SpinIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="2" x2="12" y2="12" />
    <line x1="12" y1="12" x2="20" y2="16" />
  </svg>
);

// ── Types ─────────────────────────────────────────────────────────

interface PwaStatus {
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

// ── Component ─────────────────────────────────────────────────────

const SidebarRail: React.FC<SidebarRailProps> = ({
  activeTab,
  onTabChange,
  openPanels,
  onTogglePanel,
  onSearchFocus,
}) => {
  const { currentUser } = useUser();

  return (
    <nav className="sidebar-rail" aria-label="Main navigation">
      {/* Brand */}
      <div className="sidebar-rail__brand">
        <span className="sidebar-rail__brand-glyph">◈</span>
        <span className="sidebar-rail__brand-label">Electron</span>
      </div>

      {/* Search + Add */}
      <div className="sidebar-rail__section sidebar-rail__section--search">
        <button
          type="button"
          className="sidebar-rail__item"
          onClick={onSearchFocus}
          aria-label="Search"
        >
          <span className="sidebar-rail__icon"><SearchIcon /></span>
          <span className="sidebar-rail__label">Search</span>
        </button>

        <button
          type="button"
          className="sidebar-rail__item sidebar-rail__item--accent"
          onClick={onSearchFocus}
          aria-label="Add movie"
        >
          <span className="sidebar-rail__icon"><PlusIcon /></span>
          <span className="sidebar-rail__label">Add</span>
        </button>
      </div>

      {/* Primary tabs */}
      <div className="sidebar-rail__section sidebar-rail__section--tabs">
        <button
          type="button"
          className={`sidebar-rail__item ${activeTab === "movies" ? "sidebar-rail__item--active" : ""}`}
          onClick={() => onTabChange("movies")}
          aria-label="Movies"
          aria-current={activeTab === "movies" ? "page" : undefined}
        >
          <span className="sidebar-rail__icon"><MoviesIcon /></span>
          <span className="sidebar-rail__label">Movies</span>
        </button>

        <button
          type="button"
          className={`sidebar-rail__item ${activeTab === "places" ? "sidebar-rail__item--active" : ""}`}
          onClick={() => onTabChange("places")}
          aria-label="Places"
          aria-current={activeTab === "places" ? "page" : undefined}
        >
          <span className="sidebar-rail__icon"><PlacesIcon /></span>
          <span className="sidebar-rail__label">Places</span>
        </button>
      </div>

      {/* Toggle panels */}
      <div className="sidebar-rail__section sidebar-rail__section--actions">
        <button
          type="button"
          className={`sidebar-rail__item ${openPanels.has("messages") ? "sidebar-rail__item--toggled" : ""}`}
          onClick={() => onTogglePanel("messages")}
          aria-label="Messages"
          aria-pressed={openPanels.has("messages")}
        >
          <span className="sidebar-rail__icon"><MessageIcon size={22} /></span>
          <span className="sidebar-rail__label">Messages</span>
        </button>

        <button
          type="button"
          className={`sidebar-rail__item ${openPanels.has("quiz") ? "sidebar-rail__item--toggled" : ""}`}
          onClick={() => onTogglePanel("quiz")}
          aria-label="Quiz"
          aria-pressed={openPanels.has("quiz")}
        >
          <span className="sidebar-rail__icon"><QuizIcon /></span>
          <span className="sidebar-rail__label">Quiz</span>
        </button>

        <button
          type="button"
          className={`sidebar-rail__item ${openPanels.has("spin") ? "sidebar-rail__item--toggled" : ""}`}
          onClick={() => onTogglePanel("spin")}
          aria-label="Spin"
          aria-pressed={openPanels.has("spin")}
        >
          <span className="sidebar-rail__icon"><SpinIcon /></span>
          <span className="sidebar-rail__label">Spin</span>
        </button>
      </div>

      {/* Profiles (pushed to bottom) */}
      <div className="sidebar-rail__section sidebar-rail__section--bottom">
        <div className="sidebar-rail__profiles">
          <img
            src={USER_PHOTOS.Aaron}
            alt="Aaron"
            className={`sidebar-rail__avatar ${currentUser === "Aaron" ? "sidebar-rail__avatar--active" : ""}`}
            draggable="false"
          />
          <img
            src={USER_PHOTOS.Electra}
            alt="Electra"
            className={`sidebar-rail__avatar ${currentUser === "Electra" ? "sidebar-rail__avatar--active" : ""}`}
            draggable="false"
          />
        </div>
        <div className="sidebar-rail__profile-item">
          <ProfileMenu />
        </div>
      </div>
    </nav>
  );
};

export default SidebarRail;
