import React, { forwardRef } from "react";
import { useResilientImage } from "@/hooks/useResilientImage";
import "@/app/styles/y2k-image.css";

export interface Y2kPlaceholderGraphicProps {
  title?: string;
  year?: string;
  badgeLabel?: string;
  className?: string;
  statusLabel?: string;
}

/**
 * Themed Y2K-inspired retro-futuristic placeholder graphic with CRT scanlines,
 * HUD crosshairs, glowing badge, and holographic film reel icon.
 */
export const Y2kPlaceholderGraphic: React.FC<Y2kPlaceholderGraphicProps> = ({
  title,
  year,
  badgeLabel = "Y2K // CAT_NET",
  className = "",
  statusLabel = "SIGNAL LOST // RECOVERY MODE",
}) => {
  return (
    <div
      className={`y2k-placeholder-graphic ${className}`}
      data-testid="y2k-placeholder-graphic"
      role="img"
      aria-label={title ? `${title} placeholder` : "Media placeholder"}
    >
      {/* CRT Scanlines Overlay */}
      <div className="y2k-placeholder-graphic__scanlines" aria-hidden="true" />

      {/* Cyber HUD Corner Crosshairs */}
      <div className="y2k-placeholder-graphic__corner y2k-placeholder-graphic__corner--tl" aria-hidden="true" />
      <div className="y2k-placeholder-graphic__corner y2k-placeholder-graphic__corner--tr" aria-hidden="true" />
      <div className="y2k-placeholder-graphic__corner y2k-placeholder-graphic__corner--bl" aria-hidden="true" />
      <div className="y2k-placeholder-graphic__corner y2k-placeholder-graphic__corner--br" aria-hidden="true" />

      {/* Retro Status Badge */}
      <div className="y2k-placeholder-graphic__badge">
        <span className="y2k-placeholder-graphic__badge-dot" aria-hidden="true" />
        <span>{badgeLabel}</span>
      </div>

      {/* Centerpiece Vector Icon */}
      <div className="y2k-placeholder-graphic__icon-wrap">
        <svg
          className="y2k-placeholder-graphic__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Retro Film Reel / Holographic Disc Graphic */}
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 3v6" />
          <path d="M12 15v6" />
          <path d="M3 12h6" />
          <path d="M15 12h6" />
          <circle cx="7" cy="7" r="1" fill="currentColor" />
          <circle cx="17" cy="7" r="1" fill="currentColor" />
          <circle cx="7" cy="17" r="1" fill="currentColor" />
          <circle cx="17" cy="17" r="1" fill="currentColor" />
        </svg>
      </div>

      {/* Body: Title and Metadata */}
      <div className="y2k-placeholder-graphic__body">
        {title && <p className="y2k-placeholder-graphic__title">{title}</p>}
        {year && <span className="y2k-placeholder-graphic__meta">[{year}]</span>}
        <span className="y2k-placeholder-graphic__status-tag">{statusLabel}</span>
      </div>
    </div>
  );
};

export interface ResilientImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "onError" | "onLoad"> {
  fallbackSrc?: string;
  seed?: string;
  title?: string;
  year?: string;
  catFallback?: boolean;
  showSkeleton?: boolean;
  badgeLabel?: string;
  statusLabel?: string;
  containerClassName?: string;
  onLoad?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  onError?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  renderFallback?: (props: {
    title?: string;
    year?: string;
    seed?: string;
    badgeLabel?: string;
  }) => React.ReactNode;
}

/**
 * Resilient Image Wrapper Component (`ResilientImage` / `Y2kImage`):
 * Automatically intercepts `onError` loading failures, smoothly transitions to
 * The Cat API fallback poster, and falls back to a themed Y2K vector graphic
 * if external image sources are inaccessible.
 */
export const ResilientImage = forwardRef<HTMLImageElement, ResilientImageProps>(
  (
    {
      src,
      alt = "",
      className = "",
      containerClassName = "",
      fallbackSrc,
      seed,
      title,
      year,
      catFallback = true,
      showSkeleton = true,
      badgeLabel,
      statusLabel,
      onLoad,
      onError,
      renderFallback,
      loading = "lazy",
      decoding = "async",
      ...restProps
    },
    ref
  ) => {
    const {
      currentSrc,
      isPrimary,
      isCatFallback,
      isGraphicPlaceholder,
      isLoading,
      handleLoad,
      handleError,
    } = useResilientImage({
      src,
      fallbackSrc,
      seed: seed || title || alt,
      catFallback,
      onLoad,
      onError,
    });

    if (isGraphicPlaceholder) {
      if (renderFallback) {
        return (
          <div className={`y2k-image-container ${containerClassName}`}>
            {renderFallback({ title, year, seed, badgeLabel })}
          </div>
        );
      }
      return (
        <div className={`y2k-image-container ${containerClassName}`}>
          <Y2kPlaceholderGraphic
            title={title || alt}
            year={year}
            badgeLabel={badgeLabel}
            statusLabel={statusLabel}
          />
        </div>
      );
    }

    const stateClass = isLoading
      ? "y2k-image-element--loading"
      : "y2k-image-element--loaded";
    const catClass = isCatFallback ? "y2k-image-element--cat-fallback" : "";

    return (
      <div
        className={`y2k-image-container ${containerClassName}`}
        data-testid="resilient-image-container"
      >
        {isLoading && showSkeleton && (
          <div className="y2k-image-skeleton" data-testid="y2k-image-skeleton" />
        )}
        {currentSrc && (
          <img
            ref={ref}
            src={currentSrc}
            alt={alt || title || "Image"}
            loading={loading}
            decoding={decoding}
            className={`y2k-image-element ${stateClass} ${catClass} ${className}`}
            onLoad={handleLoad}
            onError={handleError}
            data-is-primary={isPrimary ? "true" : "false"}
            data-is-cat-fallback={isCatFallback ? "true" : "false"}
            {...restProps}
          />
        )}
      </div>
    );
  }
);

ResilientImage.displayName = "ResilientImage";

/**
 * Alias export for Y2K-themed naming
 */
export const Y2kImage = ResilientImage;
