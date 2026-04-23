import type { FC } from 'react';
import type { MainTab } from '@/shared/types';

interface FeatureItem {
  feature: string;
  type: string;
  detail: string;
  accent: 'primary' | 'support' | 'play';
  isActive?: boolean;
  onClick: () => void;
}

interface FeatureGroup {
  label: string;
  items: FeatureItem[];
}

interface WorkspaceFeatureDirectoryProps {
  activeTab: MainTab;
  currentUserLabel: string;
  onTabChange: (tab: MainTab) => void;
  onOpenMessages: () => void;
  onOpenMemories: () => void;
  onOpenQuiz: () => void;
  onOpenSpin: () => void;
  onOpenFavorites: () => void;
}

const WorkspaceFeatureDirectory: FC<WorkspaceFeatureDirectoryProps> = ({
  activeTab,
  currentUserLabel,
  onTabChange,
  onOpenMessages,
  onOpenMemories,
  onOpenQuiz,
  onOpenSpin,
  onOpenFavorites,
}) => {
  const featureGroups: FeatureGroup[] = [
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
    <section className="workspace-directory" aria-label="Feature organization">
      <div className={`workspace-directory__overview workspace-directory__overview--${activeTab}`}>
        <div className="workspace-directory__overview-copy">
          <span className="workspace-directory__eyebrow">Workspace</span>
          <h1 className="workspace-directory__title">
            {activeTab === 'queue' ? 'Movies by feature and type' : 'Places by feature and type'}
          </h1>
        </div>
        <div className="workspace-directory__status">
          <span className="workspace-directory__status-chip">
            {activeTab === 'queue' ? 'Queue surface' : 'Map surface'}
          </span>
          <span className="workspace-directory__status-copy">{currentUserLabel}</span>
        </div>
      </div>

      <div className="feature-directory">
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
      </div>
    </section>
  );
};

export default WorkspaceFeatureDirectory;
