import type { FC } from "react";
import QuizFlow from "@/components/quiz/QuizFlow";
import { useQuiz } from "@/hooks/useQuiz";
import { useFeatureFonts } from "@/hooks/useFeatureFonts";
import type { User } from "@/shared/types";
import { WorkspaceFeatureSectionLoading } from "@/components/ui/WorkspaceFeatureSection";

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
  useFeatureFonts();

  if (isLoading || !quizData) {
    return (
      <WorkspaceFeatureSectionLoading label="Loading personality quiz…" />
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
