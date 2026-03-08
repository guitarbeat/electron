import React, { useEffect, useRef, useState } from 'react';
import {
  clampFloatingBubblePosition,
  FLOATING_DRAG_THRESHOLD,
  snapFloatingBubblePosition,
} from '@/ui/floatingBubbleStyles';

interface BubblePosition {
  x: number;
  y: number;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

interface UseFloatingBubbleDragOptions {
  initialPosition: BubblePosition | (() => BubblePosition);
  snapToEdge?: boolean;
  onClick?: () => void;
  onDragStart?: () => void;
  onDragMove?: (position: BubblePosition) => void;
  onDragEnd?: (result: { wasDragged: boolean; position: BubblePosition }) => void;
}

function safeReleasePointerCapture(element: HTMLButtonElement, pointerId: number) {
  try {
    element.releasePointerCapture(pointerId);
  } catch {
    // Ignore release capture errors when capture was already lost.
  }
}

function resolveInitialPosition(initialPosition: UseFloatingBubbleDragOptions['initialPosition']) {
  const resolved = typeof initialPosition === 'function' ? initialPosition() : initialPosition;
  return clampFloatingBubblePosition(resolved.x, resolved.y);
}

export function useFloatingBubbleDrag({
  initialPosition,
  snapToEdge = false,
  onClick,
  onDragStart,
  onDragMove,
  onDragEnd,
}: UseFloatingBubbleDragOptions) {
  const [position, setPosition] = useState(() => resolveInitialPosition(initialPosition));
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<DragState | null>(null);
  const hasDraggedRef = useRef(false);

  useEffect(() => {
    const handleResize = () => {
      setPosition((currentPosition) => clampFloatingBubblePosition(currentPosition.x, currentPosition.y));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    hasDraggedRef.current = false;
    setIsDragging(true);
    onDragStart?.();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (
      Math.abs(deltaX) > FLOATING_DRAG_THRESHOLD ||
      Math.abs(deltaY) > FLOATING_DRAG_THRESHOLD
    ) {
      hasDraggedRef.current = true;
    }

    const nextPosition = clampFloatingBubblePosition(
      event.clientX - drag.offsetX,
      event.clientY - drag.offsetY
    );
    setPosition(nextPosition);
    onDragMove?.(nextPosition);
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    safeReleasePointerCapture(event.currentTarget, event.pointerId);
    setIsDragging(false);
    dragRef.current = null;

    const wasDragged = hasDraggedRef.current;
    hasDraggedRef.current = false;

    setPosition((currentPosition) => {
      const finalPosition =
        snapToEdge && wasDragged
          ? snapFloatingBubblePosition(currentPosition.x, currentPosition.y)
          : currentPosition;
      onDragEnd?.({ wasDragged, position: finalPosition });
      return finalPosition;
    });
  };

  const handleClick = () => {
    if (hasDraggedRef.current) return;
    onClick?.();
  };

  return {
    position,
    setPosition,
    isDragging,
    bubbleProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerEnd,
      onPointerCancel: handlePointerEnd,
      onClick: handleClick,
    },
  };
}
