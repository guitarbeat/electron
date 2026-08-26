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
  tileHeight = 132,
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

  const columnItems = useMemo(() => {
    const cols: (DriftWallItem | ReactNode)[][] = Array.from(
      { length: columns },
      () => [],
    );
    safeItems.forEach((item, i) => cols[i % columns].push(item));
    return cols.map((col) => (col.length ? col : safeItems.slice(0, 1)));
  }, [safeItems, columns]);

  const columnMeta = useMemo(() => {
    const unit = tileHeight + gap;
    return columnItems.map((col) => {
      const copyHeight = Math.max(unit, col.length * unit);
      const copies = Math.max(
        2,
        Math.ceil((containerHeight * 1.6) / copyHeight) + 1,
      );
      return { copyHeight, copies };
    });
  }, [columnItems, tileHeight, gap, containerHeight]);

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

  const baseVelocities = useMemo(() => {
    const dirSign = direction === "up" ? 1 : -1;
    return columnItems.map((_, c) => {
      const altSign = c % 2 === 0 ? 1 : -1;
      return speed * columnFactor(c, variance) * dirSign * altSign;
    });
  }, [columnItems, speed, direction, variance]);

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
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingTouchRef.current || e.touches.length !== 1) return;
      if (isScrollBlockedElement(e.target)) return;
      const currentY = e.touches[0].clientY;
      const dy = touchLastYRef.current - currentY;
      touchLastYRef.current = currentY;
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

  useEffect(() => {
    const animate = (ts: number) => {
      if (lastTsRef.current === null) lastTsRef.current = ts;
      const dt = Math.min(0.05, Math.max(0, ts - lastTsRef.current) / 1000);
      lastTsRef.current = ts;

      const maxTilt = parallax * 8;
      const targetX = pointerRef.current.x * maxTilt;
      const targetY = -pointerRef.current.y * maxTilt;
      // High-speed, responsive damping with zero lag
      const damp = 1 - Math.exp(-dt / 0.045);
      pointerDampedRef.current.x +=
        (targetX - pointerDampedRef.current.x) * damp;
      pointerDampedRef.current.y +=
        (targetY - pointerDampedRef.current.y) * damp;
      applyPlaneTransform(
        pointerDampedRef.current.x,
        pointerDampedRef.current.y,
      );

      // Scroll decay
      const scrollFriction = 0.9;
      const scrollDecay = Math.pow(scrollFriction, dt * 60);
      const scrollStep = scrollVelocityRef.current * dt;
      scrollVelocityRef.current *= scrollDecay;
      if (Math.abs(scrollVelocityRef.current) < 0.15)
        scrollVelocityRef.current = 0;

      if (!reduced) {
        for (let c = 0; c < trackRefs.current.length; c++) {
          const meta = columnMeta[c];
          if (!meta) continue;
          const paused = wallHoveredRef.current && pauseOnHover;
          const factor = paused || hoveredColRef.current === c ? 0 : 1;
          const target = baseVelocities[c] * factor;

          const ease = 1 - Math.exp(-dt / (target === 0 ? 0.16 : 0.28));
          velocitiesRef.current[c] +=
            (target - velocitiesRef.current[c]) * ease;
          const colDir = c % 2 === 0 ? 1 : -0.85;
          let next =
            (offsetsRef.current[c] ?? 0) +
            velocitiesRef.current[c] * dt +
            scrollStep * colDir;
          next = ((next % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
          offsetsRef.current[c] = next;

          const el = trackRefs.current[c];
          if (el) el.style.transform = `translate3d(0, ${-next}px, 0)`;
        }
      } else {
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
      return (
        <div
          key={id}
          role={onTileClick ? "button" : undefined}
          tabIndex={onTileClick ? 0 : undefined}
          className={`drift-wall__tile-custom${activeId === id ? " is-active" : ""}`}
          data-tile-id={id}
          data-col={colIndex}
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
