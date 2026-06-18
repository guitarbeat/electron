import { type FC } from "react";
import { HelpCircle } from "lucide-react";
import "./QuizPromoBanner.css";

interface QuizPromoBannerProps {
  onOpen: () => void;
  completed?: boolean;
}

const QuizPromoBanner: FC<QuizPromoBannerProps> = ({
  onOpen,
  completed = false,
}) => (
  <div className="quiz-promo" role="complementary" aria-label="Personality quiz">
    <button
      type="button"
      className="quiz-promo__btn"
      onClick={onOpen}
      aria-label={
        completed
          ? "Retake the couple personality quiz"
          : "Take the couple personality quiz"
      }
    >
      <span className="quiz-promo__icon" aria-hidden="true">
        <HelpCircle size={16} strokeWidth={2.2} />
      </span>
      <span className="quiz-promo__copy">
        <strong className="quiz-promo__title">Couple Quiz</strong>
        <span className="quiz-promo__detail">
          {completed
            ? "See how you match — retake anytime"
            : "Discover your movie-night personality"}
        </span>
      </span>
      <span className="quiz-promo__cta">{completed ? "Retake" : "Start"}</span>
    </button>
  </div>
);

export default QuizPromoBanner;
