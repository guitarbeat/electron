import React, { useCallback, useMemo } from "react";
import type { User, QuizResult } from "@/shared/types";
import {
  CardTiltShell,
  CardTiltSheen,
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
}

const CHARACTER_CONFIG: Record<
  string,
  { emoji: string; color: string; archetype: string; image: string }
> = {
  Electra: {
    emoji: "💖",
    color: "#ff7ab8",
    archetype: "The Social Spark",
    image: "/quiz-photos/quiz-img-3.png",
  },
  Aaron: {
    emoji: "🦉",
    color: "#59c3ff",
    archetype: "The Thoughtful Curator",
    image: "/quiz-photos/quiz-img-2.png",
  },
  Madeleine: {
    emoji: "👑",
    color: "#f7c95c",
    archetype: "The Main Event",
    image: "/quiz-photos/quiz-img-5.png",
  },
  "Nosferatu/Smeemo": {
    emoji: "🦇",
    color: "#b58cff",
    archetype: "The Fearless Wildcard",
    image: "/quiz-photos/quiz-img-7.png",
  },
  Neither: {
    emoji: "🎞️",
    color: "#8ed6c5",
    archetype: "The Perfect Blend",
    image: "/quiz-photos/quiz-img-1.png",
  },
};

export const QuizDriftCard: React.FC<QuizDriftCardProps> = ({
  currentUser,
  isCompact = false,
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

  const characterData = useMemo(() => {
    if (!isCompleted || !outcome?.character) {
      return null;
    }
    return (
      CHARACTER_CONFIG[outcome.character] ?? CHARACTER_CONFIG["Neither"]
    );
  }, [isCompleted, outcome]);

  const topPercentage = useMemo(() => {
    if (!outcome?.percentages || !outcome.character) return null;
    return outcome.percentages[outcome.character as keyof typeof outcome.percentages] ?? null;
  }, [outcome]);

  const posterBackground = "/movie-quiz-cover.svg";
  const accentColor = characterData?.color || "#f59e0b";

  return (
    <div
      className={`movie-item-container quiz-drift-card-container ${isCompleted ? "quiz-drift-card--completed" : ""} ${className}`.trim()}
      data-quiz-card="true"
      data-height-ratio="1"
    >
      <CardTiltShell disabled={isCompact}>
        <Card
          variant="default"
          className="movie-item-card chroma-card quiz-drift-card"
          style={{
            padding: 0,
            overflow: "hidden",
            borderColor: isCompleted ? `${accentColor}55` : undefined,
          }}
        >
          <CardTiltSheen />
          <MediaCardPosterWrap className="movie-item-poster-wrap">
            {/* Background artwork */}
            <div
              className="quiz-drift-card__art"
              style={{
                backgroundImage: `url(${posterBackground})`,
              }}
            />

            {/* Gradient overlays for cinematic depth */}
            <div className="quiz-drift-card__vignette" />

            {/* Content overlay */}
            <div className="quiz-drift-card__content">
              <div className="quiz-drift-card__top-badge">
                <span
                  className="quiz-drift-card__pill"
                  style={{
                    borderColor: `${accentColor}88`,
                    color: "#ffffff",
                    backgroundColor: `${accentColor}33`,
                  }}
                >
                  {isCompleted ? "✨ ARCHETYPE" : "🎬 QUIZ"}
                </span>
                {topPercentage !== null && (
                  <span className="quiz-drift-card__match-pill">
                    {topPercentage}%
                  </span>
                )}
              </div>

              <div className="quiz-drift-card__bottom-info">
                {isCompleted && characterData ? (
                  <>
                    <div className="quiz-drift-card__char-title">
                      <span className="quiz-drift-card__emoji" aria-hidden="true">
                        {characterData.emoji}
                      </span>
                      <span className="quiz-drift-card__name">
                        {outcome?.character === "Neither"
                          ? "Hybrid Blend"
                          : outcome?.character}
                      </span>
                    </div>
                    <div className="quiz-drift-card__subtitle">
                      {characterData.archetype}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="quiz-drift-card__title">
                      Movie Night Quiz
                    </div>
                    <div className="quiz-drift-card__subtitle">
                      Discover your movie archetype
                    </div>
                  </>
                )}

                <div
                  className="quiz-drift-card__cta"
                  style={{
                    backgroundColor: `${accentColor}28`,
                    borderColor: `${accentColor}77`,
                  }}
                >
                  <span className="quiz-drift-card__cta-dot" style={{ backgroundColor: accentColor }} />
                  <span>{isCompleted ? "Review Match" : "Take Quiz"}</span>
                </div>
              </div>
            </div>

            {/* Transparent click hit area that triggers quiz opening */}
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
      </CardTiltShell>
    </div>
  );
};

export default QuizDriftCard;
