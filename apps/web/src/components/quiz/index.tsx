/* eslint-disable react-refresh/only-export-components */
/**
 * Quiz Type Definitions
 *
 * Type definitions for the personality quiz system
 */

export type QuizCharacter =
  "Electra" | "Aaron" | "Madeleine" | "Nosferatu/Smeemo";

// Multiple Choice Question
export interface MultipleChoiceOption {
  text: string;
  scores: Partial<Record<QuizCharacter, number>>;
}

export interface MultipleChoiceQuestion {
  id: string;
  type: "multiple-choice";
  question: string;
  options: MultipleChoiceOption[];
}

// Agree/Disagree Scale Question
export interface AgreeDisagreeQuestion {
  id: string;
  type: "agree-disagree";
  question: string;
  // Scores for each level: [Strongly Disagree, Disagree, Neutral, Agree, Strongly Agree]
  scores: {
    stronglyDisagree: Partial<Record<QuizCharacter, number>>;
    disagree: Partial<Record<QuizCharacter, number>>;
    neutral: Partial<Record<QuizCharacter, number>>;
    agree: Partial<Record<QuizCharacter, number>>;
    stronglyAgree: Partial<Record<QuizCharacter, number>>;
  };
}

// Image Choice Question
export interface ImageChoiceOption {
  imageUrl: string;
  alt: string;
  scores: Partial<Record<QuizCharacter, number>>;
}

export interface ImageChoiceQuestion {
  id: string;
  type: "image-choice";
  question: string;
  options: ImageChoiceOption[];
}

// XY Axis Question (2D grid placement)
export interface XYAxisQuestion {
  id: string;
  type: "xy-axis";
  question: string;
  xAxis: {
    leftLabel: string;
    rightLabel: string;
  };
  yAxis: {
    topLabel: string;
    bottomLabel: string;
  };
  quadrantScores: {
    topLeft: Partial<Record<QuizCharacter, number>>;
    topRight: Partial<Record<QuizCharacter, number>>;
    bottomLeft: Partial<Record<QuizCharacter, number>>;
    bottomRight: Partial<Record<QuizCharacter, number>>;
  };
}

// Union type for all questions
export type QuizQuestion =
  | MultipleChoiceQuestion
  | AgreeDisagreeQuestion
  | ImageChoiceQuestion
  | XYAxisQuestion;

// User's answer to a question
export interface QuizAnswer {
  questionId: string;
  answerIndex?: number; // For multiple choice and image choice
  scaleValue?:
    "stronglyDisagree" | "disagree" | "neutral" | "agree" | "stronglyAgree"; // For agree/disagree
  xyPosition?: { x: number; y: number }; // For xy-axis (-1 to 1 range)
}

// Character scores
export type CharacterScores = Record<QuizCharacter, number>;

export const CHARACTERS: QuizCharacter[] = [
  "Aaron",
  "Electra",
  "Madeleine",
  "Nosferatu/Smeemo",
];

// Quiz result
export interface QuizResult {
  character: QuizCharacter | "Neither";
  scores: CharacterScores;
  percentages: Record<QuizCharacter, number>;
}

/**
 * Quiz Data
 *
 * Placeholder quiz questions and character descriptions
 * USER WILL REPLACE THESE WITH ACTUAL CONTENT
 */

export const quizQuestions: QuizQuestion[] = [
  // Multiple Choice Questions (3)
  {
    id: "mc1",
    type: "multiple-choice",
    question: "What's your ideal Friday night?",
    options: [
      // SCORING GUIDE:
      // 2 = Strong match
      // 1 = Partial match
      // 0 = No match
      {
        text: "Watching movies at home",
        scores: { Aaron: 2, Electra: 1, Madeleine: 0, "Nosferatu/Smeemo": 0 },
      },
      {
        text: "Going out to a party",
        scores: { Aaron: 0, Electra: 0, Madeleine: 2, "Nosferatu/Smeemo": 1 },
      },
      {
        text: "Reading a book alone",
        scores: { Aaron: 1, Electra: 0, Madeleine: 0, "Nosferatu/Smeemo": 2 },
      },
      {
        text: "Hanging with close friends",
        scores: { Aaron: 0, Electra: 2, Madeleine: 1, "Nosferatu/Smeemo": 0 },
      },
    ],
  },
  {
    id: "mc2",
    type: "multiple-choice",
    question: "Pick your favorite color palette:",
    options: [
      {
        text: "Warm and vibrant",
        scores: { Aaron: 0, Electra: 2, Madeleine: 0, "Nosferatu/Smeemo": 0 },
      },
      {
        text: "Cool and calming",
        scores: { Aaron: 2, Electra: 0, Madeleine: 0, "Nosferatu/Smeemo": 0 },
      },
      {
        text: "Bold and dramatic",
        scores: { Aaron: 0, Electra: 0, Madeleine: 2, "Nosferatu/Smeemo": 0 },
      },
      {
        text: "Dark and mysterious",
        scores: { Aaron: 0, Electra: 0, Madeleine: 0, "Nosferatu/Smeemo": 2 },
      },
    ],
  },
  {
    id: "mc3",
    type: "multiple-choice",
    question: "How do you handle stress?",
    options: [
      {
        text: "Talk it out with friends",
        scores: { Aaron: 0, Electra: 2, Madeleine: 1, "Nosferatu/Smeemo": 0 },
      },
      {
        text: "Process it internally",
        scores: { Aaron: 2, Electra: 0, Madeleine: 0, "Nosferatu/Smeemo": 1 },
      },
      {
        text: "Distract myself with activities",
        scores: { Aaron: 0, Electra: 0, Madeleine: 2, "Nosferatu/Smeemo": 0 },
      },
      {
        text: "Embrace the chaos",
        scores: { Aaron: 0, Electra: 0, Madeleine: 0, "Nosferatu/Smeemo": 2 },
      },
    ],
  },

  // Agree/Disagree Questions (3)
  {
    id: "ad1",
    type: "agree-disagree",
    question: "I prefer spontaneity over planning.",
    scores: {
      stronglyDisagree: {
        Aaron: 2,
        Electra: 0,
        Madeleine: 0,
        "Nosferatu/Smeemo": 0,
      },
      disagree: { Aaron: 1, Electra: 1, Madeleine: 0, "Nosferatu/Smeemo": 0 },
      neutral: { Aaron: 0, Electra: 0, Madeleine: 1, "Nosferatu/Smeemo": 0 },
      agree: { Aaron: 0, Electra: 1, Madeleine: 0, "Nosferatu/Smeemo": 1 },
      stronglyAgree: {
        Aaron: 0,
        Electra: 0,
        Madeleine: 0,
        "Nosferatu/Smeemo": 2,
      },
    },
  },
  {
    id: "ad2",
    type: "agree-disagree",
    question: "I'm more of a night owl than an early bird.",
    scores: {
      stronglyDisagree: {
        Aaron: 2,
        Electra: 0,
        Madeleine: 0,
        "Nosferatu/Smeemo": 0,
      },
      disagree: { Aaron: 1, Electra: 0, Madeleine: 0, "Nosferatu/Smeemo": 0 },
      neutral: { Aaron: 0, Electra: 1, Madeleine: 1, "Nosferatu/Smeemo": 0 },
      agree: { Aaron: 0, Electra: 0, Madeleine: 0, "Nosferatu/Smeemo": 1 },
      stronglyAgree: {
        Aaron: 0,
        Electra: 0,
        Madeleine: 0,
        "Nosferatu/Smeemo": 2,
      },
    },
  },
  {
    id: "ad3",
    type: "agree-disagree",
    question: "I enjoy being the center of attention.",
    scores: {
      stronglyDisagree: {
        Aaron: 2,
        Electra: 0,
        Madeleine: 0,
        "Nosferatu/Smeemo": 1,
      },
      disagree: { Aaron: 1, Electra: 0, Madeleine: 0, "Nosferatu/Smeemo": 0 },
      neutral: { Aaron: 0, Electra: 1, Madeleine: 0, "Nosferatu/Smeemo": 0 },
      agree: { Aaron: 0, Electra: 1, Madeleine: 1, "Nosferatu/Smeemo": 0 },
      stronglyAgree: {
        Aaron: 0,
        Electra: 0,
        Madeleine: 2,
        "Nosferatu/Smeemo": 0,
      },
    },
  },

  // Image Choice Questions (3)
  {
    id: "img1",
    type: "image-choice",
    question: "Which aesthetic speaks to you?",
    options: [
      {
        imageUrl: "/quiz-photos/quiz-img-1.png",
        alt: "Vibrant and fun aesthetic",
        scores: { Aaron: 0, Electra: 2, Madeleine: 0, "Nosferatu/Smeemo": 0 },
      },
      {
        imageUrl: "/quiz-photos/quiz-img-2.png",
        alt: "Calm and serene aesthetic",
        scores: { Aaron: 2, Electra: 0, Madeleine: 0, "Nosferatu/Smeemo": 0 },
      },
      {
        imageUrl: "/quiz-photos/quiz-img-3.png",
        alt: "Bold and artistic aesthetic",
        scores: { Aaron: 0, Electra: 0, Madeleine: 2, "Nosferatu/Smeemo": 0 },
      },
      {
        imageUrl: "/quiz-photos/quiz-img-4.png",
        alt: "Dark and edgy aesthetic",
        scores: { Aaron: 0, Electra: 0, Madeleine: 0, "Nosferatu/Smeemo": 2 },
      },
    ],
  },
  {
    id: "img2",
    type: "image-choice",
    question: "Pick your ideal vacation spot:",
    options: [
      {
        imageUrl: "/quiz-photos/quiz-img-5.png",
        alt: "Beach paradise",
        scores: { Aaron: 0, Electra: 2, Madeleine: 1, "Nosferatu/Smeemo": 0 },
      },
      {
        imageUrl: "/quiz-photos/quiz-img-6.png",
        alt: "Mountain retreat",
        scores: { Aaron: 2, Electra: 0, Madeleine: 0, "Nosferatu/Smeemo": 0 },
      },
      {
        imageUrl: "/quiz-photos/quiz-img-7.png",
        alt: "City adventure",
        scores: { Aaron: 0, Electra: 0, Madeleine: 2, "Nosferatu/Smeemo": 0 },
      },
      {
        imageUrl: "/quiz-photos/quiz-img-8.png",
        alt: "Remote cabin",
        scores: { Aaron: 1, Electra: 0, Madeleine: 0, "Nosferatu/Smeemo": 2 },
      },
    ],
  },
  {
    id: "img3",
    type: "image-choice",
    question: "Choose your spirit animal:",
    options: [
      {
        imageUrl: "/quiz-photos/quiz-img-9.png",
        alt: "Butterfly",
        scores: { Aaron: 0, Electra: 2, Madeleine: 0, "Nosferatu/Smeemo": 0 },
      },
      {
        imageUrl: "/quiz-photos/quiz-img-10.png",
        alt: "Owl",
        scores: { Aaron: 2, Electra: 0, Madeleine: 0, "Nosferatu/Smeemo": 0 },
      },
      {
        imageUrl: "/quiz-photos/quiz-img-11.png",
        alt: "Lion",
        scores: { Aaron: 0, Electra: 0, Madeleine: 2, "Nosferatu/Smeemo": 0 },
      },
      {
        imageUrl: "/quiz-photos/quiz-img-12.png",
        alt: "Raven",
        scores: { Aaron: 0, Electra: 0, Madeleine: 0, "Nosferatu/Smeemo": 2 },
      },
    ],
  },
];

export const characterDescriptions: Record<QuizCharacter, string> = {
  Electra:
    "You're vibrant, social, and full of energy! You light up every room you enter.",
  Aaron:
    "You're thoughtful, introspective, and value deep connections. You prefer quality over quantity.",
  Madeleine:
    "You're bold, confident, and love to stand out. You're not afraid to take the spotlight.",
  "Nosferatu/Smeemo":
    "You're mysterious, unique, and march to the beat of your own drum. You embrace the unconventional.",
};

export const neitherDescription =
  "You're a unique enigma! Your personality doesn't fit neatly into any of our boxes. You're truly one of a kind.";

export const calculateQuizResults = (
  answers: QuizAnswer[],
  questions: QuizQuestion[],
): QuizResult => {
  // Initialize scores dynamically based on CHARACTERS constant
  const scores: CharacterScores = CHARACTERS.reduce((acc, char) => {
    acc[char] = 0;
    return acc;
  }, {} as CharacterScores);

  // Calculate scores from answers
  answers.forEach((answer) => {
    const question = questions.find((q) => q.id === answer.questionId);
    if (!question) return;

    if (
      question.type === "multiple-choice" &&
      answer.answerIndex !== undefined
    ) {
      const option = question.options[answer.answerIndex];
      Object.entries(option.scores).forEach(([char, score]) => {
        scores[char as QuizCharacter] += score as number;
      });
    } else if (question.type === "agree-disagree" && answer.scaleValue) {
      const scaleScores = question.scores[answer.scaleValue];
      Object.entries(scaleScores).forEach(([char, score]) => {
        scores[char as QuizCharacter] += score as number;
      });
    } else if (
      question.type === "image-choice" &&
      answer.answerIndex !== undefined
    ) {
      const option = question.options[answer.answerIndex];
      Object.entries(option.scores).forEach(([char, score]) => {
        scores[char as QuizCharacter] += score as number;
      });
    } else if (question.type === "xy-axis" && answer.xyPosition) {
      // Calculate quadrant weights based on position
      const { x, y } = answer.xyPosition;
      const { quadrantScores } = question;

      // Weight calculation: how much each quadrant contributes
      // topLeft: x < 0, y > 0
      // topRight: x > 0, y > 0
      // bottomLeft: x < 0, y < 0
      // bottomRight: x > 0, y < 0
      const tlWeight = Math.max(0, -x) * Math.max(0, y);
      const trWeight = Math.max(0, x) * Math.max(0, y);
      const blWeight = Math.max(0, -x) * Math.max(0, -y);
      const brWeight = Math.max(0, x) * Math.max(0, -y);

      const totalWeight = tlWeight + trWeight + blWeight + brWeight || 1;

      // Apply weighted scores from each quadrant
      const applyQuadrant = (
        qScores: Partial<Record<QuizCharacter, number>>,
        weight: number,
      ) => {
        Object.entries(qScores).forEach(([char, score]) => {
          scores[char as QuizCharacter] +=
            ((score as number) * weight) / totalWeight;
        });
      };

      applyQuadrant(quadrantScores.topLeft, tlWeight);
      applyQuadrant(quadrantScores.topRight, trWeight);
      applyQuadrant(quadrantScores.bottomLeft, blWeight);
      applyQuadrant(quadrantScores.bottomRight, brWeight);
    }
  });

  // Find highest scoring character
  const sortedCharacters = (Object.keys(scores) as QuizCharacter[]).sort(
    (a, b) => scores[b] - scores[a],
  );
  const [topCharacter] = sortedCharacters;

  // Calculate percentages
  const totalScore = Object.values(scores).reduce(
    (sum, score) => sum + score,
    0,
  );

  const percentages = normalizeQuizPercentages(scores);

  // Determine if result is "Neither"
  // If the top character has less than 35% of the total score, it's a weak match
  // Also default to "Neither" if total score is 0
  const topScore = scores[topCharacter];
  const isNeither =
    totalScore === 0 || (totalScore > 0 && topScore / totalScore < 0.35);

  const result: QuizResult = {
    character: isNeither ? "Neither" : topCharacter,
    scores,
    percentages,
  };

  return result;
};

import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import type { FC } from "react";
import type { User } from "@/shared/types";
import {
  normalizeQuizPercentages,
  readSavedQuizProgress,
  writeSavedQuizProgress,
  clearSavedQuizProgress,
  buildQuizProgressStorageKey,
  readSavedQuizOutcome,
  writeSavedQuizOutcome,
  clearSavedQuizOutcome,
  buildQuizOutcomeStorageKey,
  readSavedQuizResult,
  writeSavedQuizResult,
  clearSavedQuizResult,
  buildQuizResultStorageKey,
  formatQuizOutcomeSummary,
  type SavedQuizProgress,
} from "@/shared/quizData";
import { copyTextToClipboard } from "@/utils/dom";

export {
  readSavedQuizProgress,
  writeSavedQuizProgress,
  clearSavedQuizProgress,
  buildQuizProgressStorageKey,
  readSavedQuizOutcome,
  writeSavedQuizOutcome,
  clearSavedQuizOutcome,
  buildQuizOutcomeStorageKey,
  readSavedQuizResult,
  writeSavedQuizResult,
  clearSavedQuizResult,
  buildQuizResultStorageKey,
  type SavedQuizProgress,
};
import { WorkspaceFeatureSectionLoading, PageFlip, type PageFlipLeaf } from "@/components/ui";
import { useViewport } from "@/app/providerContexts";
import { useQuiz, type QuizData, useFeatureFonts } from "@/hooks";

export const BLINK_COLORS = [
  "#ff0000",
  "#ff7700",
  "#ffff00",
  "#00cc00",
  "#0000ff",
  "#8b00ff",
];

interface BlinkTextProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const BlinkText: React.FC<BlinkTextProps> = ({
  children,
  style = {},
}) => {
  return (
    <span className="quiz-retro-blink" style={style}>
      {children}
    </span>
  );
};

interface MultipleChoiceQuestionViewProps {
  question: MultipleChoiceQuestion;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export const MultipleChoiceQuestionView: React.FC<
  MultipleChoiceQuestionViewProps
> = ({ question, selectedIndex, onSelect }) => {
  return (
    <div>
      <div className="quiz-retro-question-text">{question.question}</div>
      <div>
        {question.options.map((option, index: number) => (
          <button
            key={index}
            className={`quiz-retro-option${selectedIndex === index ? " quiz-retro-option--selected" : ""}`}
            onClick={() => onSelect(index)}
            aria-pressed={selectedIndex === index}
          >
            <span className="quiz-retro-option__indicator" aria-hidden="true">
              {selectedIndex === index ? "✓" : String(index + 1)}
            </span>
            <span>{option.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

interface AgreeDisagreeQuestionViewProps {
  question: AgreeDisagreeQuestion;
  selectedValue:
    | "stronglyDisagree"
    | "disagree"
    | "neutral"
    | "agree"
    | "stronglyAgree"
    | null;
  onSelect: (
    value:
      "stronglyDisagree" | "disagree" | "neutral" | "agree" | "stronglyAgree",
  ) => void;
}

export const AgreeDisagreeQuestionView: React.FC<
  AgreeDisagreeQuestionViewProps
> = ({ question, selectedValue, onSelect }) => {
  const scaleOptions = [
    { value: "stronglyDisagree", label: "Not me" },
    { value: "disagree", label: "Mostly not" },
    { value: "neutral", label: "In between" },
    { value: "agree", label: "Mostly me" },
    { value: "stronglyAgree", label: "Exactly me" },
  ] as const;

  return (
    <div>
      <div className="quiz-retro-question-text">{question.question}</div>
      <div className="quiz-retro-slider-wrap">
        <div
          className="quiz-retro-scale-options"
          role="group"
          aria-label="How much does this sound like you?"
        >
          {scaleOptions.map((option, index) => {
            const isSelected = selectedValue === option.value;
            return (
              <button
                key={option.value}
                type="button"
                className={`quiz-retro-scale-option${isSelected ? " is-selected" : ""}`}
                onClick={() => onSelect(option.value)}
                aria-pressed={isSelected}
              >
                <span aria-hidden="true">{index + 1}</span>
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface ImageChoiceQuestionViewProps {
  question: ImageChoiceQuestion;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export const ImageChoiceQuestionView: React.FC<
  ImageChoiceQuestionViewProps
> = ({ question, selectedIndex, onSelect }) => {
  return (
    <div>
      <div className="quiz-retro-question-text">{question.question}</div>
      <div
        className="quiz-retro-img-grid"
        style={{
          gridTemplateColumns:
            question.options.length === 2
              ? "repeat(2, 1fr)"
              : "repeat(auto-fit, minmax(160px, 1fr))",
        }}
      >
        {question.options.map((option, index: number) => (
          <button
            key={index}
            className={`quiz-retro-img-option${selectedIndex === index ? " quiz-retro-img-option--selected" : ""}`}
            onClick={() => onSelect(index)}
            aria-pressed={selectedIndex === index}
            aria-label={option.alt}
          >
            <img
              src={option.imageUrl}
              alt={option.alt}
              loading="lazy"
              decoding="async"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
            {selectedIndex === index && (
              <div className="quiz-retro-img-checkmark">✓</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

interface XYAxisQuestionViewProps {
  question: XYAxisQuestion;
  selectedPosition: { x: number; y: number } | null;
  onSelect: (position: { x: number; y: number }) => void;
}

export const XYAxisQuestionView: React.FC<XYAxisQuestionViewProps> = ({
  question,
  selectedPosition,
  onSelect,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const gridRectRef = useRef<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const calculatePosition = useCallback((clientX: number, clientY: number) => {
    let rect = gridRectRef.current;
    if (!rect && gridRef.current) {
      const domRect = gridRef.current.getBoundingClientRect();
      rect = {
        left: domRect.left,
        top: domRect.top,
        width: domRect.width || 1,
        height: domRect.height || 1,
      };
      gridRectRef.current = rect;
    }
    if (!rect) return null;
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = 1 - ((clientY - rect.top) / rect.height) * 2;
    return {
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    if (gridRef.current) {
      const domRect = gridRef.current.getBoundingClientRect();
      gridRectRef.current = {
        left: domRect.left,
        top: domRect.top,
        width: domRect.width || 1,
        height: domRect.height || 1,
      };
    }
    const pos = calculatePosition(e.clientX, e.clientY);
    if (pos) onSelect(pos);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const pos = calculatePosition(e.clientX, e.clientY);
    if (pos) onSelect(pos);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    gridRectRef.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    if (gridRef.current) {
      const domRect = gridRef.current.getBoundingClientRect();
      gridRectRef.current = {
        left: domRect.left,
        top: domRect.top,
        width: domRect.width || 1,
        height: domRect.height || 1,
      };
    }
    const [touch] = Array.from(e.touches);
    if (!touch) return;
    const pos = calculatePosition(touch.clientX, touch.clientY);
    if (pos) onSelect(pos);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const [touch] = Array.from(e.touches);
    if (!touch) return;
    const pos = calculatePosition(touch.clientX, touch.clientY);
    if (pos) onSelect(pos);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    gridRectRef.current = null;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = 0.1;
    const current = selectedPosition || { x: 0, y: 0 };
    const newPos = { ...current };

    switch (e.key) {
      case "ArrowLeft":
        newPos.x = Math.max(-1, current.x - step);
        break;
      case "ArrowRight":
        newPos.x = Math.min(1, current.x + step);
        break;
      case "ArrowUp":
        newPos.y = Math.min(1, current.y + step);
        break;
      case "ArrowDown":
        newPos.y = Math.max(-1, current.y - step);
        break;
      default:
        return;
    }

    e.preventDefault();
    onSelect(newPos);
  };

  const markerLeft = selectedPosition
    ? ((selectedPosition.x + 1) / 2) * 100
    : 50;
  const markerTop = selectedPosition
    ? ((1 - selectedPosition.y) / 2) * 100
    : 50;

  return (
    <div>
      <div className="quiz-retro-question-text">{question.question}</div>
      <div
        style={{ position: "relative", maxWidth: "380px", margin: "0 auto" }}
      >
        <div className="quiz-retro-xy-label" style={{ marginBottom: 4 }}>
          {question.yAxis.topLabel}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            className="quiz-retro-xy-label"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            {question.xAxis.leftLabel}
          </div>
          <div
            ref={gridRef}
            role="button"
            aria-label="XY position selector"
            tabIndex={0}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onKeyDown={handleKeyDown}
            className="quiz-retro-xy-grid"
            style={{ flex: 1, aspectRatio: "1" }}
          >
            <div className="quiz-retro-xy-axis-h" />
            <div className="quiz-retro-xy-axis-v" />
            {selectedPosition && (
              <div
                className="quiz-retro-xy-marker"
                style={{
                  left: `${markerLeft}%`,
                  top: `${markerTop}%`,
                  transition: isDragging
                    ? "none"
                    : "left 150ms var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1)), top 150ms var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1))",
                }}
              />
            )}
          </div>
          <div
            className="quiz-retro-xy-label"
            style={{ writingMode: "vertical-rl" }}
          >
            {question.xAxis.rightLabel}
          </div>
        </div>
        <div className="quiz-retro-xy-label" style={{ marginTop: 4 }}>
          {question.yAxis.bottomLabel}
        </div>
      </div>
      {selectedPosition && (
        <div
          style={{
            textAlign: "center",
            marginTop: 6,
            fontSize: "9px",
            color: "#888888",
            fontFamily: "var(--font-body)",
          }}
          role="status"
          aria-live="polite"
        >
          Position: ({selectedPosition.x.toFixed(2)},{" "}
          {selectedPosition.y.toFixed(2)})
        </div>
      )}
    </div>
  );
};

interface QuizEditorProps {
  onClose: () => void;
}

export const QuizEditor: React.FC<QuizEditorProps> = ({ onClose }) => {
  return (
    <div className={"quiz-editor-shell"}>
      <div className={"quiz-editor__hero"}>
        <h1 className={"quiz-editor__hero-title"}>Quiz Editor</h1>
        <p>
          The quiz editor is temporarily unavailable while styles are being
          updated.
        </p>
        <button className="ui-button ui-button--primary" onClick={onClose}>
          <span className={"ui-button__content"}>Close Editor</span>
        </button>
      </div>
    </div>
  );
};

export interface QuizExperienceProps {
  currentUser: User | null;
  quizCompleted: boolean;
  onComplete: (outcome?: QuizResult) => void;
  onRetake: () => void;
  onEdit?: () => void;
}

export const QuizExperience: FC<QuizExperienceProps> = ({
  currentUser,
  quizCompleted,
  onComplete,
  onRetake,
  onEdit,
}) => {
  const { quizData, isLoading } = useQuiz();
  useFeatureFonts();

  if (isLoading || !quizData) {
    return <WorkspaceFeatureSectionLoading label="Loading personality quiz…" />;
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

interface QuizFlowProps {
  onComplete: (outcome?: QuizResult) => void;
  quizData: QuizData;
  sessionKey?: string;
  onRetake?: () => void;
  onEdit?: () => void;
  isCompleted?: boolean;
}

export const EMPTY_QUESTIONS: QuizData["questions"] = [];

interface QuizFlowInitialState {
  currentQuestionIndex: number;
  answers: QuizAnswer[];
  showResults: boolean;
  result: QuizResult | null;
}

export const QUIZ_EMPTY_STATE_TEXT_STYLE = {
  fontFamily: "var(--font-body)",
  color: "#000080",
  fontWeight: "bold",
} satisfies React.CSSProperties;
export const QUIZ_EMPTY_STATE_ACTIONS_STYLE = {
  display: "flex",
  gap: 8,
  justifyContent: "center",
} satisfies React.CSSProperties;
export const QUIZ_RETAKE_BUTTON_STYLE = { marginTop: 10 } as const;

const getInitialQuizState = ({
  isCompleted,
  progressStorageKey,
  outcomeStorageKey,
  questionSignature,
  questionCount,
}: {
  isCompleted?: boolean;
  progressStorageKey: string;
  outcomeStorageKey: string;
  questionSignature: string;
  questionCount: number;
}): QuizFlowInitialState => {
  const savedProgress = readSavedQuizProgress(progressStorageKey, questionSignature);
  const savedOutcome =
    readSavedQuizOutcome(outcomeStorageKey) ??
    savedProgress?.result ??
    savedProgress?.outcome ??
    null;
  const savedIndex = savedProgress?.currentQuestionIndex ?? 0;
  const maxIndex = Math.max(questionCount - 1, 0);
  const hasCompleted = Boolean(isCompleted || savedProgress?.isCompleted || savedOutcome);

  return {
    currentQuestionIndex: hasCompleted ? maxIndex : Math.max(0, Math.min(savedIndex, maxIndex)),
    answers: savedProgress?.answers ?? [],
    showResults: hasCompleted,
    result: savedOutcome,
  };
};

const characterEmojis: Record<string, string> = {
  Electra: "💖",
  Aaron: "🦉",
  Madeleine: "👑",
  "Nosferatu/Smeemo": "🦇",
  Neither: "🎞️",
};

const characterColors: Record<string, string> = {
  Electra: "#ff7ab8",
  Aaron: "#59c3ff",
  Madeleine: "#f7c95c",
  "Nosferatu/Smeemo": "#b58cff",
  Neither: "#8ed6c5",
};

const characterArchetypes: Record<string, string> = {
  Electra: "The Social Spark",
  Aaron: "The Thoughtful Curator",
  Madeleine: "The Main Event",
  "Nosferatu/Smeemo": "The Fearless Wildcard",
  Neither: "The Perfect Blend",
};

const getResultDescription = (
  result: QuizResult,
  characterDescriptions: Record<QuizCharacter, string>,
  neitherDescription: string,
) =>
  result.character === "Neither"
    ? neitherDescription
    : (characterDescriptions[result.character as QuizCharacter] ??
      `You got ${result.character}!`);

export const QuizFlow: React.FC<QuizFlowProps> = ({
  onComplete,
  quizData,
  sessionKey = "guest",
  onRetake,
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
  const outcomeStorageKey = useMemo(
    () => buildQuizOutcomeStorageKey(sessionKey),
    [sessionKey],
  );
  const [initialState] = useState(() =>
    getInitialQuizState({
      isCompleted,
      progressStorageKey,
      outcomeStorageKey,
      questionSignature,
      questionCount: questions.length,
    }),
  );

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
    initialState.currentQuestionIndex,
  );
  const [answers, setAnswers] = useState(initialState.answers);
  const [showResults, setShowResults] = useState(initialState.showResults);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(() => {
    if (initialState.result) {
      return initialState.result;
    }
    if (initialState.showResults && initialState.answers.length > 0 && questions.length > 0) {
      return calculateQuizResults(initialState.answers, questions);
    }
    return null;
  });
  const [isQuizStarted, setIsQuizStarted] = useState(
    () => initialState.currentQuestionIndex > 0 || initialState.answers.length > 0 || Boolean(initialState.showResults),
  );
  const { isMobile } = useViewport();

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress =
    totalQuestions > 0
      ? Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)
      : 0;

  const clearProgressAndContinue = () => {
    onComplete(quizResult ?? undefined);
  };

  useEffect(() => {
    if (totalQuestions === 0) {
      return;
    }

    if (showResults && quizResult) {
      writeSavedQuizOutcome(outcomeStorageKey, quizResult);
      writeSavedQuizProgress(progressStorageKey, {
        questionSignature,
        currentQuestionIndex: Math.max(0, totalQuestions - 1),
        answers,
        result: quizResult,
        outcome: quizResult,
        isCompleted: true,
      });
      return;
    }

    if (!showResults) {
      writeSavedQuizProgress(progressStorageKey, {
        questionSignature,
        currentQuestionIndex,
        answers,
        result: null,
        outcome: null,
        isCompleted: false,
      });
    }
  }, [
    answers,
    currentQuestionIndex,
    outcomeStorageKey,
    progressStorageKey,
    questionSignature,
    quizResult,
    showResults,
    totalQuestions,
  ]);

  const currentAnswer = currentQuestion
    ? answers.find((answer) => answer.questionId === currentQuestion.id)
    : undefined;
  const isAnswered =
    currentAnswer !== undefined &&
    (currentAnswer.answerIndex !== undefined ||
      currentAnswer.scaleValue !== undefined ||
      currentAnswer.xyPosition !== undefined);

  const activeResult = useMemo(() => {
    if (quizResult) return quizResult;
    if (answers.length > 0 && questions.length > 0) {
      return calculateQuizResults(answers, questions);
    }
    return null;
  }, [quizResult, answers, questions]);

  const sortedChars = useMemo(() => {
    if (!activeResult) return [] as QuizCharacter[];
    return (Object.keys(activeResult.percentages) as QuizCharacter[]).sort(
      (a, b) => activeResult.percentages[b] - activeResult.percentages[a],
    );
  }, [activeResult]);

  const handleAnswer = useCallback(
    (
      questionId: string,
      answerIndex?: number,
      scaleValue?:
        | "stronglyDisagree"
        | "disagree"
        | "neutral"
        | "agree"
        | "stronglyAgree",
      xyPosition?: { x: number; y: number },
    ) => {
      const nextAnswer: QuizAnswer = {
        questionId,
        answerIndex,
        scaleValue,
        xyPosition,
      };

      let updatedAnswers: QuizAnswer[] = [];
      setAnswers((prev) => {
        const filtered = prev.filter(
          (answer) => answer.questionId !== questionId,
        );
        updatedAnswers = [...filtered, nextAnswer];
        return updatedAnswers;
      });

      // Auto-advance
      setTimeout(() => {
        const qIndex = questions.findIndex((q) => q.id === questionId);
        if (qIndex !== -1) {
          if (qIndex < totalQuestions - 1) {
            setCurrentQuestionIndex(qIndex + 1);
          } else {
            // Reached the end: compute results and turn to results leaf!
            const finalAnswers = updatedAnswers.length > 0 ? updatedAnswers : [nextAnswer];
            const finalResult = calculateQuizResults(
              finalAnswers,
              questions,
            );
            writeSavedQuizOutcome(outcomeStorageKey, finalResult);
            writeSavedQuizProgress(progressStorageKey, {
              questionSignature,
              currentQuestionIndex: Math.max(0, totalQuestions - 1),
              answers: finalAnswers,
              result: finalResult,
              outcome: finalResult,
              isCompleted: true,
            });
            setQuizResult(finalResult);
            setShowResults(true);
          }
        }
      }, 450);
    },
    [questions, totalQuestions, progressStorageKey, outcomeStorageKey, questionSignature],
  );

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      return;
    }

    const result = calculateQuizResults(answers, questions);
    writeSavedQuizOutcome(outcomeStorageKey, result);
    writeSavedQuizProgress(progressStorageKey, {
      questionSignature,
      currentQuestionIndex: Math.max(0, totalQuestions - 1),
      answers,
      result,
      outcome: result,
      isCompleted: true,
    });
    setQuizResult(result);
    setShowResults(true);
  }, [answers, currentQuestionIndex, outcomeStorageKey, progressStorageKey, questionSignature, questions, totalQuestions]);

  const handlePrevious = useCallback(() => {
    if (showResults) {
      setShowResults(false);
      setCurrentQuestionIndex(Math.max(0, totalQuestions - 1));
    } else if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    } else if (currentQuestionIndex === 0) {
      setIsQuizStarted(false);
    }
  }, [currentQuestionIndex, showResults, totalQuestions]);

  const handleRetake = useCallback(() => {
    onRetake?.();
    clearSavedQuizProgress(progressStorageKey);
    clearSavedQuizOutcome(outcomeStorageKey);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setShowResults(false);
    setQuizResult(null);
    setIsQuizStarted(true);
  }, [onRetake, outcomeStorageKey, progressStorageKey]);

  const [bookletCopied, setBookletCopied] = useState(false);

  const handleBookletShare = useCallback(async () => {
    if (!activeResult) return;
    const resName =
      activeResult.character === "Neither"
        ? "A little bit of everyone"
        : activeResult.character;
    const desc = getResultDescription(
      activeResult,
      quizData.characterDescriptions,
      quizData.neitherDescription,
    );
    const summary = formatQuizOutcomeSummary({
      result: activeResult,
      resultName: resName,
      archetype: characterArchetypes[activeResult.character],
      description: desc,
      characterEmojis,
    });

    try {
      await copyTextToClipboard(summary);
      setBookletCopied(true);
      setTimeout(() => setBookletCopied(false), 2500);
    } catch (err) {
      console.warn("Failed to copy quiz outcome summary to clipboard:", err);
    }
  }, [activeResult, quizData.characterDescriptions, quizData.neitherDescription]);

  const renderQuestion = useCallback(
    (q: QuizQuestion, answer?: QuizAnswer) => {
      switch (q.type) {
        case "multiple-choice":
          return (
            <MultipleChoiceQuestionView
              key={q.id}
              question={q}
              selectedIndex={answer?.answerIndex ?? null}
              onSelect={(index) => handleAnswer(q.id, index)}
            />
          );
        case "agree-disagree":
          return (
            <AgreeDisagreeQuestionView
              key={q.id}
              question={q}
              selectedValue={answer?.scaleValue ?? null}
              onSelect={(value) => handleAnswer(q.id, undefined, value)}
            />
          );
        case "image-choice":
          return (
            <ImageChoiceQuestionView
              key={q.id}
              question={q}
              selectedIndex={answer?.answerIndex ?? null}
              onSelect={(index) => handleAnswer(q.id, index)}
            />
          );
        case "xy-axis":
          return (
            <XYAxisQuestionView
              key={q.id}
              question={q as XYAxisQuestion}
              selectedPosition={answer?.xyPosition ?? null}
              onSelect={(position) =>
                handleAnswer(q.id, undefined, undefined, position)
              }
            />
          );
        default:
          return null;
      }
    },
    [handleAnswer],
  );

  const pages: PageFlipLeaf[] = useMemo(() => {
    const allPages: PageFlipLeaf[] = [];

    // Page 0: Cover Leaf
    allPages.push({
      id: "cover",
      front: (
        <div
          className="flex h-full w-full flex-col bg-[#0d111a] text-white overflow-hidden items-center justify-center p-6 border-r border-white/10 relative cursor-pointer select-none group"
          style={{ borderRadius: "inherit" }}
          onClick={() => setIsQuizStarted(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsQuizStarted(true);
            }
          }}
          aria-label="Start Quiz: Which character are you?"
        >
          <div
            className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-300"
            style={{
              background:
                "linear-gradient(135deg, #f472b6, #a855f7, #38bdf8)",
            }}
          />
          <div className="relative text-center z-10">
            <span className="text-xs uppercase tracking-widest text-slate-300 mb-2 block">
              Movie-night personality
            </span>
            <h2 className="text-3xl font-bold mb-4 text-white">
              Which character are you?
            </h2>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-xs font-semibold tracking-wider uppercase text-white shadow-sm group-hover:bg-white/20 transition-all">
              Open booklet & start →
            </div>
          </div>
        </div>
      ),
      back: (
        <div
          className="flex h-full w-full flex-col bg-[#0d111a] text-slate-300 p-6 border-l border-white/10 justify-center text-center"
          style={{ borderRadius: "inherit" }}
        >
          <div className="opacity-60">
            <p className="text-lg font-medium text-white">
              Seven quick questions.
            </p>
            <p className="text-sm mt-2 text-slate-400">
              Go with your first instinct.
            </p>
          </div>
        </div>
      ),
    });

    // Pages 1..N: Questions
    questions.forEach((q, i) => {
      const answer = answers.find((a) => a.questionId === q.id);
      const isLastQuestion = i === questions.length - 1;

      allPages.push({
        id: q.id,
        front: (
          <div
            className="flex h-full w-full flex-col bg-[#0d111a] text-white border-r border-white/10 overflow-hidden"
            style={{ borderRadius: "inherit" }}
          >
            <div
              className="flex-1 overflow-y-auto custom-scrollbar p-6"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {renderQuestion(q, answer)}
            </div>
          </div>
        ),
        back: isLastQuestion && activeResult ? (
          <div
            className="flex h-full w-full flex-col bg-[#0d111a] text-white p-6 border-l border-white/10 justify-center items-center text-center relative overflow-hidden"
            style={{ borderRadius: "inherit" }}
          >
            <div
              className="absolute inset-0 opacity-25 pointer-events-none"
              style={{
                background: `radial-gradient(circle at center, ${
                  characterColors[activeResult.character] || "#8ed6c5"
                } 0%, transparent 70%)`,
              }}
            />
            <div className="relative z-10 flex flex-col items-center">
              <div
                className="text-5xl sm:text-6xl mb-3 animate-pulse"
                style={{ animationDuration: "2.5s" }}
              >
                {characterEmojis[activeResult.character] || "🎞️"}
              </div>
              <span className="text-[11px] uppercase tracking-widest text-slate-400 mb-1">
                Your Movie-Night Match
              </span>
              <h3
                className="text-2xl sm:text-3xl font-bold mb-1.5"
                style={{
                  color:
                    characterColors[activeResult.character] || "#fff",
                }}
              >
                {activeResult.character === "Neither"
                  ? "A little bit of everyone"
                  : activeResult.character}
              </h3>
              <p className="text-xs text-slate-300 font-medium px-3 py-1 rounded-full bg-white/10 border border-white/10 mt-1 mb-3">
                {characterArchetypes[activeResult.character] ??
                  "Your movie-night match"}
              </p>
              <p className="text-xs text-slate-400 italic max-w-[240px] line-clamp-3">
                &ldquo;
                {getResultDescription(
                  activeResult,
                  quizData.characterDescriptions,
                  quizData.neitherDescription,
                )}
                &rdquo;
              </p>
            </div>
          </div>
        ) : (
          <div
            className="flex h-full w-full flex-col bg-[#0d111a] text-slate-400 items-center justify-center border-l border-white/10"
            style={{ borderRadius: "inherit" }}
          >
            <div className="opacity-30 text-center">
              <div className="text-4xl font-bold mb-2">Q{i + 1}</div>
              <div className="text-sm tracking-widest uppercase">
                Completed
              </div>
            </div>
          </div>
        ),
      });
    });

    // Final Page: Results Leaf
    allPages.push({
      id: "results",
      front: (
        <div
          className="flex h-full w-full flex-col bg-[#0d111a] text-white border-r border-white/10 overflow-hidden relative"
          style={{ borderRadius: "inherit" }}
        >
          {activeResult ? (
            <div
              className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col justify-between custom-scrollbar"
              style={{ scrollbarWidth: "thin" }}
            >
              <div>
                {/* Header for single-page/mobile views */}
                <div className="sm:hidden flex items-center gap-3 pb-3 mb-3 border-b border-white/10">
                  <span className="text-3xl">
                    {characterEmojis[activeResult.character] || "🎞️"}
                  </span>
                  <div>
                    <h3
                      className="text-lg font-bold leading-tight"
                      style={{
                        color:
                          characterColors[activeResult.character] ||
                          "#fff",
                      }}
                    >
                      {activeResult.character === "Neither"
                        ? "A little bit of everyone"
                        : activeResult.character}
                    </h3>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                      {characterArchetypes[activeResult.character]}
                    </span>
                  </div>
                </div>

                {/* Personality Profile Description */}
                <div className="mb-4">
                  <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <span>Personality Profile</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/10">
                    {getResultDescription(
                      activeResult,
                      quizData.characterDescriptions,
                      quizData.neitherDescription,
                    )}
                  </p>
                </div>

                {/* Your Mix breakdown */}
                <div className="mb-4">
                  <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Your Mix
                  </div>
                  <div className="space-y-2">
                    {sortedChars.map((char) => {
                      const isWinner = char === activeResult.character;
                      const pct = activeResult.percentages[char] || 0;
                      const color = characterColors[char] || "#888888";
                      return (
                        <div
                          key={char}
                          className="flex items-center gap-2 text-xs"
                        >
                          <span
                            className="w-24 truncate font-medium text-slate-300 flex items-center gap-1.5"
                            style={{
                              color: isWinner ? color : undefined,
                            }}
                          >
                            <span>{characterEmojis[char]}</span>
                            <span>{char}</span>
                          </span>
                          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: color,
                              }}
                            />
                          </div>
                          <span
                            className="w-8 text-right font-mono text-[11px] text-slate-400"
                            style={{
                              color: isWinner ? color : undefined,
                            }}
                          >
                            {pct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action buttons inside page */}
              <div className="pt-3 border-t border-white/10 flex flex-col gap-2 mt-auto">
                <button
                  type="button"
                  className={`quiz-retro-btn quiz-share-btn w-full py-2 text-xs font-bold justify-center flex items-center gap-1.5 ${
                    bookletCopied ? "quiz-share-btn--copied" : ""
                  }`}
                  onClick={handleBookletShare}
                  aria-label="Copy personality outcome summary to clipboard"
                >
                  <span aria-hidden="true">{bookletCopied ? "✓" : "📋"}</span>
                  <span>{bookletCopied ? "Summary Copied!" : "Share Summary"}</span>
                </button>
                <button
                  type="button"
                  className="quiz-retro-btn w-full py-2.5 text-xs font-bold justify-center"
                  onClick={() => onComplete(activeResult ?? quizResult ?? undefined)}
                  aria-label="Back to movie night"
                >
                  Back to movie night
                </button>
                <button
                  type="button"
                  className="quiz-retro-btn quiz-retro-btn--secondary w-full py-2 text-xs font-semibold justify-center"
                  onClick={handleRetake}
                  aria-label="Retake quiz"
                >
                  Retake quiz
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <p className="text-sm">
                Complete all questions to reveal your results here!
              </p>
            </div>
          )}
        </div>
      ),
      back: (
        <div
          className="flex h-full w-full flex-col bg-[#0d111a] text-slate-300 p-6 border-l border-white/10 items-center justify-center text-center"
          style={{ borderRadius: "inherit" }}
        >
          <div className="text-4xl mb-3 opacity-40">🎞️</div>
          <h4 className="text-base font-bold text-white mb-1">
            Movie Night Personality Quiz
          </h4>
          <p className="text-xs text-slate-400 mb-4">Booklet complete</p>
          <button
            type="button"
            className="quiz-retro-btn quiz-retro-btn--secondary text-xs px-3 py-1.5"
            onClick={handleRetake}
          >
            Retake quiz
          </button>
        </div>
      ),
    });

    return allPages;
  }, [
    questions,
    answers,
    renderQuestion,
    activeResult,
    quizData.characterDescriptions,
    quizData.neitherDescription,
    sortedChars,
    onComplete,
    handleRetake,
    quizResult,
    bookletCopied,
    handleBookletShare,
  ]);

  if (questions.length === 0) {
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
          </div>
        </div>
      </div>
    );
  }

  // Match the exact dimensions of the Movie Booklet
  const bookWidth = isMobile ? 280 : 380;
  const bookHeight = isMobile ? 420 : 560;

  const currentTurnedCount = !isQuizStarted
    ? 0
    : showResults
      ? totalQuestions + 1
      : currentQuestionIndex + 1;

  return (
    <div className="quiz-retro-wrapper">
      <div
        className="w-full flex-1 flex flex-col items-center justify-center mx-auto"
        style={{
          maxWidth: isMobile ? bookWidth : bookWidth * 2 + 100,
          minHeight: 0,
        }}
      >
        <div
          className="flex-1 flex items-center justify-center relative w-full my-2 sm:my-4"
          style={{ minHeight: 0 }}
        >
          <PageFlip
            pages={pages}
            pageWidth={bookWidth}
            pageHeight={bookHeight}
            spineShift={isMobile ? 85 : 130}
            pageRadius={isMobile ? 6 : 8}
            turnAngle={180}
            shadow={0.45}
            interactive={true}
            closeOnLeave={false}
            closeOnClickOutside={false}
            leafClickTurnsPage={false}
            turnedCount={currentTurnedCount}
            onPageChange={(c) => {
              if (c === 0) {
                setIsQuizStarted(false);
                setShowResults(false);
              } else if (c <= totalQuestions) {
                setIsQuizStarted(true);
                setShowResults(false);
                setCurrentQuestionIndex(Math.max(0, c - 1));
              } else {
                setIsQuizStarted(true);
                let res = quizResult ?? readSavedQuizOutcome(outcomeStorageKey);
                if (!res && answers.length > 0 && questions.length > 0) {
                  res = calculateQuizResults(answers, questions);
                }
                if (res) {
                  setQuizResult(res);
                  writeSavedQuizOutcome(outcomeStorageKey, res);
                }
                setShowResults(true);
              }
            }}
          />
        </div>

        {!isQuizStarted ? (
          <div className="flex justify-center mt-auto pb-2">
            <button
              className="quiz-retro-btn"
              onClick={() => setIsQuizStarted(true)}
              aria-label="Start Quiz"
            >
              Start Quiz
            </button>
          </div>
        ) : showResults ? (
          <div className="quiz-retro-nav-row mt-auto w-full pb-2">
            <button
              className="quiz-retro-btn quiz-retro-btn--secondary"
              onClick={handlePrevious}
              aria-label="Previous question"
            >
              ← Review questions
            </button>
            <div className="flex-1 mx-4 text-center">
              <span className="text-xs text-white/70 font-semibold tracking-wider uppercase">
                Personality Match
              </span>
            </div>
            <button
              className="quiz-retro-btn"
              onClick={() => onComplete(activeResult ?? quizResult ?? undefined)}
              aria-label="Back to movie night"
            >
              Back to movie night →
            </button>
          </div>
        ) : (
          <div className="quiz-retro-nav-row mt-auto w-full pb-2">
            <button
              className="quiz-retro-btn quiz-retro-btn--secondary"
              onClick={handlePrevious}
              aria-label={
                currentQuestionIndex === 0
                  ? "Back to cover"
                  : "Previous question"
              }
            >
              Back
            </button>
            <div className="flex-1 mx-4">
              <div
                className="quiz-retro-progress-track"
                style={{ height: 6, borderRadius: 3 }}
              >
                <div
                  className="quiz-retro-progress-fill"
                  style={{
                    transform: `scaleX(${progress / 100})`,
                    borderRadius: 3,
                  }}
                />
              </div>
              <div className="text-center mt-2 text-xs text-white/50 font-medium tracking-widest uppercase">
                {currentQuestionIndex + 1} of {totalQuestions}
              </div>
            </div>
            <button
              className="quiz-retro-btn"
              onClick={handleNext}
              disabled={!isAnswered}
              aria-label={
                currentQuestionIndex === totalQuestions - 1
                  ? "See my result"
                  : "Next question"
              }
            >
              {currentQuestionIndex === totalQuestions - 1
                ? "See my result"
                : "Next"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface ResultsScreenProps {
  result: QuizResult;
  onContinue: () => void;
  onRetake: () => void;
  characterDescriptions: Record<QuizCharacter, string>;
  neitherDescription: string;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  result,
  onContinue,
  onRetake,
  characterDescriptions,
  neitherDescription,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const resultRootRef = useRef<HTMLDivElement>(null);
  const characterColor = characterColors[result.character] || "#888888";
  const characterEmoji = characterEmojis[result.character] || "🎞️";
  const resultName =
    result.character === "Neither"
      ? "A little bit of everyone"
      : result.character;
  const archetype =
    characterArchetypes[result.character] ?? "Your movie-night match";
  const description = getResultDescription(
    result,
    characterDescriptions,
    neitherDescription,
  );

  const sortedChars = (Object.keys(result.percentages) as QuizCharacter[]).sort(
    (a, b) => result.percentages[b] - result.percentages[a],
  );

  const handleShare = useCallback(async () => {
    const summary = formatQuizOutcomeSummary({
      result,
      resultName,
      archetype,
      description,
      characterEmojis,
    });

    try {
      await copyTextToClipboard(summary);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch (err) {
      console.warn("Failed to copy quiz outcome summary to clipboard:", err);
    }
  }, [result, resultName, archetype, description]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      resultRootRef.current?.scrollIntoView({ block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      ref={resultRootRef}
      className="quiz-retro-wrapper quiz-retro-wrapper--results"
      style={{ "--quiz-result-color": characterColor } as React.CSSProperties}
    >
      <div className="quiz-flip-stage">
        <div
          className={`quiz-flip-card ${isFlipped ? "is-flipped" : ""}`}
          aria-live="polite"
        >
          {/* Front Face: Poster View */}
          <div className="quiz-flip-face quiz-flip-face--front quiz-poster-face">
            <div className="quiz-poster-glow" aria-hidden="true" />
            
            <div className="relative z-10 flex flex-col items-center w-full">
              <span className="quiz-poster-badge">
                <span aria-hidden="true">🎬</span> Movie-Night Match
              </span>

              <div className="quiz-poster-avatar-ring" aria-hidden="true">
                {characterEmoji}
              </div>

              <h2 className="quiz-poster-title">{resultName}</h2>
              <p className="quiz-poster-archetype">{archetype}</p>

              <div className="quiz-poster-quote">
                &ldquo;{description}&rdquo;
              </div>
            </div>

            <div className="relative z-10 w-full pt-4 flex flex-col items-center gap-3">
              <button
                type="button"
                className="quiz-poster-flip-trigger w-full sm:w-auto"
                onClick={() => setIsFlipped(true)}
                aria-label="Flip to view detailed breakdown"
              >
                <span>Flip to View Full Mix</span>
                <span className="quiz-poster-flip-icon" aria-hidden="true">⟳</span>
              </button>

              <div className="flex gap-2 w-full justify-center">
                <button
                  type="button"
                  className="quiz-retro-btn text-xs py-2 px-4"
                  onClick={onContinue}
                  aria-label="Return to the movie library"
                >
                  Back to movie night
                </button>
                <button
                  type="button"
                  className="quiz-retro-btn quiz-retro-btn--secondary text-xs py-2 px-4"
                  onClick={onRetake}
                  aria-label="Retake the quiz"
                >
                  Retake quiz
                </button>
              </div>
            </div>
          </div>

          {/* Back Face: Results Breakdown View */}
          <div className="quiz-flip-face quiz-flip-face--back p-6 flex flex-col justify-between">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* Header summary */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-3xl" aria-hidden="true">
                    {characterEmoji}
                  </span>
                  <div>
                    <h3
                      className="text-lg font-bold leading-tight"
                      style={{ color: characterColor }}
                    >
                      {resultName}
                    </h3>
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider">
                      {archetype}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className={`quiz-retro-btn text-xs px-2.5 py-1.5 flex items-center gap-1 transition-all ${
                      copied
                        ? "quiz-share-btn--copied bg-emerald-600/90 text-white"
                        : "quiz-retro-btn--secondary"
                    }`}
                    onClick={handleShare}
                    aria-label="Copy summary of your personality outcome to clipboard"
                    title="Copy personality outcome summary to clipboard"
                  >
                    <span aria-hidden="true">{copied ? "✓" : "📋"}</span>
                    <span>{copied ? "Copied!" : "Share"}</span>
                  </button>
                  <button
                    type="button"
                    className="quiz-retro-btn quiz-retro-btn--secondary text-xs px-2.5 py-1.5 flex items-center gap-1"
                    onClick={() => setIsFlipped(false)}
                    aria-label="Flip back to poster view"
                  >
                    <span aria-hidden="true">↺</span> Poster
                  </button>
                </div>
              </div>

              {/* Personality Profile */}
              <div className="mb-4">
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <span>Personality Profile</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/10">
                  {description}
                </p>
              </div>

              {/* Your Mix breakdown */}
              <div className="mb-4">
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Your Mix
                </div>
                <div className="space-y-2">
                  {sortedChars.map((char) => {
                    const isWinner = char === result.character;
                    const pct = result.percentages[char] || 0;
                    const color = characterColors[char] || "#888888";
                    return (
                      <div key={char} className="quiz-retro-results-bar-row">
                        <div
                          className="quiz-retro-results-bar-label"
                          style={{
                            fontWeight: isWinner ? 700 : 500,
                            color: isWinner ? color : undefined,
                          }}
                        >
                          {characterEmojis[char]} {char}
                        </div>
                        <div className="quiz-retro-results-bar-track">
                          <div
                            className="quiz-retro-results-bar-fill"
                            style={{
                              transform: `scaleX(${pct / 100})`,
                              background: color,
                            }}
                          />
                        </div>
                        <div
                          className="quiz-retro-results-bar-pct"
                          style={{
                            fontWeight: isWinner ? 700 : 500,
                            color: isWinner ? color : undefined,
                          }}
                        >
                          {pct}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-white/10 flex flex-col gap-2 mt-auto">
              <button
                type="button"
                className={`quiz-retro-btn quiz-share-btn w-full py-2.5 text-xs font-bold justify-center flex items-center gap-2 cursor-pointer ${
                  copied ? "quiz-share-btn--copied" : ""
                }`}
                onClick={handleShare}
                aria-label="Copy summary of your personality outcome to clipboard"
              >
                <span aria-hidden="true">{copied ? "✓" : "📋"}</span>
                <span>{copied ? "Summary Copied to Clipboard!" : "Share Outcome Summary"}</span>
              </button>
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <button
                  type="button"
                  className="quiz-retro-btn flex-1 py-2.5 text-xs font-bold justify-center"
                  onClick={onContinue}
                  aria-label="Return to the movie library"
                >
                  Back to movie night
                </button>
                <button
                  type="button"
                  className="quiz-retro-btn quiz-retro-btn--secondary flex-1 py-2.5 text-xs font-semibold justify-center"
                  onClick={onRetake}
                  aria-label="Retake the quiz"
                >
                  Retake quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const QuizGame = QuizExperience;
export default QuizExperience;
