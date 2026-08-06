import React, { useEffect, useMemo, useState } from "react";
import {
  QuizAnswer,
  QuizResult,
  XYAxisQuestion as XYAxisQuestionType,
} from "./lib/types";
import type { QuizData } from "@/hooks/useQuiz";
import BlinkText from "./BlinkText";
import {
  MultipleChoiceQuestionView,
  AgreeDisagreeQuestionView,
  ImageChoiceQuestionView,
  XYAxisQuestionView,
} from "./QuestionViews";
import ResultsScreen from "./ResultsScreen";
import { calculateQuizResults } from "./lib/quizScoring";
import {
  buildQuizProgressStorageKey,
  clearSavedQuizProgress,
  readSavedQuizProgress,
  writeSavedQuizProgress,
} from "./lib/quizProgressStorage";
import "./retro-ad.css";

interface QuizFlowProps {
  onComplete: () => void;
  quizData: QuizData;
  sessionKey?: string;
  onRetake?: () => void;
  onEdit?: () => void;
  isCompleted?: boolean;
}

const EMPTY_QUESTIONS: QuizData["questions"] = [];

interface QuizFlowInitialState {
  currentQuestionIndex: number;
  answers: QuizAnswer[];
  showResults: boolean;
}

const QUIZ_EMPTY_STATE_TEXT_STYLE = {
  fontFamily: 'var(--font-body)',
  color: "#000080",
  fontWeight: "bold",
} satisfies React.CSSProperties;
const QUIZ_EMPTY_STATE_ACTIONS_STYLE = {
  display: "flex",
  gap: 8,
  justifyContent: "center",
} satisfies React.CSSProperties;
const QUIZ_RETAKE_BUTTON_STYLE = { marginTop: 10 } as const;

const getInitialQuizState = ({
  isCompleted,
  progressStorageKey,
  questionSignature,
  questionCount,
}: {
  isCompleted?: boolean;
  progressStorageKey: string;
  questionSignature: string;
  questionCount: number;
}): QuizFlowInitialState => {
  const savedProgress = isCompleted
    ? null
    : readSavedQuizProgress(progressStorageKey, questionSignature);
  const savedIndex = savedProgress?.currentQuestionIndex ?? 0;
  const maxIndex = Math.max(questionCount - 1, 0);

  return {
    currentQuestionIndex: Math.max(0, Math.min(savedIndex, maxIndex)),
    answers: savedProgress?.answers ?? [],
    showResults: Boolean(isCompleted),
  };
};

const QuizFlow: React.FC<QuizFlowProps> = ({
  onComplete,
  quizData,
  sessionKey = "guest",
  onRetake,
  onEdit,
  isCompleted,
}) => {
  const questions = useMemo(
    () => quizData.questions ?? EMPTY_QUESTIONS,
    [quizData.questions],
  );
  const questionSignature = useMemo(
    () => questions.map((question) => question.id).join("|"),
    [questions],
  );
  const progressStorageKey = useMemo(
    () => buildQuizProgressStorageKey(sessionKey),
    [sessionKey],
  );
  const [initialState] = useState(() =>
    getInitialQuizState({
      isCompleted,
      progressStorageKey,
      questionSignature,
      questionCount: questions.length,
    }),
  );

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
    initialState.currentQuestionIndex,
  );
  const [answers, setAnswers] = useState(initialState.answers);
  const [showResults, setShowResults] = useState(initialState.showResults);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress =
    totalQuestions > 0
      ? Math.round((currentQuestionIndex / totalQuestions) * 100)
      : 0;

  const clearProgressAndContinue = () => {
    clearSavedQuizProgress(progressStorageKey);
    onComplete();
  };

  useEffect(() => {
    if (isCompleted || showResults || totalQuestions === 0) {
      clearSavedQuizProgress(progressStorageKey);
      return;
    }

    writeSavedQuizProgress(progressStorageKey, {
      questionSignature,
      currentQuestionIndex,
      answers,
    });
  }, [
    answers,
    currentQuestionIndex,
    isCompleted,
    progressStorageKey,
    questionSignature,
    showResults,
    totalQuestions,
  ]);

  if (!currentQuestion && !showResults) {
    return (
      <div className="quiz-retro-wrapper">
        <div
          className="quiz-retro-question-card"
          style={{ textAlign: "center" }}
        >
          <p style={{ ...QUIZ_EMPTY_STATE_TEXT_STYLE, marginBottom: 12 }}>
            No quiz questions available.
          </p>
          <div style={QUIZ_EMPTY_STATE_ACTIONS_STYLE}>
            <button
              className="quiz-retro-btn"
              onClick={clearProgressAndContinue}
              aria-label="Continue"
            >
              Continue
            </button>
            {onEdit && (
              <button
                className="quiz-retro-btn quiz-retro-btn--secondary"
                onClick={onEdit}
                aria-label="Edit Quiz"
              >
                Edit Quiz
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentAnswer = currentQuestion
    ? answers.find((answer) => answer.questionId === currentQuestion.id)
    : undefined;
  const isAnswered =
    currentAnswer !== undefined &&
    (currentAnswer.answerIndex !== undefined ||
      currentAnswer.scaleValue !== undefined ||
      currentAnswer.xyPosition !== undefined);

  const handleAnswer = (
    answerIndex?: number,
    scaleValue?:
      | "stronglyDisagree"
      | "disagree"
      | "neutral"
      | "agree"
      | "stronglyAgree",
    xyPosition?: { x: number; y: number },
  ) => {
    if (!currentQuestion) {
      return;
    }

    const nextAnswer: QuizAnswer = {
      questionId: currentQuestion.id,
      answerIndex,
      scaleValue,
      xyPosition,
    };

    setAnswers((prev) => {
      const filtered = prev.filter(
        (answer) => answer.questionId !== currentQuestion.id,
      );
      return [...filtered, nextAnswer];
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      return;
    }

    const result = calculateQuizResults(answers, questions);
    clearSavedQuizProgress(progressStorageKey);
    setQuizResult(result);
    setShowResults(true);
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleRetake = () => {
    onRetake?.();
    clearSavedQuizProgress(progressStorageKey);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setShowResults(false);
    setQuizResult(null);
  };

  if (showResults) {
    if (!quizResult && isCompleted) {
      return (
        <div className="quiz-retro-wrapper">
          <div
            className="quiz-retro-question-card"
            style={{ textAlign: "center" }}
          >
            <p style={QUIZ_EMPTY_STATE_TEXT_STYLE}>🎉 Quiz Completed!</p>
            <button
              className="quiz-retro-btn"
              onClick={handleRetake}
              style={QUIZ_RETAKE_BUTTON_STYLE}
              aria-label="Retake Quiz"
            >
              🔄 RETAKE QUIZ!!!
            </button>
          </div>
        </div>
      );
    }

    if (quizResult) {
      return (
        <ResultsScreen
          result={quizResult}
          onContinue={onComplete}
          onRetake={handleRetake}
          onEdit={onEdit}
          characterDescriptions={quizData.characterDescriptions}
          neitherDescription={quizData.neitherDescription}
        />
      );
    }
  }

  const renderCurrentQuestion = () => {
    if (!currentQuestion) {
      return null;
    }

    switch (currentQuestion.type) {
      case "multiple-choice":
        return (
          <MultipleChoiceQuestionView
            key={currentQuestion.id}
            question={currentQuestion}
            selectedIndex={currentAnswer?.answerIndex ?? null}
            onSelect={(index) => handleAnswer(index)}
          />
        );
      case "agree-disagree":
        return (
          <AgreeDisagreeQuestionView
            key={currentQuestion.id}
            question={currentQuestion}
            selectedValue={currentAnswer?.scaleValue ?? null}
            onSelect={(value) => handleAnswer(undefined, value)}
          />
        );
      case "image-choice":
        return (
          <ImageChoiceQuestionView
            key={currentQuestion.id}
            question={currentQuestion}
            selectedIndex={currentAnswer?.answerIndex ?? null}
            onSelect={(index) => handleAnswer(index)}
          />
        );
      case "xy-axis":
        return (
          <XYAxisQuestionView
            key={currentQuestion.id}
            question={currentQuestion as XYAxisQuestionType}
            selectedPosition={currentAnswer?.xyPosition ?? null}
            onSelect={(position) =>
              handleAnswer(undefined, undefined, position)
            }
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="quiz-retro-wrapper">
      <div className="quiz-retro-marquee-bar">
        <span className="quiz-retro-marquee-inner">
          ★★★ CLICK HERE TO DISCOVER YOUR TRUE PERSONALITY!!! ★★★ LIMITED
          TIME!!! ★★★ 100% FREE!!! ★★★ AMAZING RESULTS AWAIT!!! ★★★
        </span>
      </div>

      <div className="quiz-retro-rainbow-border">
        <div className="quiz-retro-header-bar">
          <span>★ PERSONALITY QUIZ - FIND OUT WHO YOU REALLY ARE!!! ★</span>
        </div>
      </div>

      <div className="quiz-retro-main">
        <div className="quiz-retro-title-banner">
          <h2>🌟 WHICH CHARACTER ARE YOU?! 🌟</h2>
          <p>*** TAKE THE OFFICIAL QUIZ NOW - IT&apos;S TOTALLY FREE!!! ***</p>
        </div>

        {onEdit && (
          <div className="quiz-retro-utility-row">
            <div className="quiz-retro-utility-copy">
              <span className="quiz-retro-utility-label">EDITOR ACCESS</span>
              <span className="quiz-retro-utility-text">
                Adjust the questions anytime. Your current progress stays saved
                while you edit.
              </span>
            </div>
            <button
              type="button"
              className="quiz-retro-btn quiz-retro-btn--secondary quiz-retro-btn--compact"
              onClick={onEdit}
              aria-label="Edit quiz questions"
            >
              ✏️ EDIT QUIZ
            </button>
          </div>
        )}

        <div
          className="quiz-retro-progress-wrap"
          role="progressbar"
          aria-valuenow={currentQuestionIndex + 1}
          aria-valuemin={1}
          aria-valuemax={totalQuestions}
          aria-label={`Question ${currentQuestionIndex + 1} of ${totalQuestions}`}
        >
          <div className="quiz-retro-progress-label">
            ⚡ LOADING YOUR DESTINY... QUESTION {currentQuestionIndex + 1} OF{" "}
            {totalQuestions}!!! ⚡
          </div>
          <div className="quiz-retro-progress-track">
            <div
              className="quiz-retro-progress-fill"
              style={{ width: `${progress}%` }}
            />
            <div className="quiz-retro-progress-text">{progress}% COMPLETE</div>
          </div>
          <div className="quiz-retro-progress-sub">
            ⚡ ONLY {totalQuestions - currentQuestionIndex} QUESTIONS
            REMAINING!!! ACT NOW!!! ⚡
          </div>
        </div>

        <div className="quiz-retro-question-card">
          <div className="quiz-retro-question-title-bar">
            ▶ QUESTION {currentQuestionIndex + 1}:{" "}
            <BlinkText>ANSWER CAREFULLY!!!</BlinkText>
          </div>
          {renderCurrentQuestion()}
        </div>

        <div className="quiz-retro-nav-row">
          <button
            className="quiz-retro-btn quiz-retro-btn--secondary"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            aria-label="Previous question"
          >
            {"<< BACK"}
          </button>
          <button
            className="quiz-retro-btn"
            onClick={handleNext}
            disabled={!isAnswered}
            aria-label={
              currentQuestionIndex === totalQuestions - 1
                ? "See results"
                : "Next question"
            }
          >
            {currentQuestionIndex === totalQuestions - 1
              ? "🌟 SEE MY RESULTS!!!"
              : "NEXT QUESTION >>>"}
          </button>
        </div>

        <div className="quiz-retro-ad-strip">
          <span>⭐ YOU COULD BE A WINNER!!! ⭐</span>
          <p>Complete the quiz to discover your TRUE personality type!!!</p>
          <p
            style={{ color: "#888888", fontSize: "9px", fontWeight: "normal" }}
          >
            * Results are 100% scientific and totally official *
          </p>
        </div>
      </div>

      <div
        className="quiz-retro-marquee-bar"
        style={{ marginTop: 4, marginBottom: 0 }}
      >
        <span
          className="quiz-retro-marquee-inner"
          style={{ animationDelay: "-7s" }}
        >
          🌟 AMAZING!!! INCREDIBLE!!! UNBELIEVABLE QUIZ RESULTS AWAIT!!! 🌟 TAKE
          THE QUIZ NOW FOR FREE!!! 🌟 DON&apos;T MISS OUT!!! 🌟
        </span>
      </div>
    </div>
  );
};

export default QuizFlow;
