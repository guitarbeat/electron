import React, { type FC } from 'react';
import type { MainTab, User } from '@/shared/types';
import WatchlistComponent from '../components/watchlist/index.tsx';
import './AppWorkspaceShell.css';

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

interface FeatureTile {
  feature: string;
  type: string;
  detail: string;
  accent: 'primary' | 'support' | 'play';
  isActive?: boolean;
  onClick?: () => void;
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
  onTabChange,
  onOpenMessages,
  onOpenMemories,
  onOpenQuiz,
  onOpenSpin,
  onOpenFavorites,
}) => {
  const surfaceCopy = SURFACE_COPY[activeTab];
  const featureGroups: Array<{ label: string; items: FeatureTile[] }> = [
    {
      label: 'Browse by feature',
      items: [
        {
          feature: 'Movies',
          type: 'Queue',
          detail: 'Shared shortlist and posters',
          accent: 'primary',
          isActive: activeTab === 'queue',
          onClick: () => onTabChange('queue'),
        },
        {
          feature: 'Places',
          type: 'Map',
          detail: 'Saved destinations and route view',
          accent: 'primary',
          isActive: activeTab === 'places',
          onClick: () => onTabChange('places'),
        },
      ],
    },
    {
      label: 'Shared tools by type',
      items: [
        {
          feature: 'Messages',
          type: 'Conversation',
          detail: 'Check-ins and quick notes',
          accent: 'support',
          onClick: onOpenMessages,
        },
        {
          feature: 'Memories',
          type: 'Archive',
          detail: 'Pinned moments and annotations',
          accent: 'support',
          onClick: onOpenMemories,
        },
        {
          feature: 'Favorites',
          type: 'Collection',
          detail: 'Starred movies and places',
          accent: 'support',
          onClick: onOpenFavorites,
        },
      ],
    },
    {
      label: 'Play by type',
      items: [
        {
          feature: 'Quiz',
          type: 'Personality',
          detail: 'Compatibility and profile flow',
          accent: 'play',
          onClick: onOpenQuiz,
        },
        {
          feature: 'Spin',
          type: 'Chance game',
          detail: 'Randomize the next pick',
          accent: 'play',
          onClick: onOpenSpin,
        },
      ],
    },
  ];

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

      <section className="feature-directory" aria-label="Feature organization">
        {featureGroups.map((group) => (
          <div key={group.label} className="feature-directory__group">
            <p className="feature-directory__label">{group.label}</p>
            <div className="feature-directory__items">
              {group.items.map((item) => (
                <button
                  key={`${group.label}-${item.feature}`}
                  type="button"
                  className={`feature-tile feature-tile--${item.accent}${item.isActive ? ' is-active' : ''}`}
                  onClick={item.onClick}
                  aria-pressed={item.isActive ? true : undefined}
                >
                  <span className="feature-tile__feature">{item.feature}</span>
                  <span className="feature-tile__type">{item.type}</span>
                  <span className="feature-tile__detail">{item.detail}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
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
