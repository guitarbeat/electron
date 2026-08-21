import { useEffect, useRef } from "react";
import { animate, stagger } from "motion/react";
import { hasHoverCapability, prefersReducedMotion } from "@/utils/motionPreference";

/**
 * Cinematic card drop-in entrance using motion's animate + stagger.
 * Skipped on mobile/coarse pointers and when reduced motion is requested.
 */
export function useCinematicEntrance(
  containerRef: React.RefObject<HTMLElement | null>,
  ready: boolean,
  selector: string,
  delay = 0,
) {
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (
      !ready ||
      hasAnimated.current ||
      prefersReducedMotion() ||
      !hasHoverCapability()
    ) {
      return;
    }

    let cancelled = false;
    let observer: MutationObserver | undefined;

    function run(): boolean {
      const container = containerRef.current;
      if (!container || hasAnimated.current) return false;

      const targets = Array.from(
        container.querySelectorAll<HTMLElement>(selector),
      );
      if (targets.length === 0) return false;

      hasAnimated.current = true;

      // Set initial state
      for (const el of targets) {
        el.style.transform = "translateY(72px) scale(0.95) rotateX(-10deg)";
        el.style.opacity = "0";
        el.style.filter = "blur(6px)";
      }

      const staggerAmount = Math.min(0.35, targets.length * 0.05);

      animate(
        targets,
        {
          y: [72, 0],
          opacity: [0, 1],
          scale: [0.95, 1],
          filter: ["blur(6px)", "blur(0px)"],
        },
        {
          duration: 0.55,
          delay: stagger(staggerAmount / Math.max(targets.length - 1, 1), { startDelay: delay }),
          ease: [0.16, 1, 0.3, 1],
          onComplete: () => {
            // Clean up inline styles after animation
            for (const el of targets) {
              el.style.removeProperty("transform");
              el.style.removeProperty("filter");
            }
          },
        },
      );

      return true;
    }

    if (!run()) {
      const container = containerRef.current;
      if (container) {
        observer = new MutationObserver(() => {
          if (!cancelled && run()) observer?.disconnect();
        });
        observer.observe(container, { childList: true, subtree: true });
      }
    }

    const cleanupContainer = containerRef.current;
    return () => {
      cancelled = true;
      observer?.disconnect();
      if (!hasAnimated.current) {
        cleanupContainer?.querySelectorAll<HTMLElement>(selector).forEach((el) => {
          el.style.removeProperty("transform");
          el.style.removeProperty("opacity");
          el.style.removeProperty("filter");
        });
      }
    };
  }, [ready, containerRef, selector, delay]);
}
