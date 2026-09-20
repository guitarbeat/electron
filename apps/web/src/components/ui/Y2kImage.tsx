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

/** A restrained editorial cover for titles whose artwork is still unavailable. */
export const Y2kPlaceholderGraphic: React.FC<Y2kPlaceholderGraphicProps> = ({
  title,
  year,
  className = "",
}) => {
  const displayTitle = title?.trim() || "Untitled";
  const monogram = displayTitle.match(/[\p{L}\p{N}]/u)?.[0]?.toUpperCase() || "•";

  return (
    <div
      className={`y2k-placeholder-graphic ${className}`}
      data-testid="y2k-placeholder-graphic"
      role="img"
      aria-label={title ? `${title} placeholder` : "Media placeholder"}
    >
      <div className="y2k-placeholder-graphic__wash" aria-hidden="true" />
      <div className="y2k-placeholder-graphic__monogram" aria-hidden="true">
        {monogram}
      </div>
      <div className="y2k-placeholder-graphic__body">
        <span className="y2k-placeholder-graphic__eyebrow">Electron collection</span>
        <p className="y2k-placeholder-graphic__title">{displayTitle}</p>
        {year && <span className="y2k-placeholder-graphic__meta">{year}</span>}
      </div>
      <div className="y2k-placeholder-graphic__footer">
        <span>Poster pending</span>
        <span aria-hidden="true">✦</span>
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
