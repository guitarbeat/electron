import React, { useRef, useState } from 'react';
import { useBubbleDismiss } from '../../../context/BubbleDismissContext';
import {
  FLOATING_BUBBLE_SIZE,
  FLOATING_BUBBLE_EDGE_MARGIN,
  FLOATING_DRAG_THRESHOLD,
  clampFloatingBubblePosition,
  getFloatingBubbleButtonStyle,
} from '../../ui/floatingBubbleStyles';

export interface BaseBubbleProps {
  id: string;
  emoji: string;
  label: string;
  mode?: 'floating' | 'embedded';
  defaultPosition?: { x: number; y: number };
  children: React.ReactNode;
  onActivate?: () => void;
  renderModal?: () => React.ReactNode;
}

export const BaseBubble: React.FC<BaseBubbleProps> = ({
  id,
  emoji,
  label,
  mode = 'floating',
  defaultPosition,
  children,
  onActivate,
  renderModal,
}) => {
  const { isHidden, setDragging, checkDismissZoneHit, dismiss } = useBubbleDismiss();
  const isEmbedded = mode === 'embedded';
  const [isOpen, setIsOpen] = useState(false);
  const [bubblePosition, setBubblePosition] = useState(() => {
    if (typeof window === 'undefined') {
      return { x: FLOATING_BUBBLE_EDGE_MARGIN, y: FLOATING_BUBBLE_EDGE_MARGIN };
    }
    return defaultPosition || {
      x: FLOATING_BUBBLE_EDGE_MARGIN + 4,
      y: window.innerHeight - FLOATING_BUBBLE_SIZE - FLOATING_BUBBLE_EDGE_MARGIN - 200,
    };
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origin: { x: number; y: number };
  } | null>(null);
  const didDragRef = useRef(false);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: bubblePosition,
    };
    didDragRef.current = false;

    const timer = window.setTimeout(() => {
      setIsDragging(true);
      setDragging(true);
    }, 180);

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Ignore capture errors
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!dragStateRef.current) return;
      
      const deltaX = e.clientX - dragStateRef.current.startX;
      const deltaY = e.clientY - dragStateRef.current.startY;
      
      if (Math.abs(deltaX) > FLOATING_DRAG_THRESHOLD || Math.abs(deltaY) > FLOATING_DRAG_THRESHOLD) {
        didDragRef.current = true;
        if (!isDragging) {
          setIsDragging(true);
          setDragging(true);
          clearTimeout(timer);
        }
      }

      if (isDragging) {
        const newPosition = clampFloatingBubblePosition(
          dragStateRef.current.origin.x + deltaX,
          dragStateRef.current.origin.y + deltaY
        );
        setBubblePosition(newPosition);
        checkDismissZoneHit(newPosition.x, newPosition.y, FLOATING_BUBBLE_SIZE);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      clearTimeout(timer);
      setIsDragging(false);
      setDragging(false);
      
      if (dragStateRef.current) {
        const wasDragged = didDragRef.current;
        const finalPosition = bubblePosition;
        
        if (checkDismissZoneHit(finalPosition.x, finalPosition.y, FLOATING_BUBBLE_SIZE)) {
          dismiss(id as any);
        } else if (!wasDragged && onActivate) {
          onActivate();
          if (renderModal) {
            setIsOpen(true);
          }
        }
      }
      
      dragStateRef.current = null;
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  };

  if (isEmbedded) {
    return <>{children}</>;
  }

  if (isHidden(id as any)) return null;

  return (
    <>
      <button
        type="button"
        onPointerDown={handlePointerDown}
        style={getFloatingBubbleButtonStyle(bubblePosition, isDragging)}
        aria-label={`${label} bubble`}
        title={label}
      >
        <span style={{ fontSize: '20px' }} aria-hidden>
          {emoji}
        </span>
      </button>

      {isOpen && renderModal && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            {renderModal()}
          </div>
        </div>
      )}
    </>
  );
};
