import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  CSSProperties,
  ReactNode,
} from "react";
import { isScrollBlockedElement } from "@/hooks";
import "./DriftWall.css";

export interface DriftWallItem {
  image: string;
  title?: string;
  href?: string;
  node?: ReactNode;
  [key: string]: unknown;
}

export interface DriftWallProps {
  items?: (DriftWallItem | ReactNode)[];
  columns?: number;
  tileWidth?: number;
  tileHeight?: number;
  gap?: number;
  radius?: number;
  tilt?: number;
  turn?: number;
  roll?: number;
  perspective?: number;
  depth?: number;
  speed?: number;
  direction?: "up" | "down";
  variance?: number;
  parallax?: number;
  pauseOnHover?: boolean;
  lift?: number;
  fade?: number;
  dim?: number;
  grayscale?: boolean;
  overlayColor?: string;
  className?: string;
  style?: CSSProperties;
  onTileClick?: (item: DriftWallItem | ReactNode, index: number) => void;
}

const DEFAULT_ITEMS: DriftWallItem[] = Array.from({ length: 15 }, (_, i) => {
  const ids = [
    1015, 1025, 1039, 1043, 1044, 1050, 1062, 1069, 1074, 1080, 1084, 106, 110,
    133, 164,
  ];
  return {
    image: `https://picsum.photos/id/${ids[i % ids.length]}/600/400`,
    title: `Tile ${i + 1}`,
    href: undefined,
  };
});

const GLOBAL_DRIFT_START = Date.now();

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const columnFactor = (index: number, variance: number) => {
  const pseudo = ((index * 0.6180339887 + 0.35) % 1) * 2 - 1;
  return 1 + variance * pseudo;
};

export const DriftWall: React.FC<DriftWallProps> = ({
  items = DEFAULT_ITEMS,
  columns = 5,
  tileWidth = 200,
  tileHeight = 300,
  gap = 8,
  radius = 14,
  tilt = 16,
  turn = -14,
  roll = 0,
  perspective = 1200,
  depth = 120,
  speed = 42,
  direction = "up",
  variance = 0.45,
  parallax = 0.6,
  pauseOnHover = false,
  lift = 64,
  fade = 0.6,
  dim = 1,
  grayscale = false,
  overlayColor = "#060010",
  className = "",
  style,
  onTileClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const trackRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);

  const offsetsRef = useRef<number[]>([]);
  const velocitiesRef = useRef<number[]>([]);
  const scrollVelocityRef = useRef<number>(0);
  const isDraggingTouchRef = useRef<boolean>(false);
  const touchLastYRef = useRef<number>(0);
  const hoveredColRef = useRef<number>(-1);
  const wallHoveredRef = useRef<boolean>(false);
  const pointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasDraggedRef = useRef<boolean>(false);
  const pointerDampedRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRectRef = useRef<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const lastTsRef = useRef<number | null>(null);

  const [containerHeight, setContainerHeight] = useState<number>(600);
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const [reduced, setReduced] = useState<boolean>(false);

  // ============================================================================
  // 1. Core State & Data Preparation
  // ============================================================================
  useEffect(() => {
    setReduced(prefersReducedMotion());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const safeItems = useMemo(() => {
    if (!items || items.length === 0) return DEFAULT_ITEMS;
    return items;
  }, [items]);

  // Distribute items sequentially across the given number of columns
  const columnItems = useMemo(() => {
    const cols: (DriftWallItem | ReactNode)[][] = Array.from(
      { length: columns },
      () => [],
    );
    // Distribute items until we have placed at least max(safeItems.length, columns * 3) items
    // This ensures no column is too short and items are well interleaved.
    const totalToPlace = Math.max(safeItems.length, columns * 4);
    for (let i = 0; i < totalToPlace; i++) {
        cols[i % columns].push(safeItems[i % safeItems.length]);
    }
    return cols;
  }, [safeItems, columns]);

  // Pre-calculate heights and number of copies needed for infinite scroll wrapping
  const columnMeta = useMemo(() => {
    return columnItems.map((col) => {
      let colHeight = 0;
      col.forEach((item) => {
        let hr = 1;
        if (React.isValidElement(item)) {
          if (item.props && 'data-height-ratio' in item.props) {
            hr = Number(item.props['data-height-ratio']) || 1;
          }
        } else if (item && typeof item === "object" && 'heightRatio' in item) {
          hr = Number((item as any).heightRatio) || 1;
        }
        colHeight += (tileHeight * hr) + gap;
      });
      const copyHeight = Math.max(tileHeight + gap, colHeight);
      // The track must cover the centered 200% height column plus scroll space
      const copies = Math.max(
        2,
        Math.ceil((containerHeight * 3.5) / copyHeight) + 2,
      );
      return { copyHeight, copies };
    });
  }, [columnItems, tileHeight, gap, containerHeight]);

  // ============================================================================
  // 2. Physics Configuration & Setup
  // ============================================================================
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const updateRect = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      containerRectRef.current = {
        left: rect.left,
        top: rect.top,
        width: rect.width || 1,
        height: rect.height || 1,
      };
      setContainerHeight(rect.height || 600);
    };

    const ro = new ResizeObserver(updateRect);
    ro.observe(containerRef.current);
    window.addEventListener("resize", updateRect, { passive: true });
    window.addEventListener("scroll", updateRect, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect);
    };
  }, []);

  // Determine each column's target drifting speed (alternating directions)
  const baseVelocities = useMemo(() => {
    const dirSign = direction === "up" ? 1 : -1;
    return columnItems.map((_, c) => {
      const altSign = c % 2 === 0 ? 1 : -1; // Adjacent columns drift in opposite directions
      return speed * columnFactor(c, variance) * dirSign * altSign;
    });
  }, [columnItems, speed, direction, variance]);

  // Reset internal tracking values when layout/content changes
  useEffect(() => {
    offsetsRef.current = columnMeta.map(
      (meta, c) => meta.copyHeight * ((c * 0.37) % 1),
    );
    velocitiesRef.current = columnItems.map(() => 0);
  }, [columnMeta, columnItems]);

  const applyPlaneTransform = useCallback(
    (px: number, py: number) => {
      const plane = planeRef.current;
      if (!plane) return;
      plane.style.transform =
        `translate(-50%, -50%) scale(1.18) ` +
        `rotateX(${tilt + py}deg) rotateY(${turn + px}deg) rotateZ(${roll}deg) ` +
        `translateZ(${-depth}px)`;
    },
    [tilt, turn, roll, depth],
  );

  // ============================================================================
  // 3. User Input & Scrolling (Wheel / Touch)
  // ============================================================================
  // Intercepts wheel events and touch drags to add momentum to the scrolling velocity.
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Ignore scroll events originating from scrollable overlays (e.g. modals)
      if (isScrollBlockedElement(e.target)) return;

      let delta = e.deltaY;
      // Normalize wheel deltas depending on the input device
      if (e.deltaMode === 1) delta *= 32; // Line mode
      else if (e.deltaMode === 2) delta *= 600; // Page mode

      // Handle horizontal scrolling (trackpads) when vertical scroll is negligible
      if (Math.abs(delta) < 0.2 && Math.abs(e.deltaX) > 0.2) delta = e.deltaX;

      // Add wheel delta to our running scroll velocity
      scrollVelocityRef.current += delta * 0.85;

      // Cap the maximum scroll velocity to prevent erratic hyper-scrolling
      scrollVelocityRef.current = Math.max(
        -1400,
        Math.min(1400, scrollVelocityRef.current),
      );
    };




    const handleTouchStart = (e: TouchEvent) => {
      if (isScrollBlockedElement(e.target)) return;
      if (e.touches.length === 1) {
        isDraggingTouchRef.current = true;
        touchLastYRef.current = e.touches[0].clientY;
        touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        hasDraggedRef.current = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingTouchRef.current || e.touches.length !== 1) return;
      if (isScrollBlockedElement(e.target)) return;

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const dy = touchLastYRef.current - currentY;
      touchLastYRef.current = currentY;

      if (Math.abs(currentY - touchStartPosRef.current.y) > 10 || Math.abs(currentX - touchStartPosRef.current.x) > 10) {
        hasDraggedRef.current = true;
      }

      // Accelerate the scroll velocity based on the user's drag distance
      scrollVelocityRef.current += dy * 20;
    };


    const handleTouchEnd = () => {
      isDraggingTouchRef.current = false;
    };

    // Attach passive event listeners to maintain 60fps scrolling performance
    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);

  // ============================================================================
  // 4. Main Animation & Physics Loop
  // ============================================================================
  // Runs on requestAnimationFrame to continuously update the visual state.
  useEffect(() => {
    const animate = (ts: number) => {
      if (lastTsRef.current === null) lastTsRef.current = ts;
      
      // Calculate delta time (dt) in seconds, clamped to max 50ms to prevent huge jumps if tab is inactive
      const dt = Math.min(0.05, Math.max(0, ts - lastTsRef.current) / 1000);
      lastTsRef.current = ts;

      // --- Part A: 3D Parallax Tilt ---
      // We tilt the entire wall based on the user's mouse position relative to the center
      const maxTilt = parallax * 8;
      const targetX = pointerRef.current.x * maxTilt;
      const targetY = -pointerRef.current.y * maxTilt;
      
      // High-speed, responsive damping formula for the 3D tilt
      const damp = 1 - Math.exp(-dt / 0.045);
      pointerDampedRef.current.x += (targetX - pointerDampedRef.current.x) * damp;
      pointerDampedRef.current.y += (targetY - pointerDampedRef.current.y) * damp;
      
      applyPlaneTransform(pointerDampedRef.current.x, pointerDampedRef.current.y);

      // --- Part B: Scroll Velocity Decay (Friction) ---
      const scrollFriction = 0.9;
      const scrollDecay = Math.pow(scrollFriction, dt * 60);
      const scrollStep = scrollVelocityRef.current * dt;
      
      // Apply friction to slow down the manual scroll velocity over time
      scrollVelocityRef.current *= scrollDecay;
      if (Math.abs(scrollVelocityRef.current) < 0.15) {
        scrollVelocityRef.current = 0;
      }

      // --- Part C: Column Drifting & Infinite Scrolling ---
      if (!reduced) {
        // Normal mode: columns drift organically
        for (let c = 0; c < trackRefs.current.length; c++) {
          const meta = columnMeta[c];
          if (!meta) continue;

          // 1. Determine Target Speed
          const paused = wallHoveredRef.current && pauseOnHover;
          const factor = paused || hoveredColRef.current === c ? 0 : 1;
          const target = baseVelocities[c] * factor;

          // 2. Smoothly adjust current column velocity towards the target speed
          const ease = 1 - Math.exp(-dt / (target === 0 ? 0.16 : 0.28));
          velocitiesRef.current[c] += (target - velocitiesRef.current[c]) * ease;

          // 3. Compute final movement for this frame
          // colDir alternates the manual scroll direction so adjacent columns move oppositely when scrolling
          const colDir = c % 2 === 0 ? 1 : -0.85;
          let next =
            (offsetsRef.current[c] ?? 0) +
            velocitiesRef.current[c] * dt +
            scrollStep * colDir;

          // 4. Wrap around for infinite scrolling (modulo by the column's total repeated height)
          const el = trackRefs.current[c];
          let actualCopyHeight = meta.copyHeight;
          if (el && meta.copies > 0) {
            actualCopyHeight = el.scrollHeight / meta.copies;
          }
          next = ((next % actualCopyHeight) + actualCopyHeight) % actualCopyHeight;
          offsetsRef.current[c] = next;

          // 5. Apply the transform
          if (el) el.style.transform = `translate3d(0, ${-next}px, 0)`;
        }
      } else {
        // Reduced motion mode: disable auto-drifting and only allow static transforms
        for (let c = 0; c < trackRefs.current.length; c++) {
          const el = trackRefs.current[c];
          const meta = columnMeta[c];
          if (el && meta)
            el.style.transform = `translate3d(0, ${-(offsetsRef.current[c] ?? 0)}px, 0)`;
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
    };
  }, [
    baseVelocities,
    columnMeta,
    pauseOnHover,
    parallax,
    reduced,
    applyPlaneTransform,
  ]);

  // ============================================================================
  // 5. Event Handlers & Rendering
  // ============================================================================

  const activate = useCallback((id: string, index: number) => {
    activeIdRef.current = id;
    hoveredColRef.current = index;
    setActiveId(id);
  }, []);

  const release = useCallback(() => {
    activeIdRef.current = null;
    hoveredColRef.current = -1;
    setActiveId(null);
  }, []);

  const handlePointerEnter = useCallback((_e: React.PointerEvent) => {
    wallHoveredRef.current = true;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      containerRectRef.current = {
        left: rect.left,
        top: rect.top,
        width: rect.width || 1,
        height: rect.height || 1,
      };
    }
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      let rect = containerRectRef.current;
      if (!rect && containerRef.current) {
        const domRect = containerRef.current.getBoundingClientRect();
        rect = {
          left: domRect.left,
          top: domRect.top,
          width: domRect.width || 1,
          height: domRect.height || 1,
        };
        containerRectRef.current = rect;
      }
      if (!rect) return;

      if (parallax > 0 && !reduced) {
        pointerRef.current = {
          x: (e.clientX - rect.left) / rect.width - 0.5,
          y: (e.clientY - rect.top) / rect.height - 0.5,
        };
      }

      // Fast hit testing via event target instead of synchronous document.elementFromPoint
      const target = e.target as HTMLElement | null;
      const tile = target?.closest
        ? (target.closest("[data-tile-id]") as HTMLElement | null)
        : null;
      if (tile) {
        const id = tile.dataset.tileId;
        if (id && id !== activeIdRef.current) {
          activeIdRef.current = id;
          hoveredColRef.current = Number(tile.dataset.col);
          setActiveId(id);
        }
      } else if (activeIdRef.current !== null) {
        activeIdRef.current = null;
        hoveredColRef.current = -1;
        setActiveId(null);
      }
    },
    [parallax, reduced],
  );

  const handlePointerLeaveWall = useCallback(() => {
    wallHoveredRef.current = false;
    pointerRef.current = { x: 0, y: 0 };
    containerRectRef.current = null;
    release();
  }, [release]);

  const cssVars = useMemo(
    () =>
      ({
        "--dw-tile-w": `${tileWidth}px`,
        "--dw-tile-h": `${tileHeight}px`,
        "--dw-gap": `${gap}px`,
        "--dw-radius": `${radius}px`,
        "--dw-perspective": `${perspective}px`,
        "--dw-lift": `${lift}px`,
        "--dw-dim": dim,
        "--dw-gray": grayscale ? 1 : 0,
        "--dw-overlay": overlayColor,
        "--dw-edge": `${Math.max(0, (1 - fade) * 100)}%`,
        ...style,
      }) as CSSProperties,
    [
      tileWidth,
      tileHeight,
      gap,
      radius,
      perspective,
      lift,
      dim,
      grayscale,
      overlayColor,
      fade,
      style,
    ],
  );

  const renderTile = (
    item: DriftWallItem | ReactNode,
    id: string,
    colIndex: number,
    originalIndex: number,
  ) => {
    // If item is a custom React element (like a MovieCard / PlaceCard)
    if (
      React.isValidElement(item) ||
      (item && typeof item === "object" && "node" in item && item.node)
    ) {
      const nodeToRender = React.isValidElement(item)
        ? item
        : (item as DriftWallItem).node;
        
      let hr = 1;
      if (React.isValidElement(item)) {
        if (item.props && 'data-height-ratio' in item.props) {
          hr = Number(item.props['data-height-ratio']) || 1;
        }
      } else if (item && typeof item === "object" && 'heightRatio' in item) {
        hr = Number((item as any).heightRatio) || 1;
      }

      return (
        <div
          key={id}
          role={onTileClick ? "button" : undefined}
          tabIndex={onTileClick ? 0 : undefined}
          className={`drift-wall__tile-custom${activeId === id ? " is-active" : ""}`}
          data-tile-id={id}
          data-col={colIndex}
          style={{ "--dw-custom-h": `${tileHeight * hr}px` } as React.CSSProperties}
          onFocus={() => activate(id, colIndex)}
          onBlur={release}
          onClick={
            onTileClick ? () => onTileClick(item, originalIndex) : undefined
          }
          onKeyDown={
            onTileClick
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onTileClick(item, originalIndex);
                  }
                }
              : undefined
          }
        >
          {nodeToRender}
        </div>
      );
    }

    const tileItem = item as DriftWallItem;
    const inner = (
      <span className="drift-wall__inner">
        <img
          src={tileItem.image}
          alt={tileItem.title ?? ""}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
        <span className="drift-wall__overlay" aria-hidden="true" />
      </span>
    );

    const commonProps = {
      className: `drift-wall__tile${activeId === id ? " is-active" : ""}`,
      "data-tile-id": id,
      "data-col": colIndex,
      onFocus: () => activate(id, colIndex),
      onBlur: release,
      onClick: () => onTileClick?.(tileItem, originalIndex),
    };

    if (tileItem.href) {
      return (
        <a
          key={id}
          href={tileItem.href}
          target="_blank"
          rel="noreferrer noopener"
          {...commonProps}
        >
          {inner}
        </a>
      );
    }

    return (
      <button
        type="button"
        key={id}
        tabIndex={0}
        aria-label={tileItem.title ?? "tile"}
        {...commonProps}
      >
        {inner}
      </button>
    );
  };

  const rootClass = [
    "drift-wall",
    reduced ? "drift-wall--reduced" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={containerRef}
      className={rootClass}
      onClickCapture={(e) => {
        if (hasDraggedRef.current) {
          e.stopPropagation();
          e.preventDefault();
          hasDraggedRef.current = false;
        }
      }}

      style={cssVars}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeaveWall}
      role="group"
      aria-label="Drifting wall of tiles"
    >
      <div ref={planeRef} className="drift-wall__plane">
        {columnItems.map((col, c) => {
          const meta = columnMeta[c];
          const copies = Array.from({ length: meta.copies });
          return (
            <div className="drift-wall__col" key={`col-${c}`}>
              <div
                className="drift-wall__track"
                ref={(el) => {
                  trackRefs.current[c] = el;
                }}
              >
                {copies.map((_, copyIndex) =>
                  col.map((item, itemIndex) =>
                    renderTile(
                      item,
                      `${c}-${copyIndex}-${itemIndex}`,
                      c,
                      itemIndex,
                    ),
                  ),
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DriftWall;
