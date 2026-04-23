import React, { type FC } from 'react';
import type { MainTab, User } from '@/shared/types';
import WatchlistComponent from '../components/watchlist/index.tsx';
import WorkspaceFeatureDirectory from '@/app/WorkspaceFeatureDirectory';

const PlacesList = React.lazy(() => import('@/components/places/PlacesList'));

interface AppWorkspaceShellProps {
  isMobile: boolean;
  activeTab: MainTab;
  currentUser: User | null;
  onTabChange: (tab: MainTab) => void;
  onOpenMessages: () => void;
  onOpenMemories: () => void;
  onOpenQuiz: () => void;
  onOpenSpin: () => void;
  onOpenFavorites: () => void;
}

const AppWorkspaceShell: FC<AppWorkspaceShellProps> = ({
  isMobile,
  activeTab,
  currentUser,
  onTabChange,
  onOpenMessages,
  onOpenMemories,
  onOpenQuiz,
  onOpenSpin,
  onOpenFavorites,
}) => {
  return (
    <main
      id="main-content"
      className={`workspace-stage workspace-stage--simplified${isMobile ? ' workspace-stage--mobile-shell' : ''}`}
      tabIndex={-1}
    >
      <WorkspaceFeatureDirectory
        activeTab={activeTab}
        currentUserLabel={currentUser ? `${currentUser} is editing the shared board.` : 'Guest session'}
        onTabChange={onTabChange}
        onOpenMessages={onOpenMessages}
        onOpenMemories={onOpenMemories}
        onOpenQuiz={onOpenQuiz}
        onOpenSpin={onOpenSpin}
        onOpenFavorites={onOpenFavorites}
      />

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
