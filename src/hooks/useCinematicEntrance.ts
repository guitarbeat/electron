import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Cinematic card drop-in entrance — mirrors the hero's Phase 1 technique.
 * Cards start buried below the viewport and shoot up into place with a
 * staggered expo.out, matching the CinematicLandingHero animation style.
 *
 * @param containerRef  Ref to the section/list wrapper that contains the cards
 * @param ready         When this flips to `true` the animation fires (once only)
 * @param selector      CSS selector for card elements inside the container
 * @param delay         Optional delay before the stagger begins (seconds)
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
    const container = containerRef.current;
    if (!container) return;

    const targets = container.querySelectorAll(selector);
    if (targets.length === 0) return;

    hasAnimated.current = true;

    if (prefersReducedMotion()) {
      gsap.set(targets, { autoAlpha: 1, clearProps: 'all' });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        {
          y: 110,
          autoAlpha: 0,
          scale: 0.91,
          rotationX: -18,
          transformOrigin: '50% 100%',
          filter: 'blur(12px)',
        },
        {
          y: 0,
          autoAlpha: 1,
          scale: 1,
          rotationX: 0,
          filter: 'blur(0px)',
          ease: 'expo.out',
          duration: 1.05,
          delay,
          stagger: {
            amount: Math.min(0.6, targets.length * 0.08),
            ease: 'power1.in',
          },
          clearProps: 'filter,rotationX,scale',
          overwrite: true,
        },
      );
    }, container);

    return () => ctx.revert();
  }, [ready, containerRef, selector, delay]);
}
