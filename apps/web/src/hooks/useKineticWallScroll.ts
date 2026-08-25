import { useEffect, useRef, useCallback } from 'react';

export interface KineticWallScrollOptions {
  /** Total number of visual columns rendered in the wall */
  columnCount: number;
  /** React refs pointing to each column's sliding track element */
  trackRefs: React.MutableRefObject<(HTMLElement | null)[]>;
  /** Reference array storing the pixel heights of each column's repeated band */
  copyHeightsRef: React.MutableRefObject<number[]>;
  /** Reference array storing current translateY offsets per column */
  offsetsRef: React.MutableRefObject<number[]>;
  /** Optional refs for the column repeated band container elements for auto-measurement */
  bandRefs?: React.MutableRefObject<(HTMLElement | null)[]>;
  /** Optional ref for the wall outer container element */
  wallRef?: React.MutableRefObject<HTMLElement | null>;
  /** Dependencies that trigger layout re-measurement when changed */
  measureDependencies?: unknown[];
  /** When true, ambient auto-drift is paused */
  isStatic?: boolean;
  /** Ambient continuous drift velocity in pixels per second */
  baseAmbientSpeed?: number;
  /** Kinetic friction factor applied to momentum scrolling (0 to 1) */
  friction?: number;
  /** Amplitude of organic parallax variation between adjacent columns (0 to 1) */
  parallaxVariance?: number;
  /** Controls whether event listeners and the animation loop are active */
  enabled?: boolean;
  /** Optional lifecycle callback executed right before each physics tick */
  onBeforeStep?: (elapsedSeconds: number) => void;
}

export interface KineticWallScrollController {
  /** Mutable ref storing the current momentum scrolling velocity */
  velocityRef: React.MutableRefObject<number>;
  /** Flag indicating whether the user is actively dragging */
  isDraggingRef: React.MutableRefObject<boolean>;
  /** Flag indicating if the current pointer gesture was a drag (suppressing clicks) */
  hasDraggedRef: React.MutableRefObject<boolean>;
  /** Programmatically displace all columns by a vertical delta in pixels */
  applyDisplacement: (stepDeltaPixels: number) => void;
}

/**
 * Checks whether an event target originates from an isolated interactive element
 * where outer canvas kinetic scrolling should be suppressed (e.g. modals, text inputs).
 */
export function isScrollBlockedElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      '.movie-details-modal, .chat-dock, .modal-backdrop, [role="dialog"], textarea, input, select, [contenteditable="true"]'
    )
  );
}

/**
 * High-performance kinetic scroll and inertial momentum hook for multi-column poster walls.
 * Provides unified wheel, pointer drag, touch swipe, and keyboard controls with smooth
 * exponential decay, column parallax, and automated ResizeObserver measurements.
 */
export function useKineticWallScroll({
  columnCount,
  trackRefs,
  copyHeightsRef,
  offsetsRef,
  bandRefs,
  wallRef,
  measureDependencies = [],
  isStatic = false,
  baseAmbientSpeed = 22,
  friction = 0.90,
  parallaxVariance = 0.3,
  enabled = true,
  onBeforeStep,
}: KineticWallScrollOptions): KineticWallScrollController {
  const velocityRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartYRef = useRef<number>(0);
  const touchLastYRef = useRef<number>(0);
  const touchVelocityTrackerRef = useRef<Array<{ y: number; time: number }>>([]);
  const hasDraggedRef = useRef<boolean>(false);
  const lastFrameRef = useRef<number | null>(null);

  // Auto layout measurement and resize observer for column bands
  useEffect(() => {
    if (!bandRefs) return;

    const measureAndSyncColumnLayout = () => {
      bandRefs.current.forEach((bandElement, columnIndex) => {
        if (!bandElement) return;
        const trackElement = trackRefs.current[columnIndex];
        const rowGap = trackElement ? Number.parseFloat(getComputedStyle(trackElement).rowGap) || 0 : 0;
        const boundingRectangle = bandElement.getBoundingClientRect();
        const copyHeight = boundingRectangle.height + rowGap;
        if (copyHeight <= 0) return;

        copyHeightsRef.current[columnIndex] = copyHeight;
        if (offsetsRef.current[columnIndex] === undefined) {
          offsetsRef.current[columnIndex] = copyHeight * ((columnIndex * 0.382) % 1);
        } else {
          offsetsRef.current[columnIndex] =
            ((offsetsRef.current[columnIndex] % copyHeight) + copyHeight) % copyHeight;
        }

        // Apply initial transform position
        if (trackElement) {
          const currentOffset = offsetsRef.current[columnIndex];
          const baseShift = copyHeight;
          const yPosition = -(baseShift + currentOffset);
          trackElement.style.transform = `translate3d(0, ${yPosition.toFixed(2)}px, 0)`;
        }
      });
    };

    measureAndSyncColumnLayout();
    const resizeObserver = new ResizeObserver(measureAndSyncColumnLayout);
    if (wallRef?.current) resizeObserver.observe(wallRef.current);
    bandRefs.current.forEach((bandElement) => {
      if (bandElement) resizeObserver.observe(bandElement);
    });

    return () => resizeObserver.disconnect();
  }, [columnCount, bandRefs, copyHeightsRef, offsetsRef, trackRefs, wallRef, ...measureDependencies]); // eslint-disable-line react-hooks/exhaustive-deps

  // Applies vertical delta displacement across all columns with organic parallax speed variance
  const applyDisplacement = useCallback(
    (stepDeltaPixels: number) => {
      if (stepDeltaPixels === 0) return;
      const tracks = trackRefs.current;
      const copyHeights = copyHeightsRef.current;
      const offsets = offsetsRef.current;

      for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
        const trackElement = tracks[columnIndex];
        const copyHeight = copyHeights[columnIndex];
        if (!trackElement || !copyHeight || copyHeight <= 0) continue;

        // Organic parallax depth variation per column
        const columnParallaxMultiplier = 0.85 + ((columnIndex * 0.47 + 0.18) % 1) * parallaxVariance;
        const columnStep = stepDeltaPixels * columnParallaxMultiplier;

        const nextOffset = (offsets[columnIndex] ?? 0) + columnStep;
        const normalizedOffset = ((nextOffset % copyHeight) + copyHeight) % copyHeight;
        offsets[columnIndex] = normalizedOffset;

        const baseShift = copyHeight;
        const yPosition = -(baseShift + normalizedOffset);
        trackElement.style.transform = `translate3d(0, ${yPosition.toFixed(2)}px, 0)`;
      }
    },
    [columnCount, copyHeightsRef, offsetsRef, trackRefs, parallaxVariance]
  );

  // Event handlers for Wheel, Pointer/Touch Drag, and Keyboard scrolling
  useEffect(() => {
    if (!enabled) return;

    const handleWheelScroll = (event: WheelEvent) => {
      if (isScrollBlockedElement(event.target)) return;

      let deltaY = event.deltaY;
      if (event.deltaMode === 1) deltaY *= 28;
      else if (event.deltaMode === 2) deltaY *= 480;

      // Handle horizontal trackpad tilt if vertical delta is near zero
      if (Math.abs(deltaY) < 0.2 && Math.abs(event.deltaX) > 0.2) {
        deltaY = event.deltaX;
      }

      // Direct displacement for instantaneous visual feedback
      applyDisplacement(deltaY * 1.3);

      // Add scroll momentum velocity for continuous gliding
      velocityRef.current = Math.max(
        -2600,
        Math.min(2600, velocityRef.current * 0.45 + deltaY * 10)
      );
    };

    const handleDragStart = (event: PointerEvent) => {
      if (isScrollBlockedElement(event.target)) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      isDraggingRef.current = true;
      hasDraggedRef.current = false;
      dragStartYRef.current = event.clientY;
      touchLastYRef.current = event.clientY;
      touchVelocityTrackerRef.current = [{ y: event.clientY, time: performance.now() }];
      velocityRef.current = 0;
    };

    const handleDragMove = (event: PointerEvent) => {
      if (!isDraggingRef.current) return;
      if (isScrollBlockedElement(event.target)) return;

      const currentY = event.clientY;
      const totalDragDistance = Math.abs(currentY - dragStartYRef.current);
      if (totalDragDistance > 5) {
        hasDraggedRef.current = true;
      }

      const deltaY = touchLastYRef.current - currentY;
      touchLastYRef.current = currentY;

      // Direct, responsive displacement during active drag
      applyDisplacement(deltaY * 1.35);

      const currentTime = performance.now();
      const tracker = touchVelocityTrackerRef.current;
      tracker.push({ y: currentY, time: currentTime });
      while (tracker.length > 1 && currentTime - tracker[0].time > 120) {
        tracker.shift();
      }
    };

    const handleDragEnd = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;

      const tracker = touchVelocityTrackerRef.current;
      if (tracker.length >= 2) {
        const oldestSample = tracker[0];
        const newestSample = tracker[tracker.length - 1];
        const timeDeltaSeconds = (newestSample.time - oldestSample.time) / 1000;
        if (timeDeltaSeconds > 0.015) {
          const pixelDelta = oldestSample.y - newestSample.y;
          const computedVelocity = pixelDelta / timeDeltaSeconds;
          velocityRef.current = Math.max(-2400, Math.min(2400, computedVelocity * 0.7));
        }
      }
      touchVelocityTrackerRef.current = [];
    };

    const handleSuppressedClickCapture = (event: MouseEvent) => {
      if (hasDraggedRef.current) {
        event.preventDefault();
        event.stopPropagation();
        hasDraggedRef.current = false;
      }
    };

    const handleKeyboardScroll = (event: KeyboardEvent) => {
      if (isScrollBlockedElement(event.target)) return;

      if (event.key === 'ArrowDown' || event.key === 'j') {
        applyDisplacement(120);
        velocityRef.current += 400;
      } else if (event.key === 'ArrowUp' || event.key === 'k') {
        applyDisplacement(-120);
        velocityRef.current -= 400;
      } else if (event.key === 'PageDown' || event.key === ' ') {
        applyDisplacement(350);
        velocityRef.current += 900;
      } else if (event.key === 'PageUp') {
        applyDisplacement(-350);
        velocityRef.current -= 900;
      }
    };

    window.addEventListener('wheel', handleWheelScroll, { passive: true });
    window.addEventListener('pointerdown', handleDragStart, { passive: true });
    window.addEventListener('pointermove', handleDragMove, { passive: true });
    window.addEventListener('pointerup', handleDragEnd, { passive: true });
    window.addEventListener('pointercancel', handleDragEnd, { passive: true });
    window.addEventListener('click', handleSuppressedClickCapture, true);
    window.addEventListener('keydown', handleKeyboardScroll);

    return () => {
      window.removeEventListener('wheel', handleWheelScroll);
      window.removeEventListener('pointerdown', handleDragStart);
      window.removeEventListener('pointermove', handleDragMove);
      window.removeEventListener('pointerup', handleDragEnd);
      window.removeEventListener('pointercancel', handleDragEnd);
      window.removeEventListener('click', handleSuppressedClickCapture, true);
      window.removeEventListener('keydown', handleKeyboardScroll);
    };
  }, [applyDisplacement, enabled]);

  // Continuous animation and physics damping loop
  useEffect(() => {
    if (!enabled) return;
    let animationFrameId = 0;

    const tickPhysics = (timestamp: number) => {
      if (lastFrameRef.current === null) {
        lastFrameRef.current = timestamp;
      }
      const rawDeltaSeconds = (timestamp - lastFrameRef.current) / 1000;
      const elapsedSeconds = Math.min(0.032, Math.max(0.002, rawDeltaSeconds));
      lastFrameRef.current = timestamp;

      if (onBeforeStep) {
        onBeforeStep(elapsedSeconds);
      }

      // Base gentle ambient drift speed
      const effectiveBaseSpeed = isStatic ? 0 : baseAmbientSpeed;
      let totalStep = effectiveBaseSpeed * elapsedSeconds;

      // Physics damping: smooth exponential velocity decay
      const decayFactor = Math.pow(friction, elapsedSeconds * 60);

      if (!isDraggingRef.current && Math.abs(velocityRef.current) > 0.05) {
        const scrollStep = velocityRef.current * elapsedSeconds;
        totalStep += scrollStep;
        velocityRef.current *= decayFactor;
        if (Math.abs(velocityRef.current) < 0.15) {
          velocityRef.current = 0;
        }
      }

      if (totalStep !== 0) {
        applyDisplacement(totalStep);
      }

      animationFrameId = window.requestAnimationFrame(tickPhysics);
    };

    animationFrameId = window.requestAnimationFrame(tickPhysics);
    return () => {
      window.cancelAnimationFrame(animationFrameId);
      lastFrameRef.current = null;
    };
  }, [applyDisplacement, isStatic, baseAmbientSpeed, friction, enabled, onBeforeStep]);

  return {
    velocityRef,
    isDraggingRef,
    hasDraggedRef,
    applyDisplacement,
  };
}

// Backward-compatibility alias
export type UseKineticWallScrollOptions = KineticWallScrollOptions;
