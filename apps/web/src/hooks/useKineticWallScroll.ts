import { useEffect, useRef, type MutableRefObject, type RefObject } from "react";

export interface KineticWallScrollOptions {
  columnCount: number;
  trackRefs: MutableRefObject<Array<HTMLDivElement | null>>;
  copyHeightsRef: MutableRefObject<number[]>;
  offsetsRef: MutableRefObject<number[]>;
  bandRefs: MutableRefObject<Array<HTMLDivElement | null>>;
  wallRef: RefObject<HTMLElement | null>;
  measureDependencies?: unknown[];
  isStatic?: boolean;
  baseAmbientSpeed?: number;
  friction?: number;
  parallaxVariance?: number;
  enabled?: boolean;
}

export function useKineticWallScroll({
  columnCount,
  trackRefs,
  copyHeightsRef,
  offsetsRef,
  bandRefs,
  isStatic = false,
  baseAmbientSpeed = 20,
  enabled = true,
}: KineticWallScrollOptions) {
  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Initialize copy heights and offsets if needed
    for (let i = 0; i < columnCount; i++) {
      if (offsetsRef.current[i] === undefined) {
        offsetsRef.current[i] = 0;
      }
      if (bandRefs.current[i]) {
        copyHeightsRef.current[i] = bandRefs.current[i]?.offsetHeight || 600;
      } else {
        copyHeightsRef.current[i] = 600;
      }
    }

    const animate = (time: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = time;
      const dt = Math.min(0.05, (time - lastTimeRef.current) / 1000);
      lastTimeRef.current = time;

      if (!isStatic) {
        for (let i = 0; i < columnCount; i++) {
          const track = trackRefs.current[i];
          if (!track) continue;

          const bandHeight = copyHeightsRef.current[i] || 600;
          const direction = i % 2 === 0 ? 1 : -1;
          const speed = baseAmbientSpeed * direction;

          let nextOffset = (offsetsRef.current[i] || 0) + speed * dt;
          nextOffset = ((nextOffset % bandHeight) + bandHeight) % bandHeight;

          offsetsRef.current[i] = nextOffset;
          track.style.transform = `translate3d(0, ${-nextOffset.toFixed(1)}px, 0)`;
        }
      }

      rafIdRef.current = requestAnimationFrame(animate);
    };

    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      lastTimeRef.current = null;
    };
  }, [columnCount, isStatic, baseAmbientSpeed, enabled, trackRefs, copyHeightsRef, offsetsRef, bandRefs]);
}

export default useKineticWallScroll;
