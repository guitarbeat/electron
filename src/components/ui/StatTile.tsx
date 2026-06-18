import React, { useCallback } from "react";
import { scrollToWorkspaceSection } from "@/utils/scrollToWorkspaceSection";
import { useViewport } from "@/app/ViewportContext";
import "./StatTile.css";

export interface BentoStatTileConfig {
  id: string;
  label: string;
  navLabel?: string;
  shortcutKey?: string;
  count: number;
  sectionId: string;
  tone?: "default" | "incoming" | "completed";
  isActive?: boolean;
  isDisabled?: boolean;
}

interface StatTileProps {
  tile: BentoStatTileConfig;
}

const StatTile: React.FC<StatTileProps> = ({ tile }) => {
  const { isMobile } = useViewport();
  const isDisabled = tile.isDisabled ?? tile.count === 0;
  const navLabel = tile.navLabel ?? tile.label;

  const handleClick = useCallback(() => {
    if (isDisabled) {
      return;
    }
    scrollToWorkspaceSection(tile.sectionId);
  }, [isDisabled, tile.sectionId]);

  return (
    <button
      type="button"
      className={`bento-stat-tile bento-stat-tile--${tile.tone ?? "default"}${
        tile.isActive ? " is-active" : ""
      }${isDisabled ? " is-disabled" : ""}`}
      onClick={handleClick}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-current={tile.isActive ? "true" : undefined}
      title={navLabel !== tile.label ? navLabel : undefined}
      aria-label={
        isDisabled
          ? `${tile.count} ${navLabel} — section empty`
          : tile.count === 0
            ? `Jump to ${navLabel} section`
            : tile.shortcutKey && !isMobile
              ? `${tile.count} ${navLabel} — jump to section, press ${tile.shortcutKey}`
              : `${tile.count} ${navLabel} — jump to section`
      }
    >
      {!isMobile && tile.shortcutKey && !isDisabled ? (
        <span className="bento-stat-tile__key" aria-hidden="true">
          {tile.shortcutKey}
        </span>
      ) : null}
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

export default StatTile;
