import React from "react";
import { radius } from "@/theme/tokens";

interface SkeletonProps {
  variant?: "text" | "circular" | "rectangular" | "poster";
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Skeleton loading placeholder with animated shimmer effect.
 */
const Skeleton: React.FC<SkeletonProps> = ({
  variant = "rectangular",
  width,
  height,
  className = "",
  style,
}) => {
  const variantStyles: Record<string, React.CSSProperties> = {
    text: {
      width: width || "100%",
      height: height || "1em",
      borderRadius: radius.sm,
    },
    circular: {
      width: width || "40px",
      height: height || "40px",
      borderRadius: radius.full,
    },
    rectangular: {
      width: width || "100%",
      height: height || "100px",
      borderRadius: radius.md,
    },
    poster: {
      width: width || "100%",
      height: height || "auto",
      aspectRatio: "2/3",
      borderRadius: `${radius.md} ${radius.md} 0 0`,
    },
  };

  return (
    <div
      className={`skeleton ${className}`}
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.04)",
        backgroundImage:
          "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.06), transparent)",
        backgroundSize: "200% 100%",
        animation: "skeleton-shimmer 2.2s infinite ease-in-out",
        ...variantStyles[variant],
        ...style,
      }}
      aria-hidden="true"
    />
  );
};

/**
 * Skeleton for movie cards in grid layout.
 */
export const MovieCardSkeleton: React.FC = () => (
  <div
    style={{
      borderRadius: "1rem",
      overflow: "hidden",
      backgroundColor: "rgba(255, 255, 255, 0.02)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      aspectRatio: "2/3",
      position: "relative",
    }}
  >
    <Skeleton
      variant="poster"
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0 }}
    />
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "1.25rem",
        background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
      }}
    >
      <Skeleton variant="text" width="85%" height="1.1rem" />
      <Skeleton variant="text" width="50%" height="0.7rem" />
    </div>
  </div>
);

export default Skeleton;
