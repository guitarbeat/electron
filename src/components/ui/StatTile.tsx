import React, { useCallback } from "react";
import "./StatTile.css";

export interface BentoStatTileConfig {
  id: string;
  label: string;
  count: number;
  icon: string;
  sectionId: string;
  tone?: "default" | "incoming" | "completed";
}

interface StatTileProps {
  tile: BentoStatTileConfig;
}

const StatTile: React.FC<StatTileProps> = ({ tile }) => {
  const handleClick = useCallback(() => {
    const el = document.getElementById(tile.sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [tile.sectionId]);

  return (
    <button
      type="button"
      className={`bento-stat-tile bento-stat-tile--${tile.tone ?? "default"}`}
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

export default StatTile;
