import React, { useRef, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import {
  FLOATING_DRAG_THRESHOLD,
  clampFloatingBubblePosition,
  getFloatingBubbleButtonStyle,
  snapFloatingBubblePosition,
} from '@/ui/floatingBubbleStyles';

interface DraggableFeatureBubbleProps {
  icon: string;
  title: string;
  message?: string;
  initialPosition: { x: number; y: number };
  onActivate?: () => void;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

const DraggableFeatureBubble: React.FC<DraggableFeatureBubbleProps> = ({
  icon,
  title,
  message,
  initialPosition,
  onActivate,
}) => {
  const { showToast } = useToast();
  const [position, setPosition] = useState(() =>
    clampFloatingBubblePosition(initialPosition.x, initialPosition.y)
  );
  const [isDragging, setIsDragging] = useState(false);

  const dragRef = useRef<DragState | null>(null);
  const hasDraggedRef = useRef(false);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
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

    const x = event.clientX - drag.offsetX;
    const y = event.clientY - drag.offsetY;
    setPosition(clampFloatingBubblePosition(x, y));
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    event.currentTarget.releasePointerCapture(event.pointerId);
    setIsDragging(false);
    dragRef.current = null;

    if (hasDraggedRef.current) {
      setPosition((currentPosition) =>
        snapFloatingBubblePosition(currentPosition.x, currentPosition.y)
      );
    }
  };

  const handleClick = () => {
    if (hasDraggedRef.current) return;
    if (onActivate) {
      onActivate();
      return;
    }
    showToast({
      message: message || `${title} is ready.`,
      type: 'info',
      duration: 2500,
    });
  };

  return (
    <button
      style={getFloatingBubbleButtonStyle(position, isDragging)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onClick={handleClick}
      title={title}
      aria-label={title}
      type="button"
    >
      {icon}
    </button>
  );
};

export default DraggableFeatureBubble;
