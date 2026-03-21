import type { FC } from 'react';
import QuizFlow from '@/components/quiz/QuizFlow';
import { useQuiz } from '@/hooks/useQuiz';
import type { User } from '@/types';

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

  if (!currentUser || isLoading || !quizData) {
    return null;
  }

  return (
    <QuizFlow
      key={`${currentUser}-${quizCompleted ? 'completed' : 'fresh'}`}
      quizData={quizData}
      onComplete={onComplete}
      onEdit={onEdit}
      isCompleted={false}
    />
  );
};

export default QuizFlowModalContent;
