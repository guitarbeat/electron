import { useEffect, useRef } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/utils";

export interface UseCrtEntranceAnimationOptions {
  enabled?: boolean;
  onComplete?: () => void;
  duration?: number;
}

/**
 * GSAP entrance animation that mimics a Y2K-era CRT monitor power-on effect.
 *
 * Sequence:
 * 1. Initial State: Screen collapsed to a thin, bright horizontal electron line in the center.
 * 2. Phase 1 (Horizontal Beam Flare): Electron beam quickly stretches across full width with high brightness.
 * 3. Phase 2 (Vertical Raster Expansion): Vertical deflection coils charge, opening the raster lines top-to-bottom.
 * 4. Phase 3 (Phosphor Settle & Bloom): Glow and contrast soften into the standard display state.
 *
 * Automatically skips if `prefers-reduced-motion` is active or if running in non-browser environments.
 */
export function useCrtEntranceAnimation<T extends HTMLElement = HTMLDivElement>(
  options: UseCrtEntranceAnimationOptions = {},
) {
  const { enabled = true, onComplete, duration = 0.85 } = options;
  const elementRef = useRef<T | null>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (!enabled || hasAnimatedRef.current || typeof window === "undefined") {
      return undefined;
    }

    const target = elementRef.current;
    if (!target) {
      return undefined;
    }

    if (prefersReducedMotion()) {
      hasAnimatedRef.current = true;
      onComplete?.();
      return undefined;
    }

    hasAnimatedRef.current = true;

    // Use GSAP context for clean lifecycle scoping and automatic cleanup
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        onComplete: () => {
          gsap.set(target, {
            clearProps: "transform,opacity,filter,transformOrigin,willChange",
          });
          onComplete?.();
        },
      });

      // Initial CRT beam state (collapsed into a high-intensity center line)
      gsap.set(target, {
        transformOrigin: "50% 50%",
        opacity: 0,
        scaleX: 0,
        scaleY: 0.004,
        filter: "brightness(3.5) contrast(2) saturate(1.5)",
        willChange: "transform, opacity, filter",
      });

      // Phase 1: Cathode ray ignition - rapid horizontal stretch of electron line
      tl.to(target, {
        opacity: 1,
        scaleX: 1,
        duration: duration * 0.28,
        ease: "power4.out",
      })
        // Phase 2: Vertical deflection opening - expands vertically with CRT raster flare
        .to(
          target,
          {
            scaleY: 1,
            filter: "brightness(1.8) contrast(1.4) saturate(1.2)",
            duration: duration * 0.42,
            ease: "power3.inOut",
          },
          "-=0.04",
        )
        // Phase 3: Phosphor bloom settle - stabilizes contrast and brightness
        .to(target, {
          filter: "brightness(1) contrast(1) saturate(1)",
          duration: duration * 0.3,
          ease: "power2.out",
        });
    }, target);

    return () => {
      ctx.revert();
    };
  }, [enabled, duration, onComplete]);

  return { ref: elementRef };
}
