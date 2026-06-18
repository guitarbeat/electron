import type { FC } from "react";
import QuizExperience, {
  type QuizExperienceProps,
} from "@/components/quiz/QuizExperience";
import "./QuizWorkspaceSection.css";

const QuizWorkspaceSection: FC<QuizExperienceProps> = (props) => (
  <section
    id="quiz-section"
    className="quiz-workspace-section"
    aria-label="Personality quiz"
  >
    <QuizExperience {...props} />
  </section>
);

export default QuizWorkspaceSection;
