import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Cinematic card drop-in entrance — mirrors the hero's Phase 1 technique.
 *
 * Robustness notes:
 * - Does NOT rely on CSS to pre-hide elements. GSAP.set() runs synchronously
 *   before the first paint, so there is no flash of visible content.
 * - If the first effect run finds no targets (DOM not yet committed), a
 *   MutationObserver watches the container and fires the animation once
 *   the selector matches, then disconnects.
 * - hasAnimated ref prevents double-fires.
 */
export function useCinematicEntrance(
  containerRef: React.RefObject<HTMLElement | null>,
  ready: boolean,
  selector: string,
  delay = 0,
) {
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!ready || hasAnimated.current) return;

    function run() {
      const container = containerRef.current;
      if (!container || hasAnimated.current) return;

      const targets = Array.from(
        container.querySelectorAll<HTMLElement>(selector),
      );
      if (targets.length === 0) return false; // signal: not ready yet

      hasAnimated.current = true;

      if (prefersReducedMotion()) {
        gsap.set(targets, { clearProps: "all" });
        return true;
      }

      // Set initial hidden state synchronously (before browser paints)
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

    // Try immediately (DOM may already be committed)
    if (run()) return;

    // DOM not ready yet — observe until selector matches, then fire once
    const container = containerRef.current;
    if (!container) return;

    const observer = new MutationObserver(() => {
      if (run()) observer.disconnect();
    });
    observer.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      // Safety: if animation never fired, ensure elements are visible
      if (!hasAnimated.current) {
        const stuck = container.querySelectorAll<HTMLElement>(selector);
        if (stuck.length > 0) gsap.set(stuck, { clearProps: "all" });
      }
    };
  }, [ready, containerRef, selector, delay]);
}
