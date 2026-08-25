import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMovies } from "@/hooks/movies";
import { useUser } from "@/app/providerContexts";
import type { Movie } from "@/shared/types";
import { FilmIcon, SparklesIcon } from "@/common/Icons";
const MovieDetailsModal = React.lazy(() => import("@/components/movies").then(m => ({ default: m.MovieDetailsModal })));
import {
  buildSpinWheelGradient,
  computeSpinOutcome,
} from "../spin-wheel/spinWheelUtils";
import { getUnwatchedCandidatePool } from "../games/movieCandidatePool";

const SWIPE_THRESHOLD = 75;
const SWIPE_VELOCITY_THRESHOLD = 0.4;

type SwipeResult = "keep" | "skip" | "none";

function evaluateSwipe(finalX: number, velocity: number): SwipeResult {
  if (finalX > SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY_THRESHOLD) {
    return "keep";
  }
  if (finalX < -SWIPE_THRESHOLD || velocity < -SWIPE_VELOCITY_THRESHOLD) {
    return "skip";
  }
  return "none";
}

function calculateVelocity(
  currentX: number,
  lastX: number | null,
  currentTime: number,
  lastTime: number | null,
): number {
  if (lastX === null || lastTime === null) return 0;
  const dt = currentTime - lastTime;
  if (dt <= 0) return 0;
  return (currentX - lastX) / dt;
}

function filterCandidates<T extends { watchedBy: unknown[] }>(movies: T[]): T[] {
  return getUnwatchedCandidatePool(movies);
}

type Phase = "swipe" | "spin" | "result";

interface SpinSwipeGameProps {
  onSpinningChange?: (isSpinning: boolean) => void;
}

const SPIN_DURATION_MS = 4200;

function MovieCard({
  movie,
  dragX,
  isDragging,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onDetailsClick,
}: {
  movie: Movie;
  dragX: number;
  isDragging: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onDetailsClick?: (movie: Movie) => void;
}) {
  const tilt = isDragging ? dragX * 0.07 : 0;
  const keepOpacity = Math.max(0, Math.min(1, dragX / 60));
  const skipOpacity = Math.max(0, Math.min(1, -dragX / 60));

  const handleDetailsClick = () => {
    if (dragX === 0) {
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
            fontSize: "4rem",
          }}
        >
          🎬
        </span>
      )}

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.92) 0%, transparent 100%)",
          padding: "2.5rem 1rem 1rem",
        }}
      >
        <p
          style={{
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.95rem",
            lineHeight: 1.3,
            textShadow: "0 1px 8px rgba(0,0,0,0.8)",
            margin: 0,
          }}
        >
          {movie.title}
        </p>
        {movie.year && (
          <p
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "0.72rem",
              margin: "2px 0 0",
            }}
          >
            {movie.year}
          </p>
        )}
      </div>

      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 18,
          right: 14,
          background: "#22c55e",
          color: "#fff",
          borderRadius: 8,
          padding: "4px 10px",
          fontWeight: 800,
          fontSize: "0.78rem",
          letterSpacing: "0.06em",
          opacity: keepOpacity,
          transform: `rotate(${-tilt + 4}deg)`,
          border: "2px solid rgba(255,255,255,0.8)",
          pointerEvents: "none",
        }}
      >
        KEEP ✅
      </div>

      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 18,
          left: 14,
          background: "#ef4444",
          color: "#fff",
          borderRadius: 8,
          padding: "4px 10px",
          fontWeight: 800,
          fontSize: "0.78rem",
          letterSpacing: "0.06em",
          opacity: skipOpacity,
          transform: `rotate(${-tilt - 4}deg)`,
          border: "2px solid rgba(255,255,255,0.8)",
          pointerEvents: "none",
        }}
      >
        SKIP ❌
      </div>
    </div>
  );
}

function SpinWheel({
  kept,
  rotation,
  isSpinning,
  onSpin,
}: {
  kept: Movie[];
  rotation: number;
  isSpinning: boolean;
  onSpin: () => void;
}) {
  const gradient = useMemo(
    () => buildSpinWheelGradient(kept.length),
    [kept.length],
  );
  const segmentAngle = kept.length > 0 ? 360 / kept.length : 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1.25rem",
        padding: "1rem",
      }}
    >
      <p
        style={{
          color: "var(--color-text-secondary)",
          fontSize: "0.72rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          margin: 0,
        }}
      >
        {kept.length} movie{kept.length !== 1 ? "s" : ""} in the wheel
      </p>

      <div style={{ position: "relative", width: 270, height: 270 }}>
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -14,
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "11px solid transparent",
            borderRight: "11px solid transparent",
            borderTop: "24px solid var(--color-accent)",
            zIndex: 10,
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))",
          }}
        />

        <div
          style={{
            width: 270,
            height: 270,
            borderRadius: "50%",
            background: gradient,
            transform: `translate3d(0, 0, 0) rotate(${rotation}deg)`,
            willChange: isSpinning ? "transform" : "auto",
            backfaceVisibility: "hidden",
            transition: isSpinning
              ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.17,0.67,0.12,1)`
              : "none",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.45), inset 0 0 0 3px rgba(255,255,255,0.12)",
            position: "relative",
          }}
        >
          {kept.map((movie, i) => {
            const angle = i * segmentAngle + segmentAngle / 2;
            const rad = ((angle - 90) * Math.PI) / 180;
            const r = 88;
            const x = 135 + r * Math.cos(rad);
            const y = 135 + r * Math.sin(rad);
            const label =
              movie.title.length > 11
                ? `${movie.title.slice(0, 10)}…`
                : movie.title;

            return (
              <span
                key={movie.id}
                aria-hidden
                style={{
                  position: "absolute",
                  left: x,
                  top: y,
                  transform: `translate(-50%,-50%) rotate(${angle}deg)`,
                  fontSize: "0.52rem",
                  fontWeight: 700,
                  color: "#fff",
                  textShadow: "0 1px 4px rgba(0,0,0,0.9)",
                  whiteSpace: "nowrap",
                  letterSpacing: "0.02em",
                }}
              >
                {label}
              </span>
            );
          })}
        </div>

        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "var(--color-surface-0)",
            border: "3px solid rgba(255,255,255,0.3)",
            zIndex: 5,
          }}
        />
      </div>

      <button
        type="button"
        onClick={onSpin}
        disabled={isSpinning || kept.length < 1}
        style={{
          padding: "0.75rem 2.5rem",
          background: isSpinning
            ? "rgba(255,255,255,0.1)"
            : "var(--color-accent)",
          border: "none",
          borderRadius: 999,
          color: "#fff",
          fontWeight: 700,
          cursor: isSpinning ? "not-allowed" : "pointer",
          fontSize: "1rem",
          letterSpacing: "0.04em",
          transition: "all 0.2s ease",
        }}
      >
        {isSpinning ? "🌀 Spinning…" : "🎰 Spin!"}
      </button>
    </div>
  );
}

function ResultScreen({
  winner,
  onReset,
  onWinnerClick,
}: {
  winner: Movie;
  onReset: () => void;
  onWinnerClick?: (movie: Movie) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1.25rem",
        padding: "1.5rem 1rem",
      }}
    >
      <p
        style={{
          color: "var(--color-text-secondary)",
          fontSize: "0.72rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          margin: 0,
        }}
      >
        Tonight&apos;s pick 🎉
      </p>

      <div
        onClick={() => onWinnerClick?.(winner)}
        style={{
          width: 190,
          height: 270,
          borderRadius: 14,
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 20px 52px rgba(0,0,0,0.55)",
          background: winner.posterUrl
            ? `url(${winner.posterUrl}) center / cover`
            : "var(--color-surface-2)",
          cursor: onWinnerClick ? "pointer" : "default",
        }}
        title={
          onWinnerClick
            ? `Click for more details about "${winner.title}"`
            : undefined
        }
        role="button"
        aria-label={`Open details for ${winner.title}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onWinnerClick?.(winner);
          }
        }}
      >
        {!winner.posterUrl && (
          <span
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "4rem",
            }}
          >
            🎬
          </span>
        )}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)",
            padding: "2rem 0.85rem 0.85rem",
          }}
        >
          <p
            style={{
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.9rem",
              lineHeight: 1.3,
              margin: 0,
              textShadow: "0 1px 8px rgba(0,0,0,0.8)",
            }}
          >
            {winner.title}
          </p>
          {winner.year && (
            <p
              style={{
                color: "rgba(255,255,255,0.55)",
                fontSize: "0.7rem",
                margin: "2px 0 0",
              }}
            >
              {winner.year}
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onReset}
        aria-label="Play again"
        title="Play again"
        style={{
          padding: "0.6rem 1.6rem",
          background: "transparent",
          border: "1.5px solid var(--color-accent)",
          borderRadius: 999,
          color: "var(--color-accent)",
          fontWeight: 700,
          cursor: "pointer",
          fontSize: "0.85rem",
          transition: "all 0.18s ease",
        }}
      >
        Play Again
      </button>
    </div>
  );
}

const SpinSwipeGame: React.FC<SpinSwipeGameProps> = ({ onSpinningChange }) => {
  const { currentUser } = useUser();
  const { movies, isLoading } = useMovies(currentUser, false);

  const [phase, setPhase] = useState<Phase>("swipe");
  const [kept, setKept] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [winner, setWinner] = useState<Movie | null>(null);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [modalMovie, setModalMovie] = useState<Movie | null>(null);

  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef<number | null>(null);
  const dragLastX = useRef<number | null>(null);
  const dragLastTime = useRef<number | null>(null);
  const dragVelocity = useRef<number>(0);
  const spinTimeoutRef = useRef<number | null>(null);

  const candidates = useMemo(() => filterCandidates(movies), [movies]);

  const isDone = currentIndex >= candidates.length;
  const currentMovie = isDone ? null : candidates[currentIndex];
  const nextMovie = candidates[currentIndex + 1] ?? null;
  useEffect(() => {
    onSpinningChange?.(isSpinning);
  }, [isSpinning, onSpinningChange]);

  useEffect(
    () => () => {
      if (spinTimeoutRef.current !== null) clearTimeout(spinTimeoutRef.current);
      onSpinningChange?.(false);
    },
    [onSpinningChange],
  );

  const advance = useCallback(
    (keep: boolean) => {
      if (!currentMovie) return;
      if (keep) setKept((prev) => [...prev, currentMovie]);
      setCurrentIndex((i) => i + 1);
      setDragX(0);
    },
    [currentMovie],
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isSpinning) return;
    dragStartX.current = e.clientX;
    dragLastX.current = e.clientX;
    dragLastTime.current = e.timeStamp;
    dragVelocity.current = 0;
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || dragStartX.current === null) return;
    const now = e.timeStamp;
    dragVelocity.current = calculateVelocity(
      e.clientX,
      dragLastX.current,
      now,
      dragLastTime.current
    );
    dragLastX.current = e.clientX;
    dragLastTime.current = now;
    setDragX(e.clientX - dragStartX.current);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    dragStartX.current = null;
    dragLastX.current = null;
    dragLastTime.current = null;
    const finalX = dragX;
    const velocity = dragVelocity.current;
    dragVelocity.current = 0;
    setDragX(0);
    const action = evaluateSwipe(finalX, velocity);
    if (action === "keep") advance(true);
    else if (action === "skip") advance(false);
  };

  const handleSpin = useCallback(() => {
    if (isSpinning || kept.length < 1) return;
    const outcome = computeSpinOutcome(kept, rotation);
    if (!outcome) return;
    setIsSpinning(true);
    setRotation(outcome.nextRotation);
    spinTimeoutRef.current = window.setTimeout(() => {
      setWinner(outcome.winner);
      setIsSpinning(false);
      setPhase("result");
      spinTimeoutRef.current = null;
    }, SPIN_DURATION_MS);
  }, [isSpinning, kept, rotation]);

  const handleReset = useCallback(() => {
    setPhase("swipe");
    setKept([]);
    setCurrentIndex(0);
    setWinner(null);
    setRotation(0);
    setIsSpinning(false);
    setDragX(0);
  }, []);

  if (isLoading) {
    return <EmptyState>Loading movies…</EmptyState>;
  }

  if (candidates.length === 0) {
    return <EmptyState>Add movies to your watchlist to play.</EmptyState>;
  }

  if (phase === "result" && winner) {
    return (
      <div className={"spin-swipe-wrapper"}>
        <ResultScreen
          winner={winner}
          onReset={handleReset}
          onWinnerClick={setModalMovie}
        />
        {modalMovie && (
          <React.Suspense fallback={null}>
            <MovieDetailsModal
              movie={modalMovie}
              isOpen={!!modalMovie}
              onClose={() => setModalMovie(null)}
            />
          </React.Suspense>
        )}
      </div>
    );
  }

  if (phase === "spin") {
    return (
      <div className={"spin-swipe-wrapper"}>
        <SpinWheel
          kept={kept}
          rotation={rotation}
          isSpinning={isSpinning}
          onSpin={handleSpin}
        />
      </div>
    );
  }

  return (
    <div className={"spin-swipe-wrapper"}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.85rem",
          padding: "0.75rem 1rem 1rem",
          userSelect: "none",
          position: "relative",
        }}
      >
        <ProgressBar
          current={currentIndex}
          total={candidates.length}
          kept={kept.length}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.85rem",
            padding: "0.75rem 1rem 1rem",
            userSelect: "none",
            position: "relative",
          }}
        >
          <ProgressBar
            current={currentIndex}
            total={candidates.length}
            kept={kept.length}
          />

          <div
            style={{
              position: "relative",
              width: "100%",
              height: 330,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {isDone ? (
              <DoneCard kept={kept.length} onReset={handleReset} />
            ) : (
              <>
                {nextMovie && (
                  <div
                    aria-hidden
                    style={{
                      position: "absolute",
                      width: 220,
                      height: 310,
                      borderRadius: 16,
                      background: nextMovie.posterUrl
                        ? `url(${nextMovie.posterUrl}) center / cover`
                        : "var(--color-surface-2)",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                      transform: "scale(0.93) translateY(12px)",
                      opacity: 0.55,
                    }}
                  />
                )}

                {currentMovie && (
                  <MovieCard
                    movie={currentMovie}
                    dragX={dragX}
                    isDragging={isDragging}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onDetailsClick={setModalMovie}
                  />
                )}
              </>
            )}
          </div>

          {!isDone && (
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <ActionButton
                color="#ef4444"
                onClick={() => advance(false)}
                label="Skip"
                icon="❌"
              />
              <ActionButton
                color="#22c55e"
                onClick={() => advance(true)}
                label="Keep"
                icon="✅"
              />
            </div>
          )}

          {kept.length > 0 && (
            <button
              type="button"
              onClick={() => setPhase("spin")}
              style={{
                padding: "0.7rem 1.7rem",
                background: "var(--color-accent)",
                border: "none",
                borderRadius: 999,
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "0.88rem",
                letterSpacing: "0.03em",
              }}
            >
              🎰 Spin
            </button>
          )}

          {modalMovie && (
            <React.Suspense fallback={null}>
              <MovieDetailsModal
                movie={modalMovie}
                isOpen={!!modalMovie}
                onClose={() => setModalMovie(null)}
              />
            </React.Suspense>
          )}
        </div>
      </div>
    </div>
  );
};

function ProgressBar({
  current,
  total,
  kept,
}: {
  current: number;
  total: number;
  kept: number;
}) {
  const pct = total > 0 ? (current / total) * 100 : 0;

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "0.3rem",
        }}
      >
        <span
          style={{ color: "var(--color-text-secondary)", fontSize: "0.7rem" }}
        >
          {current} / {total}
        </span>
        <span
          style={{
            color: "#22c55e",
            fontSize: "0.7rem",
            fontWeight: 700,
          }}
        >
          ✅ {kept} kept
        </span>
      </div>
      <div
        style={{
          width: "100%",
          height: 4,
          background: "rgba(255,255,255,0.08)",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: "var(--color-accent)",
            borderRadius: 999,
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}

function ActionButton({
  color,
  onClick,
  label,
  icon,
}: {
  color: string;
  onClick: () => void;
  label: string;
  icon: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        width: 62,
        height: 62,
        borderRadius: "50%",
        background: `${color}1a`,
        border: `2px solid ${color}55`,
        color,
        fontSize: "1.35rem",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "transform 0.12s ease, background 0.12s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = `${color}30`;
        e.currentTarget.style.transform = "scale(1.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = `${color}1a`;
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {icon}
    </button>
  );
}

function DoneCard({ kept, onReset }: { kept: number; onReset: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.85rem",
        width: 220,
        height: 310,
        background: "var(--color-surface-1)",
        borderRadius: 16,
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      }}
    >
      <span style={{ color: "var(--color-accent)", display: "inline-flex" }}>
        {kept === 0 ? <FilmIcon size={40} /> : <SparklesIcon size={40} />}
      </span>
      <p
        style={{
          color: "var(--color-text-primary)",
          fontWeight: 700,
          textAlign: "center",
          fontSize: "1rem",
          margin: 0,
        }}
      >
        {kept === 0
          ? "Nothing kept!"
          : `${kept} movie${kept !== 1 ? "s" : ""} in the pool`}
      </p>
      {kept === 0 && (
        <button
          type="button"
          onClick={onReset}
          aria-label="Try again"
          title="Try again"
          style={{
            padding: "0.45rem 1.1rem",
            borderRadius: 999,
            border: "none",
            background: "var(--color-accent)",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "0.82rem",
          }}
        >
          Try Again
        </button>
      )}
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "2rem",
        textAlign: "center",
        color: "var(--color-text-secondary)",
        fontSize: "0.9rem",
      }}
    >
      {children}
    </div>
  );
}

export default SpinSwipeGame;
