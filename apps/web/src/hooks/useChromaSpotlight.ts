import { useCallback, useEffect, useRef } from "react";
import {
  isChromaSpotlightEnabled,
  subscribeMotionPreferences,
} from "@/utils";

export interface ChromaSpotlightOptions {
  radius?: number;
  /** Lerp factor per frame (0–1). Higher = snappier. */
  damping?: number;
  fadeOut?: number;
}

/**
 * Tracks pointer position and updates CSS custom properties --x/--y on the
 * root element for the chroma spotlight effect. Uses a rAF lerp loop instead
 * of GSAP to avoid the dependency while keeping the same smoothing behaviour.
 */
export function useChromaSpotlight({
  radius = 280,
  damping = 0.12,
  fadeOut = 0.6,
}: ChromaSpotlightOptions = {}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const fadeRef = useRef<HTMLDivElement | null>(null);

  // Target position (where the pointer is)
  const target = useRef({ x: 0, y: 0 });
  // Current interpolated position
  const current = useRef({ x: 0, y: 0 });

  const enabled = useRef(true);
  const frameRef = useRef<number | null>(null);

  // Start the rAF lerp loop
  const startLoop = useCallback((el: HTMLDivElement) => {
    if (frameRef.current !== null) return;

    function tick() {
      const dx = target.current.x - current.current.x;
      const dy = target.current.y - current.current.y;

      // Only keep looping while there's meaningful movement
      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        current.current.x += dx * damping;
        current.current.y += dy * damping;
        el.style.setProperty("--x", `${current.current.x}px`);
        el.style.setProperty("--y", `${current.current.y}px`);
        frameRef.current = requestAnimationFrame(tick);
      } else {
        // Snap to target and stop
        current.current.x = target.current.x;
        current.current.y = target.current.y;
        el.style.setProperty("--x", `${current.current.x}px`);
        el.style.setProperty("--y", `${current.current.y}px`);
        frameRef.current = null;
      }
    }

    frameRef.current = requestAnimationFrame(tick);
  }, [damping]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const syncEnabled = () => {
      enabled.current = isChromaSpotlightEnabled();
      el.style.setProperty("--chroma-enabled", enabled.current ? "1" : "0");
    };
    syncEnabled();

    // Initialise position to element center
    const { width, height } = el.getBoundingClientRect();
    target.current = { x: width / 2, y: height / 2 };
    current.current = { ...target.current };
    el.style.setProperty("--r", `${radius}px`);
    el.style.setProperty("--x", `${current.current.x}px`);
    el.style.setProperty("--y", `${current.current.y}px`);

    const unsubscribe = subscribeMotionPreferences(syncEnabled);
    return () => {
      unsubscribe();
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [radius]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!enabled.current) return;
      const root = rootRef.current;
      if (!root) return;

      const rect = root.getBoundingClientRect();
      target.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      // Show spotlight
      if (fadeRef.current) {
        fadeRef.current.style.transition = "opacity 0.25s ease";
        fadeRef.current.style.opacity = "0";
      }

      startLoop(root);
    },
    [startLoop],
  );

  const handlePointerLeave = useCallback(() => {
    if (!enabled.current || !fadeRef.current) return;
    const fade = fadeRef.current;
    fade.style.transition = `opacity ${fadeOut}s ease`;
    fade.style.opacity = "1";
  }, [fadeOut]);

  return { rootRef, fadeRef, handlePointerMove, handlePointerLeave };
}
