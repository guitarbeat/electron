import React, { useCallback } from "react";
import {
  Card,
  MediaCardPosterWrap,
} from "@/components/ui";

export interface SpinDriftCardProps {
  isCompact?: boolean;
  onOpenSpin?: () => void;
  className?: string;
  isSpinCard?: boolean;
  "data-spin-card"?: boolean;
}

export const SpinDriftCard: React.FC<SpinDriftCardProps> = ({
  onOpenSpin,
  className = "",
}) => {
  const handleOpen = useCallback(
    (e?: React.MouseEvent | React.KeyboardEvent) => {
      if (e) {
        e.stopPropagation();
      }
      if (onOpenSpin) {
        onOpenSpin();
      } else if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("open-spin-experience"));
      }
    },
    [onOpenSpin],
  );

  return (
    <div
      className={`movie-item-container promo-drift-card-wrap spin-drift-card-container ${className}`.trim()}
      data-spin-card="true"
      data-height-ratio="1"
      onClick={handleOpen}
      role="button"
      tabIndex={0}
      aria-label="Open spin & match movie wheel"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleOpen(e);
        }
      }}
      style={{ cursor: "pointer" }}
    >
      <Card
        variant="default"
        className="movie-item-card promo-drift-card spin-drift-card"
        onClick={handleOpen}
        style={{
          padding: 0,
          overflow: "hidden",
          cursor: "pointer",
        }}
      >
        <MediaCardPosterWrap className="movie-item-poster-wrap">
          <div className="promo-drift-card__body promo-drift-card__body--spin">
            <div className="promo-drift-card__icon-wrap">
              <span className="promo-drift-card__emoji" aria-hidden="true">
                🎡
              </span>
            </div>
            <div className="promo-drift-card__text-block">
              <span className="promo-drift-card__badge">Feature</span>
              <div className="promo-drift-card__title">Spin Wheel</div>
              <div className="promo-drift-card__hint">Random movie picker</div>
            </div>
          </div>

          <button
            type="button"
            className="movie-item-details-hit-area"
            onClick={handleOpen}
            aria-label="Open spin & match movie wheel"
          />
        </MediaCardPosterWrap>
      </Card>
    </div>
  );
};

export default SpinDriftCard;
