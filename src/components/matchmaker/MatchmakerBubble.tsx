import React, { useRef, useState } from 'react';
import { User } from '@/types;
import { useTheme } from '@/context/ThemeContext;
import Matchmaker from './Matchmaker';
import { colors, radius, spacing, typography } from '@/design-system/tokens;
import { useBubbleDismiss } from '@/context/BubbleDismissContext;
import {
  FLOATING_BUBBLE_SIZE,
  FLOATING_BUBBLE_EDGE_MARGIN,
  FLOATING_DRAG_THRESHOLD,
  clampFloatingBubblePosition,
  getFloatingBubbleButtonStyle,
  getFloatingContainerStyle,
} from '@/ui/floatingBubbleStyles;

interface MatchmakerBubbleProps {
  mode?: 'floating' | 'embedded';
  currentUser: User | null;
}

const MatchmakerBubble: React.FC<MatchmakerBubbleProps> = ({ mode = 'floating', currentUser }) => {
  const { isHidden, setDragging, checkDismissZoneHit, dismiss } = useBubbleDismiss();
  const { themeTokens } = useTheme();
  const isEmbedded = mode === 'embedded';
  const [isOpen, setIsOpen] = useState(false);

  const [bubblePosition, setBubblePosition] = useState(() => {
    if (typeof window === 'undefined') {
      return { x: FLOATING_BUBBLE_EDGE_MARGIN, y: FLOATING_BUBBLE_EDGE_MARGIN };
    }

    return {
      x: FLOATING_BUBBLE_EDGE_MARGIN + 4,
      y: window.innerHeight - FLOATING_BUBBLE_SIZE - FLOATING_BUBBLE_EDGE_MARGIN - 280,
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
      (Math.abs(deltaX) > FLOATING_DRAG_THRESHOLD || Math.abs(deltaY) > FLOATING_DRAG_THRESHOLD)
    ) {
      didDragRef.current = true;
    }
    if (!didDragRef.current) return;
    const newX = dragState.origin.x + deltaX;
    const newY = dragState.origin.y + deltaY;
    setBubblePosition(clampFloatingBubblePosition(newX, newY));
    checkDismissZoneHit(newX, newY, FLOATING_BUBBLE_SIZE);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    const dragged = didDragRef.current;
    setIsDragging(false);
    setDragging(false);
    dragStateRef.current = null;
    if (dragged) {
      if (checkDismissZoneHit(bubblePosition.x, bubblePosition.y, FLOATING_BUBBLE_SIZE)) {
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

  if (isEmbedded) {
    return (
      <div
        style={{
          minHeight: 0,
          height: '100%',
          overflow: 'auto',
          padding: spacing.sm,
        }}
      >
        <Matchmaker currentUser={currentUser} />
      </div>
    );
  }

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
          ...getFloatingBubbleButtonStyle({
            position: bubblePosition,
            isDragging,
            background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 40%), ${themeTokens.gradientPrimary}`,
            color: '#fff',
            fontSize: '1.45rem',
            boxShadow: themeTokens.glow,
          }),
        }}
      >
        {isOpen ? 'X' : 'MM'}
      </button>

      {isOpen && (
        <div
          style={getFloatingContainerStyle({
            isEmbedded: false,
            isViewportExpanded: true,
            isMobile: false,
            desktopWidth: '100%',
            zIndex: 1001,
          })}
        >
          <div
            style={{
              padding: spacing.md,
              border: 'none',
              borderRadius: 0,
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              width: '100%',
              height: '100%',
              maxHeight: '100vh',
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
                X
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

