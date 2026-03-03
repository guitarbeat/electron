import React, { useRef, useState } from 'react';
import type { User } from '../../types';
import type { QuizData } from '../../services/quizService';
import { colors, radius, shadows, spacing, typography } from '../../design-system/tokens';
import Button from '../ui/Button';
import MinigameModal from '../ui/MinigameModal';
import QuizFlow from './QuizFlow';

const BUBBLE_SIZE = 60;
const BUBBLE_EDGE_MARGIN = 16;
const DRAG_THRESHOLD = 4;

interface QuizBubbleProps {
  quizData: QuizData | null | undefined;
  quizCompleted: boolean;
  currentUser: User | null;
  onQuizComplete: () => void;
  onOpenQuizEditor: () => void;
}

const clampBubble = (x: number, y: number) => {
  if (typeof window === 'undefined') return { x, y };
  const maxX = Math.max(BUBBLE_EDGE_MARGIN, window.innerWidth - BUBBLE_SIZE - BUBBLE_EDGE_MARGIN);
  const maxY = Math.max(
    BUBBLE_EDGE_MARGIN,
    window.innerHeight - BUBBLE_SIZE - BUBBLE_EDGE_MARGIN
  );
  return {
    x: Math.min(Math.max(x, BUBBLE_EDGE_MARGIN), maxX),
    y: Math.min(Math.max(y, BUBBLE_EDGE_MARGIN), maxY),
  };
};

const QuizBubble: React.FC<QuizBubbleProps> = ({
  quizData,
  quizCompleted,
  currentUser,
  onQuizComplete,
  onOpenQuizEditor,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTakingQuiz, setIsTakingQuiz] = useState(false);
  const [bubblePosition, setBubblePosition] = useState(() => {
    if (typeof window === 'undefined') return { x: BUBBLE_EDGE_MARGIN, y: BUBBLE_EDGE_MARGIN };
    return {
      x: BUBBLE_EDGE_MARGIN + 4,
      y: window.innerHeight - BUBBLE_SIZE - BUBBLE_EDGE_MARGIN - 210,
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
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const ds = dragStateRef.current;
    if (!ds || ds.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - ds.startX;
    const deltaY = event.clientY - ds.startY;
    if (
      !didDragRef.current &&
      (Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD)
    ) {
      didDragRef.current = true;
    }
    if (!didDragRef.current) return;
    setBubblePosition(clampBubble(ds.origin.x + deltaX, ds.origin.y + deltaY));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const ds = dragStateRef.current;
    if (!ds || ds.pointerId !== event.pointerId) return;
    if (!didDragRef.current) {
      setIsOpen(true);
    }
    setIsDragging(false);
    dragStateRef.current = null;
    didDragRef.current = false;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Ignore release capture errors
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setIsTakingQuiz(false);
  };

  const handleComplete = () => {
    onQuizComplete();
    closeModal();
  };

  return (
    <>
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          position: 'fixed',
          left: bubblePosition.x,
          top: bubblePosition.y,
          width: `${BUBBLE_SIZE}px`,
          height: `${BUBBLE_SIZE}px`,
          borderRadius: radius.full,
          border: `3px solid ${colors.surfaceElevated}`,
          background:
            'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 40%), linear-gradient(145deg, rgba(99, 102, 241, 0.95) 0%, rgba(79, 70, 229, 0.95) 100%)',
          color: '#fff',
          fontSize: '1.5rem',
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
        aria-label="Open Quiz"
      >
        ❓
      </button>

      <MinigameModal
        isOpen={isOpen}
        onClose={closeModal}
        title={isTakingQuiz ? 'Quiz' : 'Personality Quiz'}
        ariaLabel="Personality quiz panel"
        maxWidth={840}
      >
        <div style={{ padding: spacing.lg, overflow: 'auto', flex: 1 }}>
          {!isTakingQuiz && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              <p style={{ margin: 0, color: colors.textSecondary, fontSize: typography.fontSize.sm }}>
                {quizCompleted
                  ? 'Retake any time to refresh your match.'
                  : 'Take when you want.'}
              </p>
              <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
                <Button variant={quizCompleted ? 'ghost' : 'secondary'} onClick={() => setIsTakingQuiz(true)}>
                  {quizCompleted ? 'Retake' : 'Start Quiz'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    closeModal();
                    onOpenQuizEditor();
                  }}
                  disabled={!currentUser}
                >
                  {currentUser ? 'Edit Quiz' : 'Pick user to edit'}
                </Button>
              </div>
            </div>
          )}

          {isTakingQuiz && (
            <>
              {quizData ? (
                <QuizFlow quizData={quizData} onComplete={handleComplete} />
              ) : (
                <p style={{ margin: 0, color: colors.textSecondary }}>Loading quiz…</p>
              )}
            </>
          )}
        </div>
      </MinigameModal>
    </>
  );
};

export default QuizBubble;
