import { useCallback, useEffect, useRef } from "react";

export interface ChromaSpotlightOptions {
  radius?: number;
  damping?: number;
  fadeOut?: number;
  ease?: string;
}

export function useChromaSpotlight({
  radius = 280,
  damping = 0.45,
  fadeOut = 0.6,
  ease = "power3.out",
}: ChromaSpotlightOptions = {}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const fadeRef = useRef<HTMLDivElement | null>(null);
  const setX = useRef<((value: number) => void) | null>(null);
  const setY = useRef<((value: number) => void) | null>(null);
  const pos = useRef({ x: 0, y: 0 });
  const enabled = useRef(true);
  const gsapRef = useRef<typeof import("gsap").gsap | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const hoverMq = window.matchMedia("(hover: hover)");
    const syncEnabled = () => {
      enabled.current = !motionMq.matches && hoverMq.matches;
      el.style.setProperty("--chroma-enabled", enabled.current ? "1" : "0");
    };
    syncEnabled();
    motionMq.addEventListener("change", syncEnabled);
    hoverMq.addEventListener("change", syncEnabled);

    let cancelled = false;

    if (enabled.current) {
      void import("gsap").then(({ gsap }) => {
        if (cancelled || !rootRef.current) return;

        gsapRef.current = gsap;
        el.style.setProperty("--r", `${radius}px`);
        const setXAxis = gsap.quickSetter(el, "--x", "px") as (
          value: number,
        ) => void;
        const setYAxis = gsap.quickSetter(el, "--y", "px") as (
          value: number,
        ) => void;
        setX.current = setXAxis;
        setY.current = setYAxis;

        const { width, height } = el.getBoundingClientRect();
        pos.current = { x: width / 2, y: height / 2 };
        setXAxis(pos.current.x);
        setYAxis(pos.current.y);
      });
    }

    return () => {
      cancelled = true;
      motionMq.removeEventListener("change", syncEnabled);
      hoverMq.removeEventListener("change", syncEnabled);
    };
  }, [radius]);

  const moveTo = useCallback(
    (x: number, y: number) => {
      const gsap = gsapRef.current;
      if (!enabled.current || !gsap) return;
      gsap.to(pos.current, {
        x,
        y,
        duration: damping,
        ease,
        onUpdate: () => {
          setX.current?.(pos.current.x);
          setY.current?.(pos.current.y);
        },
        overwrite: true,
      });
    },
    [damping, ease],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!enabled.current) return;
      const root = rootRef.current;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      moveTo(e.clientX - rect.left, e.clientY - rect.top);
      gsapRef.current?.to(fadeRef.current, {
        opacity: 0,
        duration: 0.25,
        overwrite: true,
      });
    },
    [moveTo],
  );

  const handlePointerLeave = useCallback(() => {
    if (!enabled.current) return;
    gsapRef.current?.to(fadeRef.current, {
      opacity: 1,
      duration: fadeOut,
      overwrite: true,
    });
  }, [fadeOut]);

  return {
    rootRef,
    fadeRef,
    handlePointerMove,
    handlePointerLeave,
  };
}
