import React, { useRef, useState } from 'react';
import { User } from '../../types';
import Matchmaker from './Matchmaker';
import { colors, radius, shadows, spacing, typography } from '../../design-system/tokens';
import { useBubbleDismiss } from '../../context/BubbleDismissContext';

interface MatchmakerBubbleProps {
  currentUser: User | null;
}

const BUBBLE_SIZE = 60;
const BUBBLE_EDGE_MARGIN = 16;
const DRAG_THRESHOLD = 4;

const clampBubble = (x: number, y: number) => {
  if (typeof window === 'undefined') return { x, y };
  const maxX = Math.max(BUBBLE_EDGE_MARGIN, window.innerWidth - BUBBLE_SIZE - BUBBLE_EDGE_MARGIN);
  const maxY = Math.max(BUBBLE_EDGE_MARGIN, window.innerHeight - BUBBLE_SIZE - BUBBLE_EDGE_MARGIN);
  return {
    x: Math.min(Math.max(x, BUBBLE_EDGE_MARGIN), maxX),
    y: Math.min(Math.max(y, BUBBLE_EDGE_MARGIN), maxY),
  };
};

const MatchmakerBubble: React.FC<MatchmakerBubbleProps> = ({ currentUser }) => {
  const { isHidden, setDragging, checkDismissZoneHit, dismiss } = useBubbleDismiss();
  const [isOpen, setIsOpen] = useState(false);
  const [bubblePosition, setBubblePosition] = useState(() => {
    if (typeof window === 'undefined') return { x: BUBBLE_EDGE_MARGIN, y: BUBBLE_EDGE_MARGIN };
    return {
      x: BUBBLE_EDGE_MARGIN + 4,
      y: window.innerHeight - BUBBLE_SIZE - BUBBLE_EDGE_MARGIN - 280,
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
    setIsDragging(true);
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    if (
      !didDragRef.current &&
      (Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD)
    ) {
      didDragRef.current = true;
    }
    if (!didDragRef.current) return;
    const newX = dragState.origin.x + deltaX;
    const newY = dragState.origin.y + deltaY;
    setBubblePosition(clampBubble(newX, newY));
    checkDismissZoneHit(newX, newY, BUBBLE_SIZE);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    const dragged = didDragRef.current;
    setIsDragging(false);
    setDragging(false);
    dragStateRef.current = null;
    if (dragged) {
      if (checkDismissZoneHit(bubblePosition.x, bubblePosition.y, BUBBLE_SIZE)) {
        didDragRef.current = false;
        dismiss('matchmaker');
        try {
          event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {
          /* */
        }
        return;
      }
      window.setTimeout(() => {
        didDragRef.current = false;
      }, 0);
    }
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Ignore release capture errors.
    }
  };

  const handleBubbleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (didDragRef.current) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    setIsOpen((previous) => !previous);
  };

  const isBottomHalf =
    bubblePosition.y > (typeof window !== 'undefined' ? window.innerHeight / 2 : 400);
  const isRightHalf =
    bubblePosition.x > (typeof window !== 'undefined' ? window.innerWidth / 2 : 400);

  if (isHidden('matchmaker')) return null;

  return (
    <>
      <button
        type="button"
        onClick={handleBubbleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        aria-label={isOpen ? 'Close matchmaker' : 'Open matchmaker'}
        title={isOpen ? 'Close matchmaker' : 'Open matchmaker'}
        style={{
          position: 'fixed',
          left: bubblePosition.x,
          top: bubblePosition.y,
          width: `${BUBBLE_SIZE}px`,
          height: `${BUBBLE_SIZE}px`,
          borderRadius: radius.full,
          border: `3px solid ${colors.surfaceElevated}`,
          background:
            'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 40%), linear-gradient(145deg, rgba(255, 105, 180, 0.95) 0%, rgba(180, 60, 130, 0.95) 100%)',
          color: '#fff',
          fontSize: '1.45rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDragging ? 'grabbing' : 'grab',
          boxShadow: shadows.glow,
          padding: 0,
          zIndex: 1000,
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        {isOpen ? '×' : '💕'}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            width: 'min(500px, calc(100vw - 32px))',
            maxHeight: 'min(640px, 82vh)',
            zIndex: 1001,
            display: 'flex',
            flexDirection: 'column',
            ...(isBottomHalf
              ? { bottom: `calc(100vh - ${bubblePosition.y}px - ${BUBBLE_SIZE}px)` }
              : { top: `${bubblePosition.y}px` }),
            ...(isRightHalf
              ? { right: `calc(100vw - ${bubblePosition.x}px - ${BUBBLE_SIZE}px)` }
              : { left: `${bubblePosition.x}px` }),
            ...(typeof window !== 'undefined' &&
              window.innerWidth <= 640 && {
                left: '16px',
                right: '16px',
                bottom: isBottomHalf ? '16px' : 'auto',
                top: !isBottomHalf ? '16px' : 'auto',
              }),
          }}
        >
          <div
            style={{
              padding: spacing.md,
              border: `1px solid ${colors.borderSecondary}30`,
              borderRadius: '24px',
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              maxHeight: 'min(640px, 82vh)',
              animation: 'slide-up-fade 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing.sm,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color: colors.textPrimary,
                  fontSize: typography.fontSize.lg,
                  fontFamily: typography.fontFamily.heading.join(', '),
                }}
              >
                Matchmaker
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close matchmaker"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: radius.full,
                  border: 'none',
                  background: 'rgba(255,255,255,0.08)',
                  color: colors.textSecondary,
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                padding: `${spacing.xs} ${spacing.sm} ${spacing.sm}`,
              }}
            >
              <Matchmaker currentUser={currentUser} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MatchmakerBubble;
