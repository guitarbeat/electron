import React, { useMemo, useRef } from "react";
import { useKineticWallScroll } from "@/hooks";
import { computePosterMatrix } from "./lib/posterMatrix";

export interface TiltedPosterWallProps {
  items: React.ReactNode[];
  isMobile: boolean;
  isStatic: boolean;
  isLoading?: boolean;
  skeletonCount?: number;
}

export const TiltedPosterWallSkeletonItem: React.FC<{
  columnIndex?: number;
  rowIndex?: number;
}> = ({ columnIndex = 0, rowIndex = 0 }) => (
  <div
    className="movie-item-container tilted-poster-wall-skeleton-item"
    aria-hidden="true"
  >
    <div
      className="movie-item-card chroma-card"
      style={{ padding: 0, overflow: "hidden" }}
    >
      <div className="movie-item-poster-wrap">
        <div
          className="media-poster-wrap"
          style={{
            background: "var(--color-surface-2, rgba(255, 255, 255, 0.04))",
          }}
        >
          <div
            className="media-poster-skeleton tilted-poster-shimmer"
            style={
              {
                "--poster-col-delay": `${(columnIndex * 45 + rowIndex * 65) % 800}ms`,
              } as React.CSSProperties
            }
          />
        </div>
      </div>
    </div>
  </div>
);

export const DriftWallLoading: React.FC<{
  isMobile: boolean;
  fullViewport?: boolean;
}> = ({ isMobile, fullViewport = false }) => {
  const columnCount = isMobile ? 5 : 11;
  const rowCount = isMobile ? 6 : 5;

  return (
    <div
      className={`drift-wall-loading${fullViewport ? " drift-wall-loading--viewport" : ""}`}
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading movies, suggestions, and places</span>
      <div className="drift-wall-loading__plane" aria-hidden="true">
        {Array.from({ length: columnCount }, (_, columnIndex) => (
          <div
            className="drift-wall-loading__column"
            key={`loading-column-${columnIndex}`}
            style={{ "--loading-column": columnIndex } as React.CSSProperties}
          >
            {Array.from({ length: rowCount }, (_, rowIndex) => (
              <div
                className="drift-wall-loading__tile"
                key={`loading-tile-${columnIndex}-${rowIndex}`}
                style={
                  {
                    "--loading-tile": rowIndex,
                    "--loading-tone": (columnIndex * 3 + rowIndex) % 6,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        ))}
      </div>
      <div className="drift-wall-loading__status" aria-hidden="true">
        <span />
        <span />
        <span />
        <small>Loading collection</small>
      </div>
    </div>
  );
};

export const TiltedPosterWall: React.FC<TiltedPosterWallProps> = ({
  items,
  isMobile,
  isStatic,
  isLoading = false,
  skeletonCount,
}) => {
  const wallRef = useRef<HTMLElement | null>(null);
  const trackRefs = useRef<Array<HTMLDivElement | null>>([]);
  const bandRefs = useRef<Array<HTMLDivElement | null>>([]);
  const copyHeightsRef = useRef<number[]>([]);
  const offsetsRef = useRef<number[]>([]);

  // High density: 5 columns on mobile, 11 columns on desktop
  const columnCount = isMobile ? 5 : 11;

  const skeletonItems = useMemo(() => {
    const total = skeletonCount ?? (isMobile ? 12 : 24);
    return Array.from({ length: total }, (_, i) => (
      <TiltedPosterWallSkeletonItem
        key={`wall-skeleton-item-${i}`}
        columnIndex={i % columnCount}
        rowIndex={Math.floor(i / columnCount)}
      />
    ));
  }, [skeletonCount, isMobile, columnCount]);

  const rawCards = isLoading || items.length === 0 ? skeletonItems : items;
  const posterCards = React.Children.toArray(rawCards);

  const columns = useMemo(() => {
    if (posterCards.length === 0) return [];
    const minCardsPerBand = isMobile ? 4 : 5;
    const cardsPerBand = Math.max(
      minCardsPerBand,
      Math.ceil(posterCards.length / 2),
      4,
    );
    return computePosterMatrix(posterCards, columnCount, cardsPerBand);
  }, [columnCount, posterCards, isMobile]);

  // High-performance shared kinetic scroll, auto-measurement & momentum loop
  useKineticWallScroll({
    columnCount,
    trackRefs,
    copyHeightsRef,
    offsetsRef,
    bandRefs,
    wallRef,
    measureDependencies: [items],
    isStatic,
    baseAmbientSpeed: isMobile ? 16 : 22,
    friction: 0.9,
    parallaxVariance: 0.3,
    enabled: true,
  });

  return (
    <section
      ref={wallRef}
      className={`tilted-poster-wall${isStatic ? " is-static" : " is-ambient"}`}
      aria-label="Movies, suggestions, and places"
    >
      <div
        className="tilted-poster-wall__fade tilted-poster-wall__fade--top"
        aria-hidden="true"
      />
      <div className="tilted-poster-wall__plane">
        {columns.map((column, columnIndex) => (
          <div
            className="tilted-poster-wall__column"
            key={`poster-column-${columnIndex}`}
            style={
              { "--poster-column-index": columnIndex } as React.CSSProperties
            }
          >
            <div
              className="tilted-poster-wall__track"
              ref={(element) => {
                trackRefs.current[columnIndex] = element;
              }}
            >
              {Array.from({ length: 4 }, (_, copyIndex) => (
                <div
                  className="tilted-poster-wall__band"
                  key={`poster-band-${columnIndex}-${copyIndex}`}
                  ref={
                    copyIndex === 0
                      ? (element) => {
                          bandRefs.current[columnIndex] = element;
                        }
                      : undefined
                  }
                >
                  {column}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div
        className="tilted-poster-wall__fade tilted-poster-wall__fade--bottom"
        aria-hidden="true"
      />
    </section>
  );
};

export default TiltedPosterWall;
