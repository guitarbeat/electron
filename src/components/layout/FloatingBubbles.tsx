import React from 'react';
import MessageBoard from '@/common/MessageBoard;
import SnakeGame from '@/snake/SnakeGame;
import SpinWheel from '@/extras/spin-wheel/SpinWheel;
import MatchmakerBubble from '@/matchmaker/MatchmakerBubble;
import QuizBubble from '@/quiz/QuizBubble;
import DragDismissZone from '@/common/DragDismissZone;
import RestoreBubblesButton from '@/common/RestoreBubblesButton;
import { useQuiz } from '@/hooks/useQuiz;
import { useUser } from '@/context/UserContext;
import { useBubbleDismiss } from '@/context/BubbleDismissContext;

interface FloatingBubblesProps {
  quizCompleted: boolean;
  onQuizComplete: () => void;
  onOpenQuizEditor: () => void;
}

const FloatingBubbles: React.FC<FloatingBubblesProps> = ({
  quizCompleted,
  onQuizComplete,
  onOpenQuizEditor,
}) => {
  const { quizData } = useQuiz();
  const { currentUser } = useUser();
  const { isDragging, isHoveringDismiss } = useBubbleDismiss();

  return (
    <>
      <MessageBoard mode="floating" />
      <SpinWheel mode="floating" />
      <SnakeGame mode="floating" />
      <QuizBubble
        quizData={quizData}
        quizCompleted={quizCompleted}
        currentUser={currentUser}
        onQuizComplete={onQuizComplete}
        onOpenQuizEditor={onOpenQuizEditor}
      />
      <MatchmakerBubble currentUser={currentUser} />
      <DragDismissZone visible={isDragging} isHovering={isHoveringDismiss} />
      <RestoreBubblesButton />
    </>
  );
};

export default FloatingBubbles;
