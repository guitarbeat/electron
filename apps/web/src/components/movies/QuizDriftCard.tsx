import React, { useCallback } from "react";
import type { User, QuizResult } from "@/shared/types";
import {
  Card,
  MediaCardPosterWrap,
} from "@/components/ui";
import {
  readQuizCompletionState,
  readUserQuizOutcome,
} from "@/app/quizCompletionStorage";

export interface QuizDriftCardProps {
  currentUser: User | null;
  isCompact?: boolean;
  onOpenQuiz?: () => void;
  className?: string;
  isQuizCard?: boolean;
  "data-quiz-card"?: boolean;
}

export const QuizDriftCard: React.FC<QuizDriftCardProps> = ({
  currentUser,
  onOpenQuiz,
  className = "",
}) => {
  const [isCompleted, setIsCompleted] = React.useState(() =>
    readQuizCompletionState(currentUser),
  );
  const [outcome, setOutcome] = React.useState<QuizResult | null>(() =>
    readUserQuizOutcome(currentUser),
  );

  React.useEffect(() => {
    setIsCompleted(readQuizCompletionState(currentUser));
    setOutcome(readUserQuizOutcome(currentUser));
  }, [currentUser]);

  const handleOpen = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
      }
      if (onOpenQuiz) {
        onOpenQuiz();
      } else if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("open-quiz-experience"));
      }
    },
    [onOpenQuiz],
  );

  return (
    <div
      className={`movie-item-container promo-drift-card-wrap quiz-drift-card-container ${isCompleted ? "quiz-drift-card--completed" : ""} ${className}`.trim()}
      data-quiz-card="true"
      data-height-ratio="1"
      onClick={handleOpen}
      role="button"
      tabIndex={0}
      aria-label="Open movie quiz"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleOpen();
        }
      }}
      style={{ cursor: "pointer" }}
    >
      <Card
        variant="default"
        className="movie-item-card promo-drift-card quiz-drift-card"
        style={{
          padding: 0,
          overflow: "hidden",
          cursor: "pointer",
        }}
      >
        <MediaCardPosterWrap className="movie-item-poster-wrap">
          <div className="promo-drift-card__body promo-drift-card__body--quiz">
            <div className="promo-drift-card__icon-wrap">
              <span className="promo-drift-card__emoji" aria-hidden="true">
                🍿
              </span>
            </div>
            <div className="promo-drift-card__text-block">
              <span className="promo-drift-card__badge">
                {isCompleted && outcome?.character
                  ? outcome.character === "Neither"
                    ? "Hybrid"
                    : outcome.character
                  : "Quiz"}
              </span>
              <div className="promo-drift-card__title">Movie Quiz</div>
              <div className="promo-drift-card__hint">
                {isCompleted ? "View archetype" : "Taste personality"}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="movie-item-details-hit-area"
            onClick={handleOpen}
            aria-label={
              isCompleted
                ? `View movie night quiz result: ${outcome?.character}`
                : "Start movie night personality quiz"
            }
          />
        </MediaCardPosterWrap>
      </Card>
    </div>
  );
};

export default QuizDriftCard;
