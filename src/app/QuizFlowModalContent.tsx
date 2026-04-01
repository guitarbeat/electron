import type { FC } from 'react';
import QuizFlow from '@/components/quiz/QuizFlow';
import { useQuiz } from '@/hooks/useQuiz';
import type { User } from '@/shared/types';

interface QuizFlowModalContentProps {
  currentUser: User | null;
  quizCompleted: boolean;
  onComplete: () => void;
  onEdit: () => void;
}

const QuizFlowModalContent: FC<QuizFlowModalContentProps> = ({
  currentUser,
  quizCompleted,
  onComplete,
  onEdit,
}) => {
  const { quizData, isLoading } = useQuiz();

  if (isLoading || !quizData) {
    return null;
  }

  return (
    <QuizFlow
      key={`${currentUser ?? 'guest'}-${quizCompleted ? 'completed' : 'fresh'}`}
      quizData={quizData}
      onComplete={onComplete}
      onEdit={currentUser ? onEdit : undefined}
      isCompleted={false}
    />
  );
};

export default QuizFlowModalContent;
