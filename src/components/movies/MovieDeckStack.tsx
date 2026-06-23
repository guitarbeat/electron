import React, { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useMotionTemplate,
  type MotionValue,
} from "motion/react";
import type { Movie } from "@/shared/types";

const CARD_W = 240;
const CARD_H = 360;
const INCREMENT_Y = 10;
const INCREMENT_Z = 10;
const SCROLL_STEP_PX = 108;
const MAX_FAN_DEG = 16;
const MAX_DOT_COUNT = 16;

const fanAngleFor = (index: number, total: number) => {
  const center = (total - 1) / 2;
  const spread = total > 12 ? 3.5 : 7;
  return Math.max(-MAX_FAN_DEG, Math.min(MAX_FAN_DEG, (index - center) * spread));
};

interface DeckCardProps {
  movie: Movie;
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
}

const DeckCard: React.FC<DeckCardProps> = ({
  movie,
  index,
  total,
  scrollYProgress,
}) => {
  const start = index / (total + 1);
  const end = (index + 1) / (total + 1);
  const fanAngle = fanAngleFor(index, total);
  const rotateStart = Math.max(0, start - 0.5);
  const rotateEnd = Math.min(0.99, end / 1.3);

  const y = useTransform(scrollYProgress, [start, end], ["0%", "-175%"]);
  const rotate = useTransform(
    scrollYProgress,
    [rotateStart, rotateEnd],
    [fanAngle, 0],
  );
  const opacity = useTransform(scrollYProgress, [end - 0.04, end], [1, 0]);

  const z = index * INCREMENT_Z;
  const transform = useMotionTemplate`perspective(1200px) translateZ(${z}px) translateY(${y}) rotate(${rotate}deg)`;

  return (
    <motion.div
      style={{
        position: "absolute",
        top: index * INCREMENT_Y,
        left: 0,
        right: 0,
        height: CARD_H,
        transform,
        zIndex: (total - index) * 10,
        opacity,
        willChange: "transform, opacity",
        backfaceVisibility: "hidden",
        borderRadius: "1rem",
        overflow: "hidden",
        boxShadow:
          "0 22px 56px rgba(0,0,0,0.72), 0 8px 20px rgba(0,0,0,0.48), 0 0 0 0.5px rgba(200,215,255,0.08)",
      }}
    >
      {movie.posterUrl ? (
        <img
          src={movie.posterUrl}
          alt={movie.title}
          width={CARD_W}
          height={CARD_H}
          loading={index === 0 ? "eager" : "lazy"}
          decoding="async"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
          draggable={false}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(165deg, rgba(18,28,66,0.95), rgba(6,10,28,0.98))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "3rem",
          }}
        >
          🎬
        </div>
      )}

      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(to top, rgba(3,6,18,0.96) 0%, rgba(3,6,18,0.22) 48%, transparent 68%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background:
            "linear-gradient(90deg, transparent 0%, var(--color-accent) 30%, var(--color-accent) 70%, transparent 100%)",
          opacity: 0.92,
          boxShadow: "0 2px 12px rgba(244,114,182,0.5)",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: "0.9rem",
          left: "0.9rem",
          right: "0.9rem",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "rgba(238,242,255,0.97)",
            fontFamily: "var(--font-heading)",
            fontSize: "0.85rem",
            fontWeight: 700,
            lineHeight: 1.25,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textShadow: "0 1px 8px rgba(0,0,0,0.9), 0 0 24px rgba(0,0,0,0.6)",
          }}
        >
          {movie.title}
        </p>
        {(movie.year || movie.imdbRating) && (
          <p
            style={{
              margin: "0.2rem 0 0",
              color: "rgba(148,163,200,0.82)",
              fontSize: "0.72rem",
              textShadow: "0 1px 6px rgba(0,0,0,0.8)",
            }}
          >
            {[movie.year, movie.imdbRating ? `★ ${movie.imdbRating}` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </div>
    </motion.div>
  );
};

const DotIndicator: React.FC<{
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
}> = ({ index, total, scrollYProgress }) => {
  const start = index / (total + 1);
  const end = (index + 1) / (total + 1);
  const scale = useTransform(
    scrollYProgress,
    [start, (start + end) / 2, end],
    [1, 1.7, 1],
  );
  const opacity = useTransform(
    scrollYProgress,
    [start, (start + end) / 2, end],
    [0.28, 1, 0.28],
  );
  const glowOpacity = useTransform(
    scrollYProgress,
    [start, (start + end) / 2, end],
    [0, 1, 0],
  );

  return (
    <motion.div
      style={{
        position: "relative",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <motion.div
        style={{
          position: "absolute",
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "var(--color-accent)",
          filter: "blur(5px)",
          opacity: glowOpacity,
          pointerEvents: "none",
        }}
      />
      <motion.div
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "var(--color-accent)",
          scale,
          opacity,
          position: "relative",
          boxShadow: "0 0 6px rgba(244,114,182,0.6)",
        }}
      />
    </motion.div>
  );
};

const DeckProgress: React.FC<{
  total: number;
  scrollYProgress: MotionValue<number>;
}> = ({ total, scrollYProgress }) => {
  const label = useTransform(scrollYProgress, (value) => {
    const active = Math.min(total, Math.max(1, Math.ceil(value * total) || 1));
    return `${active} / ${total}`;
  });

  return (
    <motion.p
      className="movie-deck-stack-scroll__counter"
      aria-live="polite"
      aria-atomic="true"
    >
      {label}
    </motion.p>
  );
};

interface Props {
  movies: Movie[];
}

const MovieDeckStack: React.FC<Props> = ({ movies }) => {
  const deck = movies;
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollYProgress = useMotionValue(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      const maxScroll = container.scrollHeight - container.clientHeight;
      scrollYProgress.set(maxScroll > 0 ? container.scrollTop / maxScroll : 0);
    };

    update();
    container.addEventListener("scroll", update, { passive: true });
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", update);
      resizeObserver.disconnect();
    };
  }, [deck.length, scrollYProgress]);

  if (deck.length < 2) return null;

  const stackHeight = CARD_H + (deck.length - 1) * INCREMENT_Y;
  const trackHeight = (deck.length + 1) * SCROLL_STEP_PX;
  const showDots = deck.length <= MAX_DOT_COUNT;

  return (
    <div
      ref={containerRef}
      className="movie-deck-stack-scroll"
      aria-label={`Scroll through ${deck.length} movies`}
    >
      <div
        className="movie-deck-stack-scroll__track"
        style={{ height: trackHeight }}
      >
        <div className="movie-deck-stack-scroll__stage">
          <p className="movie-deck-stack-scroll__hint" aria-hidden="true">
            ↓ Scroll to browse
          </p>

          <div
            className="movie-deck-stack-scroll__deck"
            style={{ height: stackHeight }}
          >
            <div className="movie-deck-stack-scroll__glow" aria-hidden="true" />
            {deck.map((movie, i) => (
              <DeckCard
                key={movie.id}
                movie={movie}
                index={i}
                total={deck.length}
                scrollYProgress={scrollYProgress}
              />
            ))}
          </div>

          <div className="movie-deck-stack-scroll__meta">
            {showDots ? (
              <div className="movie-deck-stack-scroll__dots">
                {deck.map((_, i) => (
                  <DotIndicator
                    key={i}
                    index={i}
                    total={deck.length}
                    scrollYProgress={scrollYProgress}
                  />
                ))}
              </div>
            ) : null}
            <DeckProgress total={deck.length} scrollYProgress={scrollYProgress} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDeckStack;
