import React, { type FC } from 'react';
import type { MainTab, User } from '@/shared/types';
import WatchlistComponent from '../components/watchlist/index.tsx';
import './AppWorkspaceShell.css';

const PlacesList = React.lazy(() => import('@/components/places/PlacesList'));

interface AppWorkspaceShellProps {
  isMobile: boolean;
  activeTab: MainTab;
  currentUser: User | null;
}

const SURFACE_COPY: Record<
  MainTab,
  {
    eyebrow: string;
    title: string;
    body: string;
    detail: string;
    chip: string;
  }
> = {
  queue: {
    eyebrow: 'Tonight Queue',
    title: 'Keep the shortlist clear, tactile, and ready to play.',
    body: 'Movies stay in the spotlight while the shell carries the atmosphere around them.',
    detail: 'Add, scan, and decide without burying the posters under chrome.',
    chip: 'Film mode',
  },
  places: {
    eyebrow: 'Field Map',
    title: 'Treat saved places like a live route board, not a bulky dashboard.',
    body: 'The map leads, the list supports, and everything else stays out of the way.',
    detail: 'Review destinations, move quickly, and keep the scene readable on mobile.',
    chip: 'Scout mode',
  },
};

const AppWorkspaceShell: FC<AppWorkspaceShellProps> = ({
  isMobile,
  activeTab,
  currentUser,
}) => {
  const surfaceCopy = SURFACE_COPY[activeTab];

  return (
    <main
      id="main-content"
      className={`workspace-stage workspace-stage--simplified${isMobile ? ' workspace-stage--mobile-shell' : ''}`}
      tabIndex={-1}
    >
      <section className={`workspace-masthead workspace-masthead--${activeTab}`} aria-label="Workspace overview">
        <div className="workspace-masthead__copy">
          <p className="workspace-masthead__eyebrow">{surfaceCopy.eyebrow}</p>
          <h1 className="workspace-masthead__title">{surfaceCopy.title}</h1>
          <p className="workspace-masthead__body">{surfaceCopy.body}</p>
        </div>

        <div className="workspace-masthead__meta" aria-label="Current mode">
          <span className="workspace-masthead__chip">{surfaceCopy.chip}</span>
          <p className="workspace-masthead__detail">{surfaceCopy.detail}</p>
          <p className="workspace-masthead__session">
            {currentUser ? `${currentUser} is editing the shared board.` : 'Guest mode is read-only until a profile signs in.'}
          </p>
        </div>
      </section>

      <section
        className={`workspace-surface workspace-surface--${activeTab}`}
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
