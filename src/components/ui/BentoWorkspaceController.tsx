import React from "react";
import StatTile, { type BentoStatTileConfig } from "./StatTile";
import MagicToggle, { type MagicToggleOption } from "./MagicToggle";
import "./BentoWorkspaceController.css";

export type SortOrder = "recent" | "alpha" | "rating";

export type BentoSortChipConfig = MagicToggleOption<SortOrder>;

export { type BentoStatTileConfig };

interface BentoWorkspaceControllerProps {
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
        <div className="bento-ctrl__sort">
          <span className="bento-ctrl__sort-label" aria-hidden="true">
            Sort
          </span>
          <MagicToggle<SortOrder>
            options={sorts}
            activeValue={activeSortOrder}
            onChange={onSortChange}
            ariaLabel="Sort order"
          />
        </div>
      )}
    </section>
  );
};

export default BentoWorkspaceController;
