import React from 'react';
import type { User } from '@/types';
import type { QuizData } from '@/services/quizService';
import QuizFlow from './QuizFlow';

interface QuizBubbleProps {
  quizData: QuizData | null;
  quizCompleted: boolean;
  currentUser: User | null;
  onQuizComplete: () => void;
  onOpenQuizEditor: () => void;
}

const QuizBubble: React.FC<QuizBubbleProps> = ({
  quizData,
  quizCompleted,
  currentUser,
  onQuizComplete,
  onOpenQuizEditor,
}) => {
  if (!quizData || !currentUser) return null;

  return (
    <QuizFlow
      quizData={quizData}
      currentUser={currentUser}
      onComplete={onQuizComplete}
      onEdit={onOpenQuizEditor}
      isCompleted={quizCompleted}
    />
  );
};

export default QuizBubble;
