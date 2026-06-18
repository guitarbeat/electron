import type { FC } from "react";
import QuizExperience, {
  type QuizExperienceProps,
} from "@/components/quiz/QuizExperience";
import WorkspaceFeatureSection from "@/components/ui/WorkspaceFeatureSection";

const QuizWorkspaceSection: FC<QuizExperienceProps> = (props) => (
  <WorkspaceFeatureSection
    id="quiz-section"
    ariaLabel="Personality quiz"
    title="Personality Quiz"
    bodyClassName="workspace-feature-section__body--quiz"
  >
    <QuizExperience {...props} />
  </WorkspaceFeatureSection>
);

export default QuizWorkspaceSection;
