/**
 * HandWritingText
 *
 * Animates SVG stroke paths to simulate handwriting being drawn on screen.
 * Each child <path> inside the SVG receives a staggered pathLength animation
 * driven by framer-motion so strokes appear one after another.
 *
 * The component exposes an `accentColor` prop that defaults to the app's
 * `--color-accent` CSS variable so it automatically tracks the active theme
 * (movies pink / places teal).
 *
 * Usage:
 *   <HandWritingText>
 *     <svg viewBox="0 0 400 80" ...>
 *       <path d="M 10 40 Q 80 10 160 40 ..." />
 *     </svg>
 *   </HandWritingText>
 *
 * Or use the built-in preset phrases:
 *   <HandWritingText text="Movie night" />
 */

import React, { useId } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Preset SVG paths for common phrases used in the app
// ---------------------------------------------------------------------------

/**
 * Hand-drawn SVG path data for a few preset phrases.
 * Each entry is a tuple of [viewBox, paths[]] where every path is a <path d>
 * string. The paths are designed to look like casual cursive handwriting.
 */
const PRESET_PATHS: Record<
  string,
  { viewBox: string; paths: string[]; width: number; height: number }
> = {
  "movie night": {
    viewBox: "0 0 340 56",
    width: 340,
    height: 56,
    paths: [
      // M
      "M 8 44 L 8 12 L 22 34 L 36 12 L 36 44",
      // o
      "M 52 28 C 52 18 68 18 68 28 C 68 38 52 38 52 28",
      // v
      "M 76 20 L 84 40 L 92 20",
      // i
      "M 98 20 L 98 40 M 98 14 L 98 16",
      // e
      "M 116 30 L 104 30 C 104 20 120 18 120 28 C 120 40 104 42 104 38",
      // space gap (no path)
      // n
      "M 132 40 L 132 20 C 132 16 148 14 148 22 L 148 40",
      // i
      "M 156 20 L 156 40 M 156 14 L 156 16",
      // g
      "M 176 20 C 176 10 160 10 160 22 C 160 34 176 34 176 22 L 176 44 C 176 50 160 52 160 46",
      // h
      "M 184 12 L 184 40 M 184 26 C 184 20 200 18 200 26 L 200 40",
      // t
      "M 208 16 L 208 40 C 208 44 212 46 216 44 M 204 24 L 218 24",
    ],
  },
  "our picks": {
    viewBox: "0 0 260 56",
    width: 260,
    height: 56,
    paths: [
      // O
      "M 28 28 C 28 12 8 12 8 28 C 8 44 28 44 28 28",
      // u
      "M 36 20 L 36 34 C 36 40 52 40 52 34 L 52 20",
      // r
      "M 60 40 L 60 20 C 62 14 72 16 74 20",
      // space
      // p
      "M 86 20 L 86 48 M 86 20 C 86 10 102 10 102 20 C 102 30 86 32 86 28",
      // i
      "M 110 20 L 110 40 M 110 14 L 110 16",
      // c
      "M 130 22 C 126 16 114 16 114 28 C 114 40 126 42 130 36",
      // k
      "M 138 12 L 138 40 M 138 28 L 150 20 M 138 28 L 150 40",
      // s
      "M 168 22 C 164 16 154 18 154 24 C 154 30 168 28 168 34 C 168 40 158 42 154 38",
    ],
  },
  "watch together": {
    viewBox: "0 0 380 56",
    width: 380,
    height: 56,
    paths: [
      // W
      "M 8 12 L 18 44 L 28 24 L 38 44 L 48 12",
      // a
      "M 68 22 C 68 14 56 14 56 24 C 56 40 72 38 72 28 L 72 40",
      // t
      "M 80 16 L 80 40 C 80 44 84 46 88 44 M 76 24 L 90 24",
      // c
      "M 108 22 C 104 16 92 16 92 28 C 92 40 104 42 108 36",
      // h
      "M 116 12 L 116 40 M 116 26 C 116 20 132 18 132 26 L 132 40",
      // space
      // t
      "M 148 16 L 148 40 C 148 44 152 46 156 44 M 144 24 L 158 24",
      // o
      "M 176 28 C 176 18 160 18 160 28 C 160 38 176 38 176 28",
      // g
      "M 196 20 C 196 10 180 10 180 22 C 180 34 196 34 196 22 L 196 44 C 196 50 180 52 180 46",
      // e
      "M 214 30 L 202 30 C 202 20 218 18 218 28 C 218 40 202 42 202 38",
      // t
      "M 226 16 L 226 40 C 226 44 230 46 234 44 M 222 24 L 236 24",
      // h
      "M 242 12 L 242 40 M 242 26 C 242 20 258 18 258 26 L 258 40",
      // e
      "M 276 30 L 264 30 C 264 20 280 18 280 28 C 280 40 264 42 264 38",
      // r
      "M 288 40 L 288 20 C 290 14 300 16 302 20",
    ],
  },
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HandWritingTextProps {
  /**
   * Preset phrase to render as handwriting. One of the built-in phrases, or
   * omit to provide your own SVG children.
   */
  text?: keyof typeof PRESET_PATHS;
  /**
   * Pass custom SVG children directly when the preset phrases don't cover
   * your use case. The component will animate every <path> inside.
   */
  children?: React.ReactNode;
  /** Override accent color. Defaults to the app's --color-accent token. */
  accentColor?: string;
  /** Stroke width for the paths. Defaults to 2.5. */
  strokeWidth?: number;
  /** Duration (seconds) for each individual stroke. Defaults to 0.6. */
  strokeDuration?: number;
  /** Stagger delay (seconds) between successive strokes. Defaults to 0.12. */
  staggerDelay?: number;
  /** Whether the animation triggers once when the component enters the viewport. */
  triggerOnView?: boolean;
  className?: string;
  svgClassName?: string;
}

// ---------------------------------------------------------------------------
// AnimatedPath — a single motion path
// ---------------------------------------------------------------------------

interface AnimatedPathProps {
  d: string;
  strokeColor: string;
  strokeWidth: number;
  duration: number;
  delay: number;
}

function AnimatedPath({
  d,
  strokeColor,
  strokeWidth,
  duration,
  delay,
}: AnimatedPathProps) {
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{
        pathLength: {
          delay,
          duration,
          ease: [0.43, 0.13, 0.23, 0.96],
        },
        opacity: {
          delay,
          duration: 0.01,
        },
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// HandWritingText
// ---------------------------------------------------------------------------

export function HandWritingText({
  text,
  children,
  accentColor = "var(--color-accent)",
  strokeWidth = 2.5,
  strokeDuration = 0.6,
  staggerDelay = 0.12,
  triggerOnView = true,
  className,
  svgClassName,
}: HandWritingTextProps) {
  const uid = useId();
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });

  const shouldAnimate = triggerOnView ? isInView : true;

  // ── Preset mode ──────────────────────────────────────────────────────────
  if (text && PRESET_PATHS[text]) {
    const { viewBox, paths, width, height } = PRESET_PATHS[text];

    return (
      <div ref={ref} className={cn("inline-block", className)}>
        <svg
          viewBox={viewBox}
          width={width}
          height={height}
          className={cn("overflow-visible", svgClassName)}
          aria-label={text}
          role="img"
        >
          {shouldAnimate &&
            paths.map((d, i) => (
              <AnimatedPath
                key={`${uid}-${i}`}
                d={d}
                strokeColor={accentColor}
                strokeWidth={strokeWidth}
                duration={strokeDuration}
                delay={i * staggerDelay}
              />
            ))}
        </svg>
      </div>
    );
  }

  // ── Custom children mode ─────────────────────────────────────────────────
  return (
    <div ref={ref} className={cn("inline-block", className)}>
      {shouldAnimate && children}
    </div>
  );
}

export { HandWritingText as Component };
export { PRESET_PATHS };
