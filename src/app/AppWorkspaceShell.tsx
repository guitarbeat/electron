import React, { type FC } from 'react';
import type { User } from '@/shared/types';
import type { MainTab } from '@/shared/types';
import { getWorkspaceMeta } from '@/app/shellState';

const PlacesList = React.lazy(() => import('@/components/places/PlacesList'));
import WatchlistComponent from '@/components/watchlist/index';

interface AppWorkspaceShellProps {
  isMobile: boolean;
  activeTab: MainTab;
  currentUser: User | null;
}

const getWorkspaceSummary = (activeTab: MainTab, currentUser: User | null) => {
  if (activeTab === 'queue') {
    return currentUser
      ? 'Queue titles, notes, and spin-off rituals from one shared movie space.'
      : 'Guest mode can still add titles to the shared watchlist and send suggestions.';
  }

  return currentUser
    ? 'Collect date ideas, pin the good ones, and keep the shortlist aligned.'
    : 'Browse the shared places board and leave suggestions for the session.';
};

const getWorkspaceCue = (activeTab: MainTab, currentUser: User | null) => {
  if (activeTab === 'queue') {
    return currentUser ? 'Start with the title field below.' : 'Use the composer to send a suggestion.';
  }

  return currentUser ? 'Use the map and search below.' : 'Browse first, then suggest a place.';
};

const AppWorkspaceShell: FC<AppWorkspaceShellProps> = ({ isMobile, activeTab, currentUser }) => {
  const workspaceMeta = getWorkspaceMeta(activeTab);
  const titleId = `${activeTab}-workspace-title`;
  const descriptionId = `${activeTab}-workspace-description`;
  const profileLabel = currentUser ?? 'Guest mode';

  return (
    <main id="main-content" className={`workspace-stage workspace-stage--simplified${isMobile ? ' workspace-stage--mobile-shell' : ''}`} tabIndex={-1}>
      <header className={`workspace-hero workspace-hero--${activeTab}`}>
        <div className="workspace-hero__copy">
          <p className="workspace-hero__eyebrow">
            {workspaceMeta.eyebrow} workspace
          </p>
          <h1 id={titleId} className="workspace-hero__title">
            {workspaceMeta.title}
          </h1>
          <p id={descriptionId} className="workspace-hero__description">
            {getWorkspaceSummary(activeTab, currentUser)}
          </p>
        </div>

        <div className="workspace-hero__meta" aria-label="Workspace status">
          <span className="workspace-hero__status">{profileLabel}</span>
          <span className="workspace-hero__cue">{getWorkspaceCue(activeTab, currentUser)}</span>
        </div>
      </header>

      <section
        className={`workspace-surface workspace-surface--${activeTab}`}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        style={{ minWidth: 0 }}
      >
        {activeTab === 'queue' ? (
          <WatchlistComponent isMobile={isMobile} />
        ) : (
          <React.Suspense fallback={null}>
            <PlacesList />
          </React.Suspense>
        )}
      </section>
    </main>
  );
};

export default AppWorkspaceShell;
