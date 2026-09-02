import React, { useCallback } from "react";
import {
  CardTiltShell,
  CardTiltSheen,
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
  isCompact = false,
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

  const accentColor = "#ec4899"; // Pink / Fuchsia neon wheel accent

  return (
    <div
      className={`movie-item-container spin-drift-card-container ${className}`.trim()}
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
      <CardTiltShell disabled={isCompact}>
        <Card
          variant="default"
          className="movie-item-card chroma-card spin-drift-card"
          onClick={handleOpen}
          style={{
            padding: 0,
            overflow: "hidden",
            borderColor: `${accentColor}55`,
            cursor: "pointer",
          }}
        >
          <CardTiltSheen />
          <MediaCardPosterWrap className="movie-item-poster-wrap">
            {/* Background art poster for spin wheel */}
            <div
              className="spin-drift-card__art"
              style={{
                backgroundImage: "url(/movie-spin-cover.svg)",
              }}
            />

            {/* Cinematic gradient overlay */}
            <div className="spin-drift-card__vignette" />

            {/* Dynamic Content Overlay */}
            <div className="spin-drift-card__content">
              <div className="spin-drift-card__top-badge">
                <span
                  className="spin-drift-card__pill"
                  style={{
                    borderColor: `${accentColor}88`,
                    color: "#ffffff",
                    backgroundColor: `${accentColor}33`,
                  }}
                >
                  🎰 SPIN &amp; WIN
                </span>
              </div>

              <div className="spin-drift-card__bottom-info">
                <div className="spin-drift-card__title">
                  Spin the Wheel
                </div>
                <div className="spin-drift-card__subtitle">
                  Can&apos;t decide? Let fate choose
                </div>

                <div
                  className="spin-drift-card__cta"
                  style={{
                    backgroundColor: `${accentColor}28`,
                    borderColor: `${accentColor}77`,
                  }}
                >
                  <span
                    className="spin-drift-card__cta-dot"
                    style={{ backgroundColor: accentColor }}
                  />
                  <span>Spin Now</span>
                </div>
              </div>
            </div>

            {/* Transparent click hit area */}
            <button
              type="button"
              className="movie-item-details-hit-area"
              onClick={handleOpen}
              aria-label="Open spin & match movie wheel"
            />
          </MediaCardPosterWrap>
        </Card>
      </CardTiltShell>
    </div>
  );
};

export default SpinDriftCard;
