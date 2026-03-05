import React, { useRef, useState } from 'react';
import type { User } from '@/types;
import type { QuizData } from '@/services/quizService;
import { colors, spacing, typography } from '@/design-system/tokens;
import { useTheme } from '@/context/ThemeContext;
import Button from '@/ui/Button;
import MinigameModal from '@/ui/MinigameModal;
import QuizFlow from './QuizFlow';
import { useBubbleDismiss } from '@/context/BubbleDismissContext;
import {
  FLOATING_BUBBLE_SIZE,
  FLOATING_BUBBLE_EDGE_MARGIN,
  FLOATING_DRAG_THRESHOLD,
  clampFloatingBubblePosition,
  getFloatingBubbleButtonStyle,
} from '@/ui/floatingBubbleStyles;

interface QuizBubbleProps {
  mode?: 'floating' | 'embedded';
  quizData: QuizData | null | undefined;
  quizCompleted: boolean;
  currentUser: User | null;
  onQuizComplete: () => void;
  onOpenQuizEditor: () => void;
}

const QuizBubble: React.FC<QuizBubbleProps> = ({
  mode = 'floating',
  quizData,
  quizCompleted,
  currentUser,
  onQuizComplete,
  onOpenQuizEditor,
}) => {
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
      y: window.innerHeight - FLOATING_BUBBLE_SIZE - FLOATING_BUBBLE_EDGE_MARGIN - 210,
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
    const ds = dragStateRef.current;
    if (!ds || ds.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - ds.startX;
    const deltaY = event.clientY - ds.startY;
    if (
      !didDragRef.current &&
      (Math.abs(deltaX) > FLOATING_DRAG_THRESHOLD || Math.abs(deltaY) > FLOATING_DRAG_THRESHOLD)
    ) {
      didDragRef.current = true;
    }
    if (!didDragRef.current) return;
    const newX = ds.origin.x + deltaX;
    const newY = ds.origin.y + deltaY;
    setBubblePosition(clampFloatingBubblePosition(newX, newY));
    checkDismissZoneHit(newX, newY, FLOATING_BUBBLE_SIZE);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const ds = dragStateRef.current;
    if (!ds || ds.pointerId !== event.pointerId) return;
    const wasDragged = didDragRef.current;
    setIsDragging(false);
    setDragging(false);
    dragStateRef.current = null;
    didDragRef.current = false;
    if (
      wasDragged &&
      checkDismissZoneHit(bubblePosition.x, bubblePosition.y, FLOATING_BUBBLE_SIZE)
    ) {
      dismiss('quiz');
      return;
    }
    if (!wasDragged) {
      setIsOpen(true);
    }
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Ignore release capture errors
    }
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const handleComplete = () => {
    onQuizComplete();
    closeModal();
  };

  const renderHeader = (onEditClick: () => void) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <p style={{ margin: 0, color: colors.textSecondary, fontSize: typography.fontSize.sm }}>
        {quizCompleted ? 'Retake any time to refresh your match.' : 'Take when you want.'}
      </p>
      <Button variant="ghost" onClick={onEditClick} disabled={!currentUser}>
        {currentUser ? 'Edit Quiz' : 'Pick user to edit'}
      </Button>
    </div>
  );

  const renderQuizContent = (onComplete: () => void) =>
    quizData ? (
      <QuizFlow quizData={quizData} onComplete={onComplete} />
    ) : (
      <p style={{ margin: 0, color: colors.textSecondary }}>Loading quiz...</p>
    );

  if (isEmbedded) {
    return (
      <div style={{ padding: spacing.md, display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        {renderHeader(onOpenQuizEditor)}
        {renderQuizContent(onQuizComplete)}
      </div>
    );
  }

  if (isHidden('quiz')) return null;

  return (
    <>
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          ...getFloatingBubbleButtonStyle({
            position: bubblePosition,
            isDragging,
            background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 40%), ${themeTokens.gradientPrimary}`,
            color: '#fff',
            fontSize: '1.5rem',
            boxShadow: themeTokens.glow,
          }),
        }}
        aria-label="Open Quiz"
      >
        ?
      </button>

      <MinigameModal
        isOpen={isOpen}
        onClose={closeModal}
        title="Personality Quiz"
        ariaLabel="Personality quiz panel"
        maxWidth={840}
      >
        <div style={{ padding: spacing.lg, overflow: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {renderHeader(() => {
            closeModal();
            onOpenQuizEditor();
          })}
          {renderQuizContent(handleComplete)}
        </div>
      </MinigameModal>
    </>
  );
};

export default QuizBubble;
