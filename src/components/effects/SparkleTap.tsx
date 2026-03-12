import { useEffect, useRef, useState } from 'react';

const SPARKLE_GLYPHS = ['✦', '✧', '✺', '✹'];

function clamp(number: number, min: number, max: number) {
  return Math.min(max, Math.max(min, number));
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

interface SparkleTapProps {
  burstCount?: number;
}

const SparkleTap: React.FC<SparkleTapProps> = ({ burstCount = 7 }) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const pointersRef = useRef<Map<number, { x: number; y: number; timeMs: number }>>(new Map());

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReducedMotion(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);

    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (prefersReducedMotion) return undefined;

    const pointers = pointersRef.current;

    const spawnSparkles = (x: number, y: number) => {
      const safeCount = clamp(Math.round(burstCount), 3, 12);

      for (let index = 0; index < safeCount; index += 1) {
        const sparkle = document.createElement('span');
        sparkle.className = 'sparkle sparkle--y2k';
        sparkle.textContent = SPARKLE_GLYPHS[Math.floor(Math.random() * SPARKLE_GLYPHS.length)];

        const sizePx = randomBetween(9, 15);
        const driftX = randomBetween(-44, 44);
        const driftY = randomBetween(-64, -18);
        const durationSeconds = randomBetween(0.55, 0.9);

        sparkle.style.left = `${x}px`;
        sparkle.style.top = `${y}px`;
        sparkle.style.fontSize = `${sizePx}px`;
        sparkle.style.opacity = `${randomBetween(0.75, 1)}`;

        sparkle.style.setProperty('--sparkle-x-end', `calc(-50% + ${driftX}px)`);
        sparkle.style.setProperty('--sparkle-y-end', `calc(-50% + ${driftY}px)`);
        sparkle.style.setProperty('--sparkle-duration', `${durationSeconds}s`);

        document.body.appendChild(sparkle);
        window.setTimeout(() => sparkle.remove(), durationSeconds * 1000 + 80);
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') return;
      pointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
        timeMs: Date.now(),
      });
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') return;
      const start = pointers.get(event.pointerId);
      pointers.delete(event.pointerId);
      if (!start) return;

      const deltaX = event.clientX - start.x;
      const deltaY = event.clientY - start.y;
      const deltaDistance = Math.hypot(deltaX, deltaY);
      const elapsedMs = Date.now() - start.timeMs;

      const isTap = deltaDistance <= 10 && elapsedMs <= 650;
      if (!isTap) return;

      spawnSparkles(event.clientX, event.clientY);
    };

    const onPointerCancel = (event: PointerEvent) => {
      pointers.delete(event.pointerId);
    };

    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerCancel, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      pointers.clear();
    };
  }, [burstCount, prefersReducedMotion]);

  return null;
};

export default SparkleTap;
