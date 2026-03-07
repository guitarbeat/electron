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
  const pointerRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

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

    const layerCurrent = document.createElement('canvas');
    const layerDelayA = document.createElement('canvas');
    const layerDelayB = document.createElement('canvas');
    const tintCanvas = document.createElement('canvas');

    const currentCtx = layerCurrent.getContext('2d');
    const delayACtx = layerDelayA.getContext('2d');
    const delayBCtx = layerDelayB.getContext('2d');
    const tintCtx = tintCanvas.getContext('2d');
    if (!currentCtx || !delayACtx || !delayBCtx || !tintCtx) return undefined;

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

      const layers = [layerCurrent, layerDelayA, layerDelayB, tintCanvas];
      for (let index = 0; index < layers.length; index += 1) {
        const layerCanvas = layers[index];
        layerCanvas.width = Math.max(1, Math.round(width * pixelRatio));
        layerCanvas.height = Math.max(1, Math.round(height * pixelRatio));
      }

      [currentCtx, delayACtx, delayBCtx, tintCtx].forEach((layerCtx) => {
        layerCtx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      });
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    const drawDotField = (
      targetCtx: CanvasRenderingContext2D,
      time: number,
      phaseOffset: number
    ) => {
      const drawCtx = targetCtx;
      drawCtx.clearRect(0, 0, width, height);
      drawCtx.fillStyle = 'rgba(255,255,255,0.96)';
      drawCtx.shadowColor = 'rgba(255,255,255,0.65)';
      drawCtx.shadowBlur = 5;

      const pointer = pointerRef.current;
      const centerX = width / 2;
      const centerY = height / 2;
      const scaleBase = Math.min(width / 120, height / 72);
      const radius = Math.max(0.68, scaleBase * 0.82);
      const pointerRadius = Math.max(120, Math.min(width, height) * 0.28);

      for (let index = 0; index < points.length; index += 1) {
        const point = points[index];
        const t = time - point.dist / 25 - phaseOffset;
        const wave = roundedSquareWave(t, 0.15 + (0.2 * point.dist) / 72, 0.42, 1 / 3.8);
        const scale = wave + 1.3;

        let x = centerX + point.x * scale * scaleBase;
        let y = centerY + point.y * scale * scaleBase;

        if (pointer.active) {
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < pointerRadius) {
            const influence = (1 - dist / pointerRadius) ** 2;
            const repel = (phaseOffset + 0.08) * influence * 14;
            x += (dx / (dist || 1)) * repel;
            y += (dy / (dist || 1)) * repel;
          }
        }

        drawCtx.beginPath();
        drawCtx.arc(x, y, radius, 0, Math.PI * 2);
        drawCtx.fill();
      }
      drawCtx.shadowBlur = 0;
    };

    const injectTrail = (
      targetCtx: CanvasRenderingContext2D,
      source: HTMLCanvasElement,
      fade: number,
      injectAlpha: number
    ) => {
      const drawCtx = targetCtx;
      drawCtx.save();
      drawCtx.globalCompositeOperation = 'destination-out';
      drawCtx.fillStyle = `rgba(0, 0, 0, ${fade})`;
      drawCtx.fillRect(0, 0, width, height);
      drawCtx.globalCompositeOperation = 'source-over';
      drawCtx.globalAlpha = injectAlpha;
      drawCtx.drawImage(source, 0, 0, width, height);
      drawCtx.restore();
    };

    const drawTinted = (
      source: HTMLCanvasElement,
      color: string,
      alpha: number,
      offsetX: number,
      offsetY: number
    ) => {
      tintCtx.clearRect(0, 0, width, height);
      tintCtx.drawImage(source, 0, 0, width, height);
      tintCtx.globalCompositeOperation = 'source-in';
      tintCtx.fillStyle = color;
      tintCtx.fillRect(0, 0, width, height);
      tintCtx.globalCompositeOperation = 'source-over';

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(tintCanvas, offsetX, offsetY, width, height);
      ctx.restore();
    };

    const render = (now: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = now;
      }

      const elapsed = (now - startTimeRef.current) / 1000;
      drawDotField(currentCtx, elapsed, 0);

      injectTrail(delayACtx, layerCurrent, 0.18, 0.54);
      injectTrail(delayBCtx, layerDelayA, 0.14, 0.48);

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';
      drawTinted(layerCurrent, 'rgba(255, 95, 153, 1)', 0.32, -1.4, 0);
      drawTinted(layerDelayA, 'rgba(90, 243, 255, 1)', 0.23, 1.2, 0.8);
      drawTinted(layerDelayB, 'rgba(150, 140, 255, 1)', 0.2, 0, -0.9);
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
        drawDotField(currentCtx, 0, 0);
        drawTinted(layerCurrent, 'rgba(255, 95, 153, 1)', 0.26, 0, 0);
        drawTinted(layerCurrent, 'rgba(90, 243, 255, 1)', 0.13, 0.8, 0.6);
        drawTinted(layerCurrent, 'rgba(150, 140, 255, 1)', 0.11, -0.8, -0.4);
        return;
      }

      if (!animationFrameRef.current) {
        animationFrameRef.current = window.requestAnimationFrame(render);
      }
    };

    reducedMotion.addEventListener('change', handleReducedMotionChange);

    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointerRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        active: true,
      };
    };
    const onPointerLeave = () => {
      pointerRef.current.active = false;
    };

    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerleave', onPointerLeave);

    return () => {
      observer.disconnect();
      reducedMotion.removeEventListener('change', handleReducedMotionChange);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerleave', onPointerLeave);
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
