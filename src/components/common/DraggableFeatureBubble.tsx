import React, { useRef, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import {
  FLOATING_DRAG_THRESHOLD,
  clampFloatingBubblePosition,
  getFloatingBubbleButtonStyle,
} from '@/ui/floatingBubbleStyles';

interface DraggableFeatureBubbleProps {
  icon: string;
  title: string;
  message?: string;
  initialPosition: { x: number; y: number };
  onActivate?: () => void;
}

interface DragState {
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
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);

  const dragRef = useRef<DragState | null>(null);
  const hasDraggedRef = useRef(false);

  const handleMouseDown = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    hasDraggedRef.current = false;
    setIsDragging(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const deltaX = moveEvent.clientX - drag.startX;
      const deltaY = moveEvent.clientY - drag.startY;
      if (
        Math.abs(deltaX) > FLOATING_DRAG_THRESHOLD ||
        Math.abs(deltaY) > FLOATING_DRAG_THRESHOLD
      ) {
        hasDraggedRef.current = true;
      }

      const x = moveEvent.clientX - drag.offsetX;
      const y = moveEvent.clientY - drag.offsetY;
      setPosition(clampFloatingBubblePosition(x, y));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
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
      onMouseDown={handleMouseDown}
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
