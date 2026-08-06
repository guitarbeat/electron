import MagicToggle from "./MagicToggle";
import React, { useCallback } from 'react';
import './BentoWorkspaceController.css';
import type { MainTab } from '@/shared/types';
import type { AppNavStripStatus } from './AppNavStrip';

export interface WorkspaceChromeHeaderProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  pwaStatus?: AppNavStripStatus;
  onInstallApp?: () => void;
  onApplyUpdate?: () => void;
  onRetrySync?: () => void;
}

export type SortOrder = 'recent' | 'alpha' | 'rating';

export interface BentoStatTileConfig {
  id: string;
  label: string;
  count: number;
  icon: string;
  sectionId: string;
  tone?: 'default' | 'incoming' | 'completed';
}

export interface BentoSortChipConfig {
  value: SortOrder;
  label: string;
}

interface BentoWorkspaceControllerProps {
  children: React.ReactNode;
  stats: BentoStatTileConfig[];
  sorts: BentoSortChipConfig[];
  activeSortOrder: SortOrder;
  onSortChange: (order: SortOrder) => void;
  ariaLabel?: string;
}

interface StatTileProps {
  tile: BentoStatTileConfig;
}

const StatTile: React.FC<StatTileProps> = ({ tile }) => {
  const handleClick = useCallback(() => {
    const el = document.getElementById(tile.sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [tile.sectionId]);

  return (
    <button
      type="button"
      className={`bento-stat-tile bento-stat-tile--${tile.tone ?? 'default'}`}
      onClick={handleClick}
      aria-label={`${tile.count} ${tile.label} — tap to jump to section`}
    >
      <span className="bento-stat-tile__icon" aria-hidden="true">
        {tile.icon}
      </span>
      <span className="bento-stat-tile__body">
        <span
          className="bento-stat-tile__count"
          key={tile.count}
          aria-live="polite"
          aria-atomic="true"
        >
          {tile.count}
        </span>
        <span className="bento-stat-tile__label">{tile.label}</span>
      </span>
    </button>
  );
};

const BentoWorkspaceController: React.FC<BentoWorkspaceControllerProps> = ({
  children,
  stats,
  sorts,
  activeSortOrder,
  onSortChange,
  ariaLabel,
}) => {
  return (
    <section
      className="workspace-control-panel bento-ctrl"
      aria-label={ariaLabel}
    >
      <div className="bento-ctrl__search">{children}</div>

      {stats.length > 0 && (
        <>
          <div className="bento-ctrl__sep" aria-hidden="true" />
          <div
            className="bento-ctrl__stats"
            role="group"
            aria-label="Section counts"
          >
            {stats.map((tile) => (
              <StatTile key={tile.id} tile={tile} />
            ))}
          </div>
        </>
      )}

      {sorts.length > 0 && (
        <div
          className="bento-ctrl__sort"
          role="group"
          aria-label="Sort order"
        >
          <span className="bento-ctrl__sort-label" aria-hidden="true">
            Sort
          </span>
          <MagicToggle
            options={sorts}
            activeValue={activeSortOrder}
            onChange={onSortChange}
            ariaLabel="Sort order options"
          />
        </div>
      )}
    </section>
  );
};

export default BentoWorkspaceController;
