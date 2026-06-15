import React, { useRef, useMemo } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionTemplate,
  type MotionValue,
} from "motion/react";
import type { Movie } from "@/shared/types";

const DECK_MAX = 5;
const CARD_W = 240;
const CARD_H = 360; // 2:3 ratio
const INCREMENT_Y = 10; // px vertical offset per card in stack
const INCREMENT_Z = 10; // px z-depth per card

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
  // Scroll range for this card — mirrors the reference component math:
  //   start = index / (total + 1)
  //   end   = (index + 1) / (total + 1)
  const start = index / (total + 1);
  const end = (index + 1) / (total + 1);

  // Fan angle: cards start spread like a hand of cards, converge to 0 on scroll
  const fanAngle = (index - (total - 1) / 2) * 7;
  const rotateStart = Math.max(0, start - 0.5);
  const rotateEnd = Math.min(0.99, end / 1.3);

  // translateY: card flies up and out
  const y = useTransform(scrollYProgress, [start, end], ["0%", "-175%"]);
  // rotate: card straightens from fan angle as it comes into focus
  const rotate = useTransform(
    scrollYProgress,
    [rotateStart, rotateEnd],
    [fanAngle, 0],
  );
  // opacity: card fades at the very end of its range
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
      {/* Poster image */}
      {movie.posterUrl ? (
        <img
          src={movie.posterUrl}
          alt={movie.title}
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

      {/* Bottom gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(to top, rgba(3,6,18,0.96) 0%, rgba(3,6,18,0.22) 48%, transparent 68%)",
        }}
      />

      {/* Top stripe: addedBy user color hint */}
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

      {/* Title + meta */}
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

// ─── Animated dot indicator ───────────────────────────────────────────────────
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
      {/* Glow bloom behind active dot */}
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

// ─── Main component ───────────────────────────────────────────────────────────
interface Props {
  movies: Movie[];
}

const MovieDeckStack: React.FC<Props> = ({ movies }) => {
  const deck = useMemo(() => movies.slice(0, DECK_MAX), [movies]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start center", "end end"],
  });

  // Need at least 2 cards to make a stack worth showing
  if (deck.length < 2) return null;

  const stackHeight = CARD_H + (deck.length - 1) * INCREMENT_Y;

  return (
    <div
      ref={scrollRef}
      className="movie-deck-stack-scroll"
      style={{ position: "relative", minHeight: "140vh" }}
    >
      <div
        style={{
          position: "sticky",
          top: "5rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.1rem",
          paddingBlock: "1.25rem",
        }}
      >
        {/* Eyebrow hint */}
        <p
          style={{
            margin: 0,
            color: "rgba(244,114,182,0.5)",
            fontFamily: "var(--font-heading)",
            fontSize: "0.64rem",
            fontWeight: 600,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            userSelect: "none",
            textShadow: "0 0 12px rgba(244,114,182,0.3)",
          }}
        >
          ↓ &nbsp;Scroll to browse
        </p>

        {/* The card deck container */}
        <div
          style={{ position: "relative", width: CARD_W, height: stackHeight }}
        >
          {/* Ambient glow behind the stack */}
          <div
            style={{
              position: "absolute",
              bottom: -32,
              left: "50%",
              transform: "translateX(-50%)",
              width: CARD_W * 0.8,
              height: 80,
              background:
                "radial-gradient(ellipse at center, rgba(244,114,182,0.22) 0%, transparent 72%)",
              filter: "blur(16px)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
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

        {/* Progress dots */}
        <div
          style={{
            display: "flex",
            gap: "0.42rem",
            alignItems: "center",
            marginTop: "0.25rem",
          }}
        >
          {deck.map((_, i) => (
            <DotIndicator
              key={i}
              index={i}
              total={deck.length}
              scrollYProgress={scrollYProgress}
            />
          ))}
        </div>

        {/* Count eyebrow */}
        <p
          style={{
            margin: 0,
            color: "rgba(148,163,200,0.4)",
            fontFamily: "var(--font-heading)",
            fontSize: "0.62rem",
            letterSpacing: "0.08em",
          }}
        >
          {deck.length} of {movies.length} in queue
        </p>
      </div>
    </div>
  );
};

export default MovieDeckStack;
