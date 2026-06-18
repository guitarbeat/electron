import React from "react";
import StatTile, { type BentoStatTileConfig } from "./StatTile";
import MagicToggle, { type MagicToggleOption } from "./MagicToggle";
import { useViewport } from "@/app/ViewportContext";
import "./BentoWorkspaceController.css";

export { type BentoStatTileConfig };

interface ViewModeControlsProps {
  viewModes: MagicToggleOption<string>[];
  activeViewMode: string;
  onViewModeChange: (mode: string) => void;
  viewModeAriaLabel?: string;
}

const ViewModeControls: React.FC<ViewModeControlsProps> = ({
  viewModes,
  activeViewMode,
  onViewModeChange,
  viewModeAriaLabel,
}) => (
  <div className="bento-ctrl__sort-row">
    <span className="bento-ctrl__sort-label" aria-hidden="true">
      View
    </span>
    <MagicToggle<string>
      options={viewModes}
      activeValue={activeViewMode}
      onChange={onViewModeChange}
      ariaLabel={viewModeAriaLabel ?? "Browse view"}
    />
  </div>
);

const StatTilesSkeleton: React.FC = () => (
  <>
    {(["incoming", "queue", "completed"] as const).map((id) => (
      <div
        key={id}
        className="bento-stat-tile bento-stat-tile--skeleton skeleton"
        aria-hidden="true"
      />
    ))}
  </>
);

interface BentoWorkspaceControllerProps<TSort extends string = string> {
  children: React.ReactNode;
  stats: BentoStatTileConfig[];
  statsLoading?: boolean;
  sorts: MagicToggleOption<TSort>[];
  activeSortOrder: TSort;
  onSortChange: (order: TSort) => void;
  ariaLabel?: string;
  viewModes?: MagicToggleOption<string>[];
  activeViewMode?: string;
  onViewModeChange?: (mode: string) => void;
  viewModeAriaLabel?: string;
  onOpenKeyboardHelp?: () => void;
}

function BentoWorkspaceController<TSort extends string>({
  children,
  stats,
  statsLoading = false,
  sorts,
  activeSortOrder,
  onSortChange,
  ariaLabel,
  viewModes,
  activeViewMode,
  onViewModeChange,
  viewModeAriaLabel,
  onOpenKeyboardHelp,
}: BentoWorkspaceControllerProps<TSort>) {
  const { isMobile } = useViewport();
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

      {statsLoading || stats.length > 0 ? (
        <>
          <div className="bento-ctrl__sep" aria-hidden="true" />
          <div
            className="bento-ctrl__stats"
            role="group"
            aria-label="Jump to section"
            aria-keyshortcuts="1 2 3"
            aria-busy={statsLoading || undefined}
          >
            {statsLoading ? (
              <StatTilesSkeleton />
            ) : (
              stats.map((tile) => <StatTile key={tile.id} tile={tile} />)
            )}
          </div>
        </>
      ) : null}

      {sorts.length > 0 && (
        <div
          className={`bento-ctrl__controls${hasViewModes ? " bento-ctrl__controls--split" : ""}`}
        >
          <div className="bento-ctrl__sort-row">
            <span className="bento-ctrl__sort-label" aria-hidden="true">
              Sort
            </span>
            <MagicToggle<TSort>
              options={sorts}
              activeValue={activeSortOrder}
              onChange={onSortChange}
              ariaLabel="Sort order"
            />
          </div>
          {hasViewModes && viewModes && activeViewMode && onViewModeChange ? (
            <ViewModeControls
              viewModes={viewModes}
              activeViewMode={activeViewMode}
              onViewModeChange={onViewModeChange}
              viewModeAriaLabel={viewModeAriaLabel}
            />
          ) : null}
        </div>
      )}

      {onOpenKeyboardHelp ? (
        <div className="bento-ctrl__shortcuts-row">
          <button
            type="button"
            className={`bento-ctrl__shortcuts-btn${isMobile ? " bento-ctrl__shortcuts-btn--compact" : ""}`}
            onClick={onOpenKeyboardHelp}
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts (?)"
          >
            <kbd className="bento-ctrl__shortcuts-kbd">?</kbd>
            {!isMobile ? <span>Shortcuts</span> : null}
          </button>
        </div>
      ) : null}
    </section>
  );
}

export default BentoWorkspaceController;
