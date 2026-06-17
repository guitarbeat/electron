import React from "react";
import StatTile, { type BentoStatTileConfig } from "./StatTile";
import MagicToggle, { type MagicToggleOption } from "./MagicToggle";
import { mediaBreakpoints, useMediaQuery } from "@/hooks/useMediaQuery";
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
  viewModes?: MagicToggleOption<string>[];
  activeViewMode?: string;
  onViewModeChange?: (mode: string) => void;
  viewModeAriaLabel?: string;
}

const BentoWorkspaceController: React.FC<BentoWorkspaceControllerProps> = ({
  children,
  stats,
  sorts,
  activeSortOrder,
  onSortChange,
  ariaLabel,
  viewModes,
  activeViewMode,
  onViewModeChange,
  viewModeAriaLabel,
}) => {
  const isMobile = useMediaQuery(mediaBreakpoints.sm);
  const hasViewModes =
    Boolean(viewModes?.length) &&
    Boolean(activeViewMode) &&
    Boolean(onViewModeChange);

  return (
    <section
      className={`workspace-control-panel bento-ctrl${isMobile ? " bento-ctrl--mobile" : ""}`}
      aria-label={ariaLabel}
    >
      <div className="bento-ctrl__search">{children}</div>

      {stats.length > 0 && (
        <>
          <div className="bento-ctrl__sep" aria-hidden="true" />
          <div
            className="bento-ctrl__stats"
            role="group"
            aria-label="Jump to section"
          >
            {stats.map((tile) => (
              <StatTile key={tile.id} tile={tile} />
            ))}
          </div>
        </>
      )}

      {sorts.length > 0 && (
        <div
          className={`bento-ctrl__controls${hasViewModes ? " bento-ctrl__controls--split" : ""}`}
        >
          <div className="bento-ctrl__sort-row">
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
          {hasViewModes ? (
            <div className="bento-ctrl__sort-row">
              <span className="bento-ctrl__sort-label" aria-hidden="true">
                View
              </span>
              <MagicToggle<string>
                options={viewModes!}
                activeValue={activeViewMode!}
                onChange={onViewModeChange!}
                ariaLabel={viewModeAriaLabel ?? "Browse view"}
              />
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
};

export default BentoWorkspaceController;
