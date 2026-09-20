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
import { scrollStorage } from "@/utils/scrollStorage";
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
  direction?: "up" | "down" | "zigzag";
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
  scrollStorageKey?: string;
  isPaused?: boolean;
}

const EMPTY_ITEMS: (DriftWallItem | ReactNode)[] = [];

const GLOBAL_DRIFT_START = Date.now();

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const DriftWall: React.FC<DriftWallProps> = ({
  items = EMPTY_ITEMS,
  columns = 5,
  tileWidth = 140,
  tileHeight = 210,
  gap = 24,
  radius = 12,
  tilt = 0,
  turn = 0,
  roll = 0,
  perspective = 1000,
  depth = 0,
  speed = 36,
  direction = "zigzag",
  variance = 0,
  parallax = 0,
  pauseOnHover = false,
  lift = 24,
  fade = 0.08,
  dim = 1,
  grayscale = false,
  overlayColor = "#060010",
  className = "",
  style,
  onTileClick,
  scrollStorageKey,
  isPaused = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);

  const beltOffsetRef = useRef<number>(0);
  const beltVelocityRef = useRef<number>(speed);
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
  const [containerWidth, setContainerWidth] = useState<number>(1200);
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const [focusedCoord, setFocusedCoord] = useState<{ c: number; r: number } | null>(null);
  const [reduced, setReduced] = useState<boolean>(false);

  // Load initial offsets if a storage key is provided
  useEffect(() => {
    if (scrollStorageKey) {
      const saved = scrollStorage.load<{ offset: number }>(scrollStorageKey);
      if (saved && typeof saved.offset === "number") {
        beltOffsetRef.current = saved.offset;
      }
    }
  }, [scrollStorageKey]);

  // Save offsets periodically or on unmount
  useEffect(() => {
    if (!scrollStorageKey) return;
    
    const interval = setInterval(() => {
      if (beltOffsetRef.current !== undefined) {
        scrollStorage.save(scrollStorageKey, { offset: beltOffsetRef.current });
      }
    }, 1000);
    
    return () => {
      clearInterval(interval);
      if (beltOffsetRef.current !== undefined) {
        scrollStorage.save(scrollStorageKey, { offset: beltOffsetRef.current });
      }
    };
  }, [scrollStorageKey]);

  /* Roving tabindex logic for arrow-key navigation */
  const getTabIndex = (c: number, r: number) => {
    if (!focusedCoord) {
      return c === 0 && r === 0 ? 0 : -1;
    }
    return focusedCoord.c === c && focusedCoord.r === r ? 0 : -1;
  };

  // ============================================================================
  // 1. Core State & Belt Setup
  // ============================================================================
  useEffect(() => {
    setReduced(prefersReducedMotion());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const safeItems = useMemo(() => {
    return items ?? EMPTY_ITEMS;
  }, [items]);

  const slotHeight = tileHeight + gap;
  const slotWidth = tileWidth + gap;

  const safeCols = useMemo(() => {
    const desired = columns && columns > 0 ? columns : Math.max(3, Math.ceil((containerWidth * 1.05) / slotWidth));
    return Math.max(2, desired % 2 === 0 ? desired : desired + 1);
  }, [columns, containerWidth, slotWidth]);

  const totalSlots = safeItems.length;

  // Calculate itemsPerCol to ensure vertical center-to-center distance is always >= slotHeight (tileHeight + gap)
  const itemsPerCol = useMemo(() => {
    if (totalSlots === 0) return 4;
    const minItemsForHeight = Math.ceil((containerHeight + slotHeight * 1.2) / slotHeight);
    const itemsFromCount = Math.ceil(totalSlots / safeCols);
    return Math.max(3, itemsFromCount, minItemsForHeight);
  }, [totalSlots, safeCols, containerHeight, slotHeight]);

  const columnHeight = useMemo(() => {
    return itemsPerCol * slotHeight;
  }, [itemsPerCol, slotHeight]);

  const rowsPerCol = itemsPerCol;

  const totalBeltLength = useMemo(() => {
    return safeCols * columnHeight;
  }, [safeCols, columnHeight]);

  const beltTiles = useMemo(() => {
    return safeItems.map((item, i) => ({
      item,
      originalIndex: i,
      slotIndex: i,
    }));
  }, [safeItems]);

  // ============================================================================
  // 2. Container Resize Tracking
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
      setContainerWidth(rect.width || 1200);
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

  const applyPlaneTransform = useCallback(
    (px: number, py: number) => {
      const plane = planeRef.current;
      if (!plane) return;
      const isFlat = tilt === 0 && turn === 0 && roll === 0 && depth === 0 && parallax === 0;
      if (isFlat) {
        plane.style.transform = "translate(-50%, -50%)";
      } else {
        plane.style.transform =
          `translate(-50%, -50%) ` +
          `rotateX(${tilt + py}deg) rotateY(${turn + px}deg) rotateZ(${roll}deg) ` +
          `translateZ(${-depth}px)`;
      }
    },
    [tilt, turn, roll, depth, parallax],
  );

  // Position tiles initially
  useLayoutEffect(() => {
    if (totalSlots <= 0 || totalBeltLength <= 0) return;
    for (let i = 0; i < totalSlots; i++) {
      const el = tileRefs.current[i];
      if (!el) continue;

      const frac = (((i / totalSlots) + (beltOffsetRef.current / totalBeltLength)) % 1 + 1) % 1;
      const u = frac * safeCols;
      const colIndex = Math.floor(u) % safeCols;
      const t_col = u - Math.floor(u);

      const x = (colIndex - (safeCols - 1) / 2) * (tileWidth + gap);
      const isEvenUp = direction !== "down";
      const isUp = isEvenUp ? colIndex % 2 === 0 : colIndex % 2 !== 0;
      const y = isUp ? (0.5 - t_col) * columnHeight : (t_col - 0.5) * columnHeight;

      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    }
  }, [totalSlots, totalBeltLength, safeCols, tileWidth, gap, columnHeight, direction]);

  // ============================================================================
  // 3. User Input & Scrolling (Wheel / Touch)
  // ============================================================================
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isScrollBlockedElement(e.target)) return;

      let delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 32;
      else if (e.deltaMode === 2) delta *= 600;

      if (Math.abs(delta) < 0.2 && Math.abs(e.deltaX) > 0.2) delta = e.deltaX;

      scrollVelocityRef.current += delta * 0.85;
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

      scrollVelocityRef.current += dy * 20;
    };

    const handleTouchEnd = () => {
      isDraggingTouchRef.current = false;
    };

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
  // 4. Main Animation Loop (Serpentine Conveyor Belt)
  // ============================================================================
  useEffect(() => {
    const animate = (ts: number) => {
      if (lastTsRef.current === null) lastTsRef.current = ts;
      
      const dt = Math.min(0.05, Math.max(0, ts - lastTsRef.current) / 1000);
      lastTsRef.current = ts;

      // --- Part A: 3D Parallax Tilt ---
      const maxTilt = parallax * 8;
      const targetX = pointerRef.current.x * maxTilt;
      const targetY = -pointerRef.current.y * maxTilt;
      
      const damp = 1 - Math.exp(-dt / 0.045);
      pointerDampedRef.current.x += (targetX - pointerDampedRef.current.x) * damp;
      pointerDampedRef.current.y += (targetY - pointerDampedRef.current.y) * damp;
      
      applyPlaneTransform(pointerDampedRef.current.x, pointerDampedRef.current.y);

      // --- Part B: Scroll Friction ---
      const scrollFriction = 0.9;
      const scrollDecay = Math.pow(scrollFriction, dt * 60);
      const scrollStep = scrollVelocityRef.current * dt;
      
      scrollVelocityRef.current *= scrollDecay;
      if (Math.abs(scrollVelocityRef.current) < 0.15) {
        scrollVelocityRef.current = 0;
      }

      // --- Part C: Serpentine Belt Motion (Snake left-to-right, up and down) ---
      if (!reduced && totalBeltLength > 0 && totalSlots > 0) {
        const isWallPaused = isPaused || (wallHoveredRef.current && pauseOnHover);
        const targetSpeed = isWallPaused ? 0 : speed;
        const ease = 1 - Math.exp(-dt / (targetSpeed === 0 ? 0.2 : 0.32));
        beltVelocityRef.current += (targetSpeed - beltVelocityRef.current) * ease;

        let nextOffset =
          beltOffsetRef.current +
          beltVelocityRef.current * dt +
          scrollStep;

        nextOffset = ((nextOffset % totalBeltLength) + totalBeltLength) % totalBeltLength;
        beltOffsetRef.current = nextOffset;

        for (let i = 0; i < totalSlots; i++) {
          const el = tileRefs.current[i];
          if (!el) continue;

          const frac = (((i / totalSlots) + (nextOffset / totalBeltLength)) % 1 + 1) % 1;
          const u = frac * safeCols;
          const colIndex = Math.floor(u) % safeCols;
          const t_col = u - Math.floor(u);

          const x = (colIndex - (safeCols - 1) / 2) * (tileWidth + gap);
          const isEvenUp = direction !== "down";
          const isUp = isEvenUp ? colIndex % 2 === 0 : colIndex % 2 !== 0;
          const y = isUp
            ? (0.5 - t_col) * columnHeight
            : (t_col - 0.5) * columnHeight;

          el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        }
      } else if (reduced && totalSlots > 0) {
        // Reduced motion: static positions
        const totalRows = Math.ceil(totalSlots / safeCols);
        for (let i = 0; i < totalSlots; i++) {
          const el = tileRefs.current[i];
          if (!el) continue;
          const colIndex = i % safeCols;
          const rowInCol = Math.floor(i / safeCols);
          const x = (colIndex - (safeCols - 1) / 2) * (tileWidth + gap);
          const y = (rowInCol - (totalRows - 1) / 2) * slotHeight;
          el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
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
    totalBeltLength,
    totalSlots,
    slotHeight,
    rowsPerCol,
    safeCols,
    tileWidth,
    gap,
    columnHeight,
    pauseOnHover,
    parallax,
    reduced,
    applyPlaneTransform,
    isPaused,
    speed,
    direction,
    variance,
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
    slotIndex: number,
  ) => {
    const r = slotIndex % rowsPerCol;
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
        if (item.props && 'data-height-ratio' in (item.props as Record<string, unknown>)) {
          hr = Number((item.props as Record<string, unknown>)['data-height-ratio']) || 1;
        }
      } else if (item && typeof item === "object" && 'heightRatio' in (item as Record<string, unknown>)) {
        hr = Number((item as Record<string, unknown>).heightRatio) || 1;
      }

      return (
        <div
          key={id}
          role="gridcell"
          tabIndex={getTabIndex(colIndex, r)}
          className={`drift-wall__tile-custom${activeId === id ? " is-active" : ""}`}
          data-tile-id={id}
          data-col={colIndex}
          style={{ "--dw-custom-h": `${tileHeight * hr}px`, width: "100%", height: "100%" } as React.CSSProperties}
          onFocus={() => {
            activate(id, colIndex);
            setFocusedCoord({ c: colIndex, r });
          }}
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
      role: "gridcell",
      tabIndex: getTabIndex(colIndex, r),
      "data-tile-id": id,
      "data-col": colIndex,
      onFocus: () => {
        activate(id, colIndex);
        setFocusedCoord({ c: colIndex, r });
      },
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
      role="grid"
      aria-label="Serpentine wall of movies"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (totalSlots === 0) return;
        if (!focusedCoord) {
          if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
            setFocusedCoord({ c: 0, r: 0 });
            e.preventDefault();
            const el = containerRef.current?.querySelector(`[data-tile-id="serpentine-tile-0"]`) as HTMLElement | null;
            el?.focus();
          }
          return;
        }
        let { c, r } = focusedCoord;
        const maxR = rowsPerCol - 1;
        const maxC = safeCols - 1;

        let handled = true;
        if (e.key === "ArrowUp") {
          r = Math.max(0, r - 1);
        } else if (e.key === "ArrowDown") {
          r = Math.min(maxR, r + 1);
        } else if (e.key === "ArrowLeft") {
          c = Math.max(0, c - 1);
        } else if (e.key === "ArrowRight") {
          c = Math.min(maxC, c + 1);
        } else {
          handled = false;
        }

        if (handled) {
          e.preventDefault();
          setFocusedCoord({ c, r });
          const targetSlot = (c * rowsPerCol + r) % totalSlots;
          const id = `serpentine-tile-${targetSlot}`;
          const el = containerRef.current?.querySelector(`[data-tile-id="${id}"]`) as HTMLElement | null;
          el?.focus();
        }
      }}
    >
      <div ref={planeRef} className="drift-wall__plane">
        {beltTiles.map((tileData, index) => {
          const colIndex = index % safeCols;
          return (
            <div
              key={`serpentine-tile-${index}`}
              ref={(el) => {
                tileRefs.current[index] = el;
              }}
              className="drift-wall__serpentine-tile"
              style={{
                width: tileWidth,
                height: tileHeight,
                marginTop: -tileHeight / 2,
                marginLeft: -tileWidth / 2,
              }}
            >
              {renderTile(
                tileData.item,
                `serpentine-tile-${index}`,
                colIndex,
                tileData.originalIndex,
                index,
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DriftWall;
