import type { FC } from "react";
import QuizFlow from "@/components/quiz/QuizFlow";
import { useQuiz } from "@/hooks/useQuiz";
import type { User } from "@/shared/types";

export interface QuizExperienceProps {
  currentUser: User | null;
  quizCompleted: boolean;
  onComplete: () => void;
  onRetake: () => void;
  onEdit?: () => void;
}

const QuizExperience: FC<QuizExperienceProps> = ({
  currentUser,
  quizCompleted,
  onComplete,
  onRetake,
  onEdit,
}) => {
  const { quizData, isLoading } = useQuiz();

  if (isLoading || !quizData) {
    return (
      <p className="quiz-workspace-section__loading" aria-live="polite">
        Loading personality quiz…
      </p>
    );
  }

  return (
    <QuizFlow
      key={`${currentUser ?? "guest"}-${quizCompleted ? "completed" : "fresh"}`}
      sessionKey={currentUser ?? "guest"}
      quizData={quizData}
      onComplete={onComplete}
      onRetake={onRetake}
      onEdit={onEdit}
      isCompleted={quizCompleted}
    />
  );
};

export default QuizExperience;
