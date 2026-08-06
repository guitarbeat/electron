/**
 * useFabDrag — pointer-based drag behavior for the FAB toggle button.
 * Distinguishes click (toggle) from drag (reposition) via a threshold.
 */
import { useCallback, useRef, useState } from "react";
import { FLOATING_CONTROL_SIZE } from "../floatingWorkspacePanelLayout";
import { clampToViewport } from "./useFabPosition";

const DRAG_THRESHOLD = 8;

interface UseFabDragOptions {
  fabRef: React.RefObject<HTMLDivElement | null>;
  onTap: () => void;
  onDragEnd: (pos: { x: number; y: number }) => void;
  onDragStart?: () => void;
}

export function useFabDrag({ fabRef, onTap, onDragEnd, onDragStart }: UseFabDragOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const pointerIdRef = useRef<number | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    pointerIdRef.current = e.pointerId;
    isDraggingRef.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (pointerIdRef.current !== e.pointerId) return;

      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      // Start dragging once threshold exceeded
      if (Math.hypot(dx, dy) > DRAG_THRESHOLD && !isDraggingRef.current) {
        isDraggingRef.current = true;
        setIsDragging(true);
        onDragStart?.();
        e.preventDefault();
      }

      if (!isDraggingRef.current || !fabRef.current) return;
      e.preventDefault();

      // Move FAB directly via style for smooth drag (no React re-render)
      const newX = e.clientX - FLOATING_CONTROL_SIZE / 2;
      const newY = e.clientY - FLOATING_CONTROL_SIZE / 2;
      fabRef.current.style.left = `${newX}px`;
      fabRef.current.style.top = `${newY}px`;
    },
    [fabRef, onDragStart],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (pointerIdRef.current !== null && pointerIdRef.current !== e.pointerId) return;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      if (pointerIdRef.current === null) return;

      const wasDragging = isDraggingRef.current;

      if (!wasDragging) {
        onTap();
      } else if (fabRef.current) {
        const left = parseFloat(fabRef.current.style.left || "0");
        const top = parseFloat(fabRef.current.style.top || "0");
        const clamped = clampToViewport({ x: left, y: top });
        fabRef.current.style.left = `${clamped.x}px`;
        fabRef.current.style.top = `${clamped.y}px`;
        onDragEnd(clamped);
      }

      isDraggingRef.current = false;
      setIsDragging(false);
      pointerIdRef.current = null;
    },
    [fabRef, onTap, onDragEnd],
  );

  return {
    isDragging,
    pointerHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  } as const;
}
