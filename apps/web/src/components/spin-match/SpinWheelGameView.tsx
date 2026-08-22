import React from "react";
import type { Movie } from "@/shared/types";
import { SparklesIcon } from "../common/Icons";

interface SpinWheelGameViewProps {
  candidates: Movie[];
  isSpinning: boolean;
  spinAngle: number;
  winnerMovie: Movie | null;
  onSpin: () => void;
  onSelectMovie: (movie: Movie) => void;
  onDetailsClick: (movie: Movie) => void;
}

export const SpinWheelGameView: React.FC<SpinWheelGameViewProps> = ({
  candidates,
  isSpinning,
  spinAngle,
  winnerMovie,
  onSpin,
  onSelectMovie,
  onDetailsClick,
}) => {
  const sliceAngle = candidates.length > 0 ? 360 / candidates.length : 360;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        width: "100%",
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      <div style={{ position: "relative", width: 300, height: 300, marginBottom: 24 }}>
        {/* Pointer */}
        <div
          style={{
            position: "absolute",
            top: -12,
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "12px solid transparent",
            borderRight: "12px solid transparent",
            borderTop: "24px solid var(--color-accent, #6366f1)",
            zIndex: 10,
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
          }}
        />

        {/* Wheel Disc */}
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            border: "4px solid var(--color-border)",
            position: "relative",
            overflow: "hidden",
            transform: `rotate(${spinAngle}deg)`,
            transition: isSpinning
              ? "transform 4.2s cubic-bezier(0.15, 0.85, 0.15, 1)"
              : "none",
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
            background: "var(--color-surface-2)",
          }}
        >
          {candidates.map((candidate, i) => {
            const rot = i * sliceAngle;
            const hue = (i * 360) / Math.max(candidates.length, 1);
            return (
              <div
                key={candidate.id}
                role="button"
                tabIndex={0}
                aria-label={`Select ${candidate.title}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectMovie(candidate);
                  }
                }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "50%",
                  height: "50%",
                  transformOrigin: "100% 100%",
                  transform: `rotate(${rot}deg) skewY(${90 - sliceAngle}deg)`,
                  background: `hsl(${hue}, 70%, 45%)`,
                  border: "1px solid rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
                onClick={() => onSelectMovie(candidate)}
                title={candidate.title}
              />
            );
          })}
        </div>

        {/* Center Knob */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--color-surface)",
            border: "4px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            zIndex: 5,
            fontWeight: 700,
            fontSize: 12,
            color: "var(--color-text)",
          }}
        >
          SPIN
        </div>
      </div>

      {winnerMovie && !isSpinning && (
        <div
          style={{
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: 16,
            padding: 20,
            textAlign: "center",
            width: "100%",
            marginBottom: 20,
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          }}
        >
          <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 4 }}>
            🎯 SELECTED WINNER
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>
            {winnerMovie.title}
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => onDetailsClick(winnerMovie)}
              className="btn btn-secondary"
            >
              View Details
            </button>
            <button
              onClick={onSpin}
              className="btn btn-primary"
            >
              Spin Again
            </button>
          </div>
        </div>
      )}

      {!winnerMovie && (
        <button
          onClick={onSpin}
          disabled={isSpinning || candidates.length === 0}
          className="btn btn-primary"
          style={{ padding: "12px 32px", fontSize: 16, fontWeight: 700 }}
        >
          <SparklesIcon size={18} />
          {isSpinning ? "Spinning Wheel..." : "Spin the Wheel!"}
        </button>
      )}
    </div>
  );
};
