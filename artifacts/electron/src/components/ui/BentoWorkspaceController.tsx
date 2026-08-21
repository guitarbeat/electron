import MagicToggle from "./MagicToggle";
import React from 'react';
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

import StatTile, { type BentoStatTileConfig } from "./StatTile";
export type { BentoStatTileConfig };

export interface BentoSortChipConfig {
  value: SortOrder;
  label: string;
}

export interface BentoWorkspaceControllerProps {
  children: React.ReactNode;
  stats: BentoStatTileConfig[];
  sorts: BentoSortChipConfig[];
  activeSortOrder: SortOrder;
  onSortChange: (order: SortOrder) => void;
  ariaLabel?: string;
}

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
