import React, { useState, useCallback, memo } from "react";
import { motion, useMotionValue, useTransform, type PanInfo } from "motion/react";

export interface PageFlipLeaf {
  id?: string;
  front: React.ReactNode;
  back: React.ReactNode;
  frontAlt?: string;
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
  className?: string;
  style?: React.CSSProperties;
  onPageChange?: (currentTurnedCount: number) => void;
  onBackgroundClick?: () => void;
}

const EASINGS: Record<PageFlipEase, [number, number, number, number]> = {
  easeInOut: [0.65, 0, 0.35, 1],
  easeOut: [0.16, 1, 0.3, 1],
  circOut: [0, 0.55, 0.45, 1],
  backOut: [0.34, 1.56, 0.64, 1],
};

interface InternalLeafProps {
  index: number;
  total: number;
  front: React.ReactNode;
  back: React.ReactNode;
  frontAlt?: string;
  backAlt?: string;
  turned: boolean;
  peek: boolean;
  delay: number;
  width: number;
  height: number;
  radius: number;
  paper: string;
  turnAngle: number;
  peekAngle: number;
  duration: number;
  curve: [number, number, number, number];
  shadow: number;
  interactive: boolean;
  onSelect: (index: number) => void;
  onReach: (index: number) => void;
  onRelease: () => void;
}

const PageFlipLeafComponent = memo(function PageFlipLeafComponent({
  index,
  total,
  front,
  back,
  frontAlt = "",
  backAlt = "",
  turned,
  peek,
  delay,
  width,
  height,
  radius,
  paper,
  turnAngle,
  peekAngle,
  duration,
  curve,
  shadow,
  interactive,
  onSelect,
  onReach,
  onRelease,
}: InternalLeafProps) {
  const rotationY = useMotionValue(0);
  const zIndex = useTransform(rotationY, (val) =>
    val < -turnAngle / 2 ? total + index + 1 : total - index
  );

  const shadowCss =
    shadow > 0
      ? `${Math.round(4 * shadow)}px ${Math.round(6 * shadow)}px ${Math.round(34 * shadow)}px rgba(0,0,0,${Math.min(0.75 * shadow, 1)})`
      : "none";

  const renderFace = (content: React.ReactNode, altText: string, isBack = false) => {
    const faceStyle: React.CSSProperties = {
      background: paper,
      borderRadius: radius,
      backfaceVisibility: "hidden",
      WebkitBackfaceVisibility: "hidden",
      transform: isBack
        ? "rotateY(180deg) translateZ(1px)"
        : "rotateY(0deg) translateZ(1px)",
      WebkitTransform: isBack
        ? "rotateY(180deg) translateZ(1px)"
        : "rotateY(0deg) translateZ(1px)",
    };

    if (typeof content === "string") {
      return (
        <img
          src={content}
          alt={altText}
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover select-none pointer-events-none"
          style={faceStyle}
        />
      );
    }

    return (
      <div
        className="absolute inset-0 h-full w-full overflow-hidden select-none"
        style={faceStyle}
      >
        {content}
      </div>
    );
  };

  const handlePanEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!interactive) return;
    // Horizontal drag threshold
    if (info.offset.x < -25) {
      // Dragged left -> flip forward
      if (!turned) onSelect(index);
    } else if (info.offset.x > 25) {
      // Dragged right -> flip back
      if (turned) onSelect(index);
    }
  };

  return (
    <motion.div
      className="absolute top-0 left-0 select-none"
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
        boxShadow: shadowCss,
        touchAction: "pan-y",
      }}
      animate={{
        rotateY: turned ? -turnAngle : peek ? -peekAngle : 0,
      }}
      transition={{
        duration,
        delay,
        ease: curve,
      }}
      onPointerEnter={() => onReach(index)}
      onPointerLeave={onRelease}
      onPanEnd={handlePanEnd}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(index);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(index);
        }
      }}
      role={interactive ? "button" : undefined}
      aria-pressed={interactive ? turned : undefined}
      aria-label={`Page ${index + 1} of ${total}`}
      tabIndex={interactive ? 0 : -1}
    >
      {renderFace(front, frontAlt, false)}
      {renderFace(back, backAlt, true)}
    </motion.div>
  );
});

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
  className = "",
  style,
  onPageChange,
  onBackgroundClick,
}) => {
  const total = pages.length;
  const [turnedCount, setTurnedCount] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [isClosingAll, setIsClosingAll] = useState(false);
  const curve = EASINGS[ease] ?? EASINGS.easeInOut;

  const handleSelect = useCallback(
    (index: number) => {
      if (!interactive) return;
      setIsClosingAll(false);
      setTurnedCount((prev) => {
        const next = index < prev ? index : index + 1;
        onPageChange?.(next);
        return next;
      });
    },
    [interactive, onPageChange]
  );

  const handleReach = useCallback(
    (index: number) => {
      if (!interactive) return;
      setHoveredIndex(index);
      if (trigger === "hover") {
        setIsClosingAll(false);
        setTurnedCount(index + 1);
        onPageChange?.(index + 1);
      }
    },
    [interactive, trigger, onPageChange]
  );

  const handleRelease = useCallback(() => {
    setHoveredIndex(-1);
  }, []);

  const handleCloseAll = useCallback(() => {
    if (!interactive) return;
    setIsClosingAll(true);
    setTurnedCount(0);
    onPageChange?.(0);
  }, [interactive, onPageChange]);

  const handleBackgroundClick = useCallback(() => {
    handleCloseAll();
    onBackgroundClick?.();
  }, [handleCloseAll, onBackgroundClick]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!interactive) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setTurnedCount((prev) => {
          const next = Math.min(prev + 1, total);
          onPageChange?.(next);
          return next;
        });
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setTurnedCount((prev) => {
          const next = Math.max(prev - 1, 0);
          onPageChange?.(next);
          return next;
        });
      }
    },
    [interactive, total, onPageChange]
  );

  return (
    <div
      className={`page-flip-container relative flex h-full w-full items-center justify-center select-none ${className}`}
      style={{
        perspective: `${perspective}px`,
        ...style,
      }}
      onPointerLeave={() => {
        setHoveredIndex(-1);
        if (closeOnLeave) handleCloseAll();
      }}
    >
      <button
        type="button"
        className="absolute inset-0 w-full h-full bg-transparent border-0 p-0 cursor-default"
        onClick={handleBackgroundClick}
        onKeyDown={handleKeyDown}
        aria-label="Reset flipbook to cover"
        tabIndex={-1}
      />
      <motion.div
        className="relative z-1"
        style={{
          width: pageWidth,
          height: pageHeight,
          perspective: `${perspective}px`,
          WebkitPerspective: `${perspective}px`,
          transformStyle: "preserve-3d",
          WebkitTransformStyle: "preserve-3d",
        }}
        animate={{ x: turnedCount > 0 ? spineShift : 0 }}
        transition={{
          duration: Math.max(0.8 * duration, 0.1),
          ease: "easeOut",
        }}
      >
        {pages.map((leaf, index) => {
          const turned = index < turnedCount;
          return (
            <PageFlipLeafComponent
              key={leaf.id ?? `leaf-${index}`}
              index={index}
              total={total}
              front={leaf.front}
              back={leaf.back}
              frontAlt={leaf.frontAlt ?? ""}
              backAlt={leaf.backAlt ?? ""}
              turned={turned}
              peek={
                interactive &&
                !turned &&
                hoveredIndex === index &&
                index === turnedCount
              }
              delay={
                isClosingAll && !turned ? (total - 1 - index) * stagger : 0
              }
              width={pageWidth}
              height={pageHeight}
              radius={pageRadius}
              paper={pageColor}
              turnAngle={turnAngle}
              peekAngle={peekAngle}
              duration={duration}
              curve={curve}
              shadow={shadow}
              interactive={interactive}
              onSelect={handleSelect}
              onReach={handleReach}
              onRelease={handleRelease}
            />
          );
        })}
      </motion.div>
    </div>
  );
};
