import type { FC, RefObject } from 'react';
import { ELECTRON_LOGO_MARK_PATH } from '@/branding/logoAssets';
import UserSelection from '@/components/common/UserSelection';
import PlacesList from '@/components/places/PlacesList';
import Watchlist from '@/components/watchlist';
import type { MainTab } from '@/shared/types';
import type { WorkspaceMeta } from '@/app/shellState';

interface AppWorkspaceShellProps {
  isMobile: boolean;
  activeTab: MainTab;
  workspaceMeta: WorkspaceMeta;
  workspaceControlsRef: RefObject<HTMLDivElement | null>;
}

const AppWorkspaceShell: FC<AppWorkspaceShellProps> = ({
  isMobile,
  activeTab,
  workspaceMeta,
  workspaceControlsRef,
}) => {
  const modeClass = activeTab === 'queue' ? 'queue' : 'places';

  return (
    <main
      id="main-content"
      className={`workspace-stage workspace-stage--simplified${isMobile ? ' workspace-stage--mobile-shell' : ''}`}
      tabIndex={-1}
    >
      {isMobile ? (
        <header className="mobile-shell-header" aria-label="Profiles and app summary">
          <UserSelection variant="inline" className="mobile-shell-header__user-selection" />
          <div className="mobile-shell-header__facts" aria-label="Workspace summary">
            <span className="mobile-shell-header__fact-icon" aria-hidden="true">
              {workspaceMeta.icon}
            </span>
            <span className="mobile-shell-header__fact-eyebrow">{workspaceMeta.eyebrow}</span>
            <span className="mobile-shell-header__fact-title">{workspaceMeta.title}</span>
          </div>
        </header>
      ) : null}

      {!isMobile ? (
        <section
          className={`workspace-header workspace-header--simplified workspace-header--${modeClass}`}
          aria-label="Workspace controls"
        >
          <p className="workspace-header__brandline">
            <span className="workspace-header__brand-mark-shell" aria-hidden="true">
              <img
                src={ELECTRON_LOGO_MARK_PATH}
                alt=""
                className="workspace-header__brand-mark"
                draggable="false"
              />
            </span>
            <span className="workspace-header__brand-text">Electron</span>
          </p>
          <p className="workspace-header__active">
            <span className="workspace-header__active-icon">{workspaceMeta.icon}</span>
            {workspaceMeta.eyebrow}
          </p>
          <h1 className="workspace-header__title">
            <span className="workspace-header__title-icon" aria-hidden="true">
              {workspaceMeta.icon}
            </span>
            {workspaceMeta.title}
          </h1>
          <div ref={workspaceControlsRef} className="workspace-header__controls workspace-header__controls--toggle" />
        </section>
      ) : (
        <div
          ref={workspaceControlsRef}
          aria-hidden="true"
          className="workspace-header__controls workspace-header__controls--toggle"
          style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
        />
      )}

      <section
        className={`workspace-surface workspace-surface--${modeClass}`}
        aria-label="Primary workspace"
        style={{ minWidth: 0 }}
      >
        {activeTab === 'queue' ? <Watchlist isMobile={isMobile} /> : <PlacesList />}
      </section>
    </main>
  );
};

export default AppWorkspaceShell;
