import React, { useEffect, useMemo, useRef } from 'react';

const roundedSquareWave = (t: number, delta: number, amplitude: number, frequency: number) =>
  ((2 * amplitude) / Math.PI) * Math.atan(Math.sin(2 * Math.PI * t * frequency) / delta);

interface DotPoint {
  x: number;
  y: number;
  dist: number;
}

interface ChromaticDotFieldProps {
  className?: string;
  density?: number;
}

const ChromaticDotField: React.FC<ChromaticDotFieldProps> = ({ className, density = 1 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const points = useMemo<DotPoint[]>(() => {
    const width = Math.max(56, Math.round(96 * density));
    const height = Math.max(34, Math.round(58 * density));
    const next: DotPoint[] = [];

    for (let index = 0; index < width * height; index += 1) {
      const column = index % width;
      const row = Math.floor(index / width);

      const x = column - width / 2 + Math.random() * 0.25;
      const y = row - height / 2 + (column % 2) * 0.5 + Math.random() * 0.25;
      const radial = Math.hypot(x, y);
      const octagonOffset = Math.cos(Math.atan2(y, x) * 8) * 0.52;

      next.push({
        x,
        y,
        dist: radial + octagonOffset,
      });
    }

    return next;
  }, [density]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return undefined;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    let width = 0;
    let height = 0;

    const resize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      pixelRatio = Math.min(2, window.devicePixelRatio || 1);

      canvas.width = Math.max(1, Math.round(width * pixelRatio));
      canvas.height = Math.max(1, Math.round(height * pixelRatio));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    const drawLayer = (time: number, color: string, phaseOffset: number, blur: number) => {
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = blur;

      const centerX = width / 2;
      const centerY = height / 2;
      const scaleBase = Math.min(width / 120, height / 72);
      const radius = Math.max(0.75, scaleBase * 0.9);

      for (let index = 0; index < points.length; index += 1) {
        const point = points[index];
        const t = time - point.dist / 25 - phaseOffset;
        const wave = roundedSquareWave(t, 0.15 + (0.2 * point.dist) / 72, 0.42, 1 / 3.8);
        const scale = wave + 1.3;

        const x = centerX + point.x * scale * scaleBase;
        const y = centerY + point.y * scale * scaleBase;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const render = (now: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = now;
      }

      const elapsed = (now - startTimeRef.current) / 1000;

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';
      drawLayer(elapsed, 'rgba(255, 95, 153, 0.28)', 0, 9);
      drawLayer(elapsed, 'rgba(90, 243, 255, 0.2)', 0.07, 8);
      drawLayer(elapsed, 'rgba(150, 140, 255, 0.2)', 0.14, 8);
      ctx.globalCompositeOperation = 'source-over';

      if (!reducedMotion.matches) {
        animationFrameRef.current = window.requestAnimationFrame(render);
      }
    };

    animationFrameRef.current = window.requestAnimationFrame(render);

    const handleReducedMotionChange = () => {
      if (reducedMotion.matches) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        ctx.clearRect(0, 0, width, height);
        drawLayer(0, 'rgba(255, 95, 153, 0.2)', 0, 4);
        drawLayer(0, 'rgba(90, 243, 255, 0.14)', 0.07, 3);
        drawLayer(0, 'rgba(150, 140, 255, 0.14)', 0.14, 3);
        return;
      }

      if (!animationFrameRef.current) {
        animationFrameRef.current = window.requestAnimationFrame(render);
      }
    };

    reducedMotion.addEventListener('change', handleReducedMotionChange);

    return () => {
      observer.disconnect();
      reducedMotion.removeEventListener('change', handleReducedMotionChange);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [points]);

  return (
    <div ref={containerRef} className={className} aria-hidden>
      <canvas ref={canvasRef} />
    </div>
  );
};

export default ChromaticDotField;
