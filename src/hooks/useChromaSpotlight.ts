import { useCallback, useEffect, useRef } from "react";
import {
  isChromaSpotlightEnabled,
  subscribeMotionPreferences,
} from "@/utils/motionPreference";

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
  const frameRef = useRef<number | null>(null);
  const pendingPoint = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const syncEnabled = () => {
      enabled.current = isChromaSpotlightEnabled();
      el.style.setProperty("--chroma-enabled", enabled.current ? "1" : "0");
    };
    syncEnabled();

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

    const unsubscribe = subscribeMotionPreferences(syncEnabled);

    return () => {
      cancelled = true;
      unsubscribe();
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
      // Kill active GSAP tweens to prevent updates after unmount
      if (gsapRef.current) {
        gsapRef.current.killTweensOf(pos.current);
        if (fadeRef.current) {
          gsapRef.current.killTweensOf(fadeRef.current);
        }
      }
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
      pendingPoint.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        const point = pendingPoint.current;
        if (!point) return;
        moveTo(point.x, point.y);
        gsapRef.current?.to(fadeRef.current, {
          opacity: 0,
          duration: 0.25,
          overwrite: true,
        });
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
