import { useRef, useEffect, useCallback } from 'react';

const TILT_MAX_DEG = 7;
const SCALE_ON_HOVER = 1.016;

export function useCardTilt<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const raf = useRef<number>(0);
  const prefersReduced = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReduced.current = mq.matches;
    const h = (e: MediaQueryListEvent) => { prefersReduced.current = e.matches; };
    mq.addEventListener('change', h);
    return () => {
      mq.removeEventListener('change', h);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  const onMouseEnter = useCallback(() => {
    if (prefersReduced.current) return;
    const el = ref.current;
    if (!el) return;
    el.style.transition = 'none';
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (prefersReduced.current) return;
    const clientX = e.clientX;
    const clientY = e.clientY;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = ((clientX - r.left) / r.width  - 0.5) * 2;
      const dy = ((clientY - r.top)  / r.height - 0.5) * 2;
      const rotY =  dx * TILT_MAX_DEG;
      const rotX = -dy * TILT_MAX_DEG;
      el.style.transform = `perspective(900px) rotateY(${rotY}deg) rotateX(${rotX}deg) scale3d(${SCALE_ON_HOVER},${SCALE_ON_HOVER},${SCALE_ON_HOVER})`;
      el.style.setProperty('--sheen-x', `${((dx + 1) / 2 * 100).toFixed(1)}%`);
      el.style.setProperty('--sheen-y', `${((dy + 1) / 2 * 100).toFixed(1)}%`);
    });
  }, []);

  const onMouseLeave = useCallback(() => {
    cancelAnimationFrame(raf.current);
    const el = ref.current;
    if (!el) return;
    el.style.transition = 'transform 0.55s cubic-bezier(0.34,1.56,0.64,1)';
    el.style.transform = '';
    el.style.removeProperty('--sheen-x');
    el.style.removeProperty('--sheen-y');
  }, []);

  return { ref, onMouseEnter, onMouseMove, onMouseLeave };
}
