import { useEffect, useRef } from "react";
import { hasHoverCapability, prefersReducedMotion } from "@/utils/motionPreference";

/**
 * Cinematic card drop-in entrance — mirrors the hero's Phase 1 technique.
 *
 * Skipped on mobile/coarse pointers and when reduced motion is requested.
 * GSAP loads on demand so the main bundle stays lean.
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

    void import("gsap").then(({ gsap }) => {
      if (cancelled) return;

      function run() {
        const container = containerRef.current;
        if (!container || hasAnimated.current) return false;

        const targets = Array.from(
          container.querySelectorAll<HTMLElement>(selector),
        );
        if (targets.length === 0) return false;

        hasAnimated.current = true;

        gsap.set(targets, {
          y: 72,
          autoAlpha: 0,
          scale: 0.95,
          rotationX: -10,
          transformOrigin: "50% 100%",
          filter: "blur(6px)",
        });

        gsap.to(targets, {
          y: 0,
          autoAlpha: 1,
          scale: 1,
          rotationX: 0,
          filter: "blur(0px)",
          ease: "power3.out",
          duration: 0.55,
          delay,
          stagger: {
            amount: Math.min(0.35, targets.length * 0.05),
            ease: "power1.in",
          },
          clearProps: "filter,rotationX,scale",
          overwrite: true,
        });

        return true;
      }

      if (run()) return;

      const container = containerRef.current;
      if (!container) return;

      observer = new MutationObserver(() => {
        if (run()) observer?.disconnect();
      });
      observer.observe(container, { childList: true, subtree: true });
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
      if (!hasAnimated.current) {
        const container = containerRef.current;
        const stuck = container?.querySelectorAll<HTMLElement>(selector);
        stuck?.forEach((el) => {
          el.style.removeProperty("transform");
          el.style.removeProperty("opacity");
          el.style.removeProperty("filter");
        });
      }
    };
  }, [ready, containerRef, selector, delay]);
}
