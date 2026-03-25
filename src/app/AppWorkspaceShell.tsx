import type { FC, RefObject } from 'react';
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
  workspaceMeta: _workspaceMeta,
  workspaceControlsRef,
}) => {
  void _workspaceMeta;
  const modeClass = activeTab === 'queue' ? 'queue' : 'places';

  return (
    <main
      id="main-content"
      className={`workspace-stage workspace-stage--simplified${isMobile ? ' workspace-stage--mobile-shell' : ''}`}
      tabIndex={-1}
    >
      {!isMobile ? (
        // Desktop: keep an invisible dock target so the action bubble can position itself.
        // We avoid the full workspace header to make desktop match the mobile layout.
        <div
          ref={workspaceControlsRef}
          aria-hidden="true"
          className="workspace-header__controls workspace-header__controls--toggle"
          style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
        />
      ) : (
        // Mobile: no meaningful dock target (preserves existing behavior for pointer/tap docking).
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
        {activeTab === 'queue' ? (
          <Watchlist
            isMobile={isMobile}
          />
        ) : (
          <PlacesList />
        )}
      </section>
    </main>
  );
};

export default AppWorkspaceShell;
