import React, { useState, useCallback, memo, useEffect, useRef, useMemo } from "react";
import { motion, useMotionValue, useTransform, animate, type PanInfo } from "motion/react";

/* -------------------------------------------------------------------------- */
/*                                Types & Config                              */
/* -------------------------------------------------------------------------- */

export interface PageFlipLeaf {
  /** Optional unique identifier */
  id?: string;
  /** Front face content (visible before turning) */
  front: React.ReactNode;
  /** Back face content (visible after turning) */
  back?: React.ReactNode;
  /** Accessible label/alt text for front */
  frontAlt?: string;
  /** Accessible label/alt text for back */
  backAlt?: string;
}

export type PageFlipEase = "easeInOut" | "easeOut" | "circOut" | "backOut";

export interface PageFlipProps {
  pages: PageFlipLeaf[];
  pageWidth?: number;
  pageHeight?: number;
  pageRadius?: number;
  pageColor?: string;
  perspective?: number;
  spineShift?: number;
  turnAngle?: number;
  peekAngle?: number;
  duration?: number;
  stagger?: number;
  ease?: PageFlipEase;
  shadow?: number;
  trigger?: "click" | "hover";
  closeOnLeave?: boolean;
  interactive?: boolean;
  maxTurnCount?: number;
  forceClose?: boolean;
  autoOpen?: boolean;
  className?: string;
  style?: React.CSSProperties;
  turnedCount?: number;
  onPageChange?: (currentTurnedCount: number) => void;
  onBackgroundClick?: () => void;
}

const EASING_CURVES: Record<PageFlipEase, [number, number, number, number]> = {
  easeInOut: [0.65, 0, 0.35, 1],
  easeOut: [0.16, 1, 0.3, 1],
  circOut: [0, 0.55, 0.45, 1],
  backOut: [0.34, 1.56, 0.64, 1],
};

const INTERACTIVE_ELEMENTS_SELECTOR =
  'button, a, input, select, textarea, [role="button"], [role="switch"], [role="link"]';

/* -------------------------------------------------------------------------- */
/*                               Helper Functions                             */
/* -------------------------------------------------------------------------- */

/** Builds the CSS box-shadow string scaled by intensity */
function getShadowStyle(intensity: number): string {
  if (intensity <= 0) return "none";
  const x = Math.round(4 * intensity);
  const y = Math.round(6 * intensity);
  const blur = Math.round(34 * intensity);
  const alpha = Math.min(0.75 * intensity, 1);
  return `${x}px ${y}px ${blur}px rgba(0, 0, 0, ${alpha})`;
}

/** Checks whether a keyboard event originated from a form control */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

/* -------------------------------------------------------------------------- */
/*                           Subcomponent: Leaf Face                          */
/* -------------------------------------------------------------------------- */

interface LeafFaceProps {
  content: React.ReactNode;
  altText: string;
  isBack?: boolean;
  paperColor: string;
  borderRadius: number;
}

const LeafFace: React.FC<LeafFaceProps> = ({
  content,
  altText,
  isBack = false,
  paperColor,
  borderRadius,
}) => {
  const transform = isBack ? "rotateY(180deg) translateZ(1px)" : "rotateY(0deg) translateZ(1px)";

  const style: React.CSSProperties = {
    background: paperColor,
    borderRadius,
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    transform,
    WebkitTransform: transform,
    willChange: "transform",
  };

  if (typeof content === "string") {
    return (
      <div className="absolute inset-0 h-full w-full overflow-hidden select-none" style={style}>
        <img
          src={content}
          alt={altText}
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover select-none pointer-events-none"
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden select-none" style={style}>
      {content}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                          Subcomponent: Single Leaf                         */
/* -------------------------------------------------------------------------- */

interface LeafProps {
  index: number;
  total: number;
  leaf: PageFlipLeaf;
  isTurned: boolean;
  isPeeking: boolean;
  animationDelay: number;
  width: number;
  height: number;
  radius: number;
  paperColor: string;
  turnAngle: number;
  peekAngle: number;
  duration: number;
  curve: [number, number, number, number];
  shadow: number;
  interactive: boolean;
  onSelect: (index: number) => void;
  onHoverStart: (index: number) => void;
  onHoverEnd: () => void;
}

const PageFlipLeaf = memo(function PageFlipLeaf({
  index,
  total,
  leaf,
  isTurned,
  isPeeking,
  animationDelay,
  width,
  height,
  radius,
  paperColor,
  turnAngle,
  peekAngle,
  duration,
  curve,
  shadow,
  interactive,
  onSelect,
  onHoverStart,
  onHoverEnd,
}: LeafProps) {
  const rotationY = useMotionValue(isTurned ? -turnAngle : 0);

  // Switch z-index at the 90-degree spine midpoint
  const zIndex = useTransform(rotationY, (angle) =>
    angle < -turnAngle / 2 ? total + index + 1 : total - index
  );

  useEffect(() => {
    const targetAngle = isTurned ? -turnAngle : isPeeking ? -peekAngle : 0;
    const animation = animate(rotationY, targetAngle, {
      duration,
      delay: animationDelay,
      ease: curve,
    });
    return () => animation.stop();
  }, [isTurned, isPeeking, turnAngle, peekAngle, duration, animationDelay, curve, rotationY]);

  const shadowStyle = useMemo(() => getShadowStyle(shadow), [shadow]);

  const handlePanEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (!interactive) return;
      const absX = Math.abs(info.offset.x);
      const absY = Math.abs(info.offset.y);
      if (absX < 20 || absX < absY) return;

      if ((info.offset.x < -25 || info.velocity.x < -180) && !isTurned) {
        onSelect(index);
      } else if ((info.offset.x > 25 || info.velocity.x > 180) && isTurned) {
        onSelect(index);
      }
    },
    [interactive, isTurned, onSelect, index]
  );

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const clickedTarget = event.target as HTMLElement | null;
      const interactiveChild = clickedTarget?.closest?.(INTERACTIVE_ELEMENTS_SELECTOR);

      // Do not flip if an interactive child element (button, link) was clicked
      if (interactiveChild && interactiveChild !== event.currentTarget) {
        return;
      }

      event.stopPropagation();
      onSelect(index);
    },
    [onSelect, index]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelect(index);
      }
    },
    [onSelect, index]
  );

  return (
    <motion.div
      className="absolute top-0 left-0 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      style={{
        width,
        height,
        rotateY: rotationY,
        zIndex,
        transformOrigin: "left center",
        transformStyle: "preserve-3d",
        WebkitTransformStyle: "preserve-3d",
        borderRadius: radius,
        cursor: interactive ? "pointer" : "default",
        boxShadow: shadowStyle,
        touchAction: "pan-y",
        willChange: "transform",
      }}
      onPointerEnter={() => onHoverStart(index)}
      onPointerLeave={onHoverEnd}
      onPanEnd={handlePanEnd}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={interactive ? "button" : undefined}
      aria-pressed={interactive ? isTurned : undefined}
      aria-label={`Page ${index + 1} of ${total} (${isTurned ? "turned" : "unturned"})`}
      tabIndex={interactive ? 0 : -1}
    >
      <LeafFace
        content={leaf.front}
        altText={leaf.frontAlt ?? ""}
        isBack={false}
        paperColor={paperColor}
        borderRadius={radius}
      />
      <LeafFace
        content={leaf.back}
        altText={leaf.backAlt ?? ""}
        isBack={true}
        paperColor={paperColor}
        borderRadius={radius}
      />
    </motion.div>
  );
});

/* -------------------------------------------------------------------------- */
/*                           Main Component: PageFlip                         */
/* -------------------------------------------------------------------------- */

export const PageFlip: React.FC<PageFlipProps> = ({
  pages,
  pageWidth = 220,
  pageHeight = 320,
  pageRadius = 8,
  pageColor = "rgba(15, 23, 42, 0.95)",
  perspective = 1200,
  spineShift = 110,
  turnAngle = 180,
  peekAngle = 12,
  duration = 0.55,
  stagger = 0.08,
  ease = "easeInOut",
  shadow = 0.3,
  trigger = "click",
  closeOnLeave = true,
  interactive = true,
  maxTurnCount,
  forceClose,
  autoOpen,
  className = "",
  style,
  turnedCount: turnedCountProp,
  onPageChange,
  onBackgroundClick,
}) => {
  const totalPages = pages.length;
  const [internalTurnedCount, setInternalTurnedCount] = useState(turnedCountProp ?? 0);
  const isControlled = turnedCountProp !== undefined;
  const turnedCount = isControlled ? turnedCountProp : internalTurnedCount;
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [isCascadingClose, setIsCascadingClose] = useState(false);

  const activeCurve = useMemo(() => EASING_CURVES[ease] ?? EASING_CURVES.easeInOut, [ease]);

  const updateTurnedCount = useCallback(
    (action: number | ((prev: number) => number)) => {
      const next = typeof action === "function" ? action(turnedCount) : action;
      if (!isControlled) {
        setInternalTurnedCount(next);
      }
      onPageChange?.(next);
    },
    [isControlled, turnedCount, onPageChange]
  );

  // Sync page change notification for uncontrolled changes
  const prevTurnedCountRef = useRef(turnedCount);
  useEffect(() => {
    if (prevTurnedCountRef.current !== turnedCount) {
      prevTurnedCountRef.current = turnedCount;
      if (!isControlled) {
        onPageChange?.(turnedCount);
      }
    }
  }, [turnedCount, isControlled, onPageChange]);

  // Handle programmatic forceClose
  useEffect(() => {
    if (forceClose && turnedCount > 0) {
      setIsCascadingClose(true);
      updateTurnedCount(0);
    }
  }, [forceClose, turnedCount, updateTurnedCount]);

  // Handle autoOpen
  useEffect(() => {
    if (autoOpen && turnedCount === 0 && !forceClose) {
      const timer = setTimeout(() => {
        setIsCascadingClose(false);
        updateTurnedCount(1);
      }, 50);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [autoOpen, forceClose, turnedCount, updateTurnedCount]);

  /* -------------------------- Navigation Actions -------------------------- */

  const flipToPage = useCallback(
    (targetIndex: number) => {
      if (!interactive) return;
      setIsCascadingClose(false);
      const next = targetIndex < turnedCount ? targetIndex : targetIndex + 1;
      const bounded = maxTurnCount !== undefined && next > maxTurnCount ? 0 : next;
      updateTurnedCount(bounded);
    },
    [interactive, maxTurnCount, turnedCount, updateTurnedCount]
  );

  const closeAllPages = useCallback(() => {
    if (!interactive) return;
    setIsCascadingClose(true);
    updateTurnedCount(0);
  }, [interactive, updateTurnedCount]);

  const handleHoverStart = useCallback(
    (index: number) => {
      if (!interactive) return;
      setHoveredIndex(index);
      if (trigger === "hover") {
        setIsCascadingClose(false);
        updateTurnedCount(index + 1);
      }
    },
    [interactive, trigger, updateTurnedCount]
  );

  const handleHoverEnd = useCallback(() => {
    setHoveredIndex(-1);
  }, []);

  const handleBackgroundClick = useCallback(() => {
    closeAllPages();
    onBackgroundClick?.();
  }, [closeAllPages, onBackgroundClick]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!interactive || isEditableTarget(event.target)) return;

      switch (event.key) {
        case "ArrowRight":
          event.preventDefault();
          setIsCascadingClose(false);
          updateTurnedCount(Math.min(turnedCount + 1, maxTurnCount ?? totalPages));
          break;

        case "ArrowLeft":
          event.preventDefault();
          setIsCascadingClose(false);
          updateTurnedCount(Math.max(turnedCount - 1, 0));
          break;

        case "Home":
          event.preventDefault();
          closeAllPages();
          break;

        case "End":
          event.preventDefault();
          setIsCascadingClose(false);
          updateTurnedCount(maxTurnCount !== undefined ? Math.min(maxTurnCount, totalPages) : totalPages);
          break;

        case "Escape":
          event.preventDefault();
          handleBackgroundClick();
          break;
      }
    },
    [interactive, turnedCount, maxTurnCount, totalPages, updateTurnedCount, closeAllPages, handleBackgroundClick]
  );

  /* -------------------------- Gesture Actions --------------------------- */

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!interactive) return;
      const touch = e.touches[0];
      if (!touch) return;
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    },
    [interactive]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!interactive || !touchStartRef.current) return;
      const touch = e.changedTouches[0];
      if (!touch) return;

      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;
      touchStartRef.current = null;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Check if horizontal swipe is dominant and meets distance or velocity threshold
      const isQuickFlick = deltaTime < 350 && absX > 20;
      const isDrag = absX > 35;

      if ((isQuickFlick || isDrag) && absX > absY * 1.1) {
        setIsCascadingClose(false);
        if (deltaX < 0) {
          // Swiped left (dragged right-to-left) -> Flip forward / next page
          updateTurnedCount((prev) => Math.min(prev + 1, maxTurnCount ?? totalPages));
        } else {
          // Swiped right (dragged left-to-right) -> Flip backward / prev page
          updateTurnedCount((prev) => Math.max(prev - 1, 0));
        }
      }
    },
    [interactive, maxTurnCount, totalPages, updateTurnedCount]
  );

  const handleStagePanEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (!interactive) return;
      const absX = Math.abs(info.offset.x);
      const absY = Math.abs(info.offset.y);
      const isFlick = Math.abs(info.velocity.x) > 180 && absX > 15;
      const isDrag = absX > 35;

      if ((isFlick || isDrag) && absX > absY) {
        setIsCascadingClose(false);
        if (info.offset.x < 0 || info.velocity.x < -180) {
          // Swiped left -> Next page
          updateTurnedCount((prev) => Math.min(prev + 1, maxTurnCount ?? totalPages));
        } else if (info.offset.x > 0 || info.velocity.x > 180) {
          // Swiped right -> Previous page
          updateTurnedCount((prev) => Math.max(prev - 1, 0));
        }
      }
    },
    [interactive, maxTurnCount, totalPages, updateTurnedCount]
  );

  /* ------------------------------- Render --------------------------------- */

  return (
    <div
      className={`page-flip-container relative flex h-full w-full items-center justify-center select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-xl ${className}`}
      style={{
        perspective: `${perspective}px`,
        touchAction: "pan-y",
        ...style,
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onPointerLeave={() => {
        setHoveredIndex(-1);
        if (closeOnLeave) closeAllPages();
      }}
    >
      {/* Background click reset button */}
      <button
        type="button"
        className="absolute inset-0 w-full h-full bg-transparent border-0 p-0 cursor-default"
        onClick={handleBackgroundClick}
        aria-label="Reset flipbook to cover"
        onKeyDown={handleKeyDown}
      />

      {/* 3D Book Stage */}
      <motion.div
        className="relative z-[1] cursor-grab active:cursor-grabbing"
        style={{
          width: pageWidth,
          height: pageHeight,
          perspective: `${perspective}px`,
          WebkitPerspective: `${perspective}px`,
          transformStyle: "preserve-3d",
          WebkitTransformStyle: "preserve-3d",
          touchAction: "pan-y",
        }}
        animate={{ x: turnedCount > 0 ? spineShift : 0 }}
        transition={{
          duration: Math.max(0.8 * duration, 0.1),
          ease: "easeOut",
        }}
        onPanEnd={handleStagePanEnd}
      >
        {pages.map((leaf, index) => {
          const isTurned = index < turnedCount;
          const isPeeking =
            interactive && !isTurned && hoveredIndex === index && index === turnedCount;
          const animationDelay =
            isCascadingClose && !isTurned ? (totalPages - 1 - index) * stagger : 0;

          return (
            <PageFlipLeaf
              key={leaf.id ?? `leaf-${index}`}
              index={index}
              total={totalPages}
              leaf={leaf}
              isTurned={isTurned}
              isPeeking={isPeeking}
              animationDelay={animationDelay}
              width={pageWidth}
              height={pageHeight}
              radius={pageRadius}
              paperColor={pageColor}
              turnAngle={turnAngle}
              peekAngle={peekAngle}
              duration={duration}
              curve={activeCurve}
              shadow={shadow}
              interactive={interactive}
              onSelect={flipToPage}
              onHoverStart={handleHoverStart}
              onHoverEnd={handleHoverEnd}
            />
          );
        })}
      </motion.div>
    </div>
  );
};
