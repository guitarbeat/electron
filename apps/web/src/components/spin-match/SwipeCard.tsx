import React from "react";
import type { Movie } from "@/shared/types";

interface MovieCardProps {
  movie: Movie;
  dragX: number;
  isDragging: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onDetailsClick?: (movie: Movie) => void;
}

export const SwipeCard: React.FC<MovieCardProps> = ({
  movie,
  dragX,
  isDragging,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onDetailsClick,
}) => {
  const tilt = isDragging ? dragX * 0.07 : 0;
  const keepOpacity = Math.max(0, Math.min(1, dragX / 60));
  const skipOpacity = Math.max(0, Math.min(1, -dragX / 60));

  const handleDetailsClick = () => {
    if (Math.abs(dragX) < 5) {
      onDetailsClick?.(movie);
    }
  };

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={handleDetailsClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleDetailsClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open details for ${movie.title}`}
      style={{
        position: "absolute",
        width: 220,
        height: 310,
        borderRadius: 16,
        overflow: "hidden",
        background: movie.posterUrl
          ? `url(${movie.posterUrl}) center / cover`
          : "var(--color-surface-2)",
        boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
        transform: `translateX(${dragX}px) rotate(${tilt}deg)`,
        transition: isDragging
          ? "none"
          : "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        cursor: isDragging ? "grabbing" : "pointer",
        touchAction: "none",
        userSelect: "none",
      }}
      title={`Click for details or swipe to choose`}
    >
      {!movie.posterUrl && (
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-text-muted)",
            fontSize: 24,
            fontWeight: 700,
            padding: 16,
            textAlign: "center",
            background: "var(--color-surface-3)",
          }}
        >
          {movie.title}
        </span>
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 16,
        }}
      >
        <span
          style={{
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            textShadow: "0 2px 4px rgba(0,0,0,0.8)",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {movie.title}
        </span>
        {movie.year && (
          <span
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: 13,
              marginTop: 2,
            }}
          >
            {movie.year}
          </span>
        )}
      </div>

      {/* KEEP / CHOOSE stamp */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          border: "3px solid #22c55e",
          color: "#22c55e",
          padding: "6px 12px",
          borderRadius: 8,
          fontWeight: 800,
          fontSize: 18,
          textTransform: "uppercase",
          letterSpacing: 1.5,
          transform: "rotate(-15deg)",
          opacity: keepOpacity,
          pointerEvents: "none",
          textShadow: "0 2px 4px rgba(0,0,0,0.5)",
          boxShadow: "0 4px 12px rgba(34,197,94,0.3)",
        }}
      >
        KEEP
      </div>

      {/* SKIP stamp */}
      <div
        style={{
          position: "absolute",
          top: 24,
          right: 24,
          border: "3px solid #ef4444",
          color: "#ef4444",
          padding: "6px 12px",
          borderRadius: 8,
          fontWeight: 800,
          fontSize: 18,
          textTransform: "uppercase",
          letterSpacing: 1.5,
          transform: "rotate(15deg)",
          opacity: skipOpacity,
          pointerEvents: "none",
          textShadow: "0 2px 4px rgba(0,0,0,0.5)",
          boxShadow: "0 4px 12px rgba(239,68,68,0.3)",
        }}
      >
        SKIP
      </div>
    </div>
  );
};
