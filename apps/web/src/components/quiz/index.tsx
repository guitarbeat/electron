
/* eslint-disable react-refresh/only-export-components */
/**
 * Quiz Type Definitions
 *
 * Type definitions for the personality quiz system
 */

export type QuizCharacter =
  | "Electra"
  | "Aaron"
  | "Madeleine"
  | "Nosferatu/Smeemo";

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
    | "stronglyDisagree"
    | "disagree"
    | "neutral"
    | "agree"
    | "stronglyAgree"; // For agree/disagree
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


import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import type { FC } from "react";
import type { User } from "@/shared/types";
import {
  normalizeQuizPercentages,
  readSavedQuizProgress,
  writeSavedQuizProgress,
  clearSavedQuizProgress,
  buildQuizProgressStorageKey,
  type SavedQuizProgress,
} from "@/shared/quizData";

export {
  readSavedQuizProgress,
  writeSavedQuizProgress,
  clearSavedQuizProgress,
  buildQuizProgressStorageKey,
  type SavedQuizProgress,
};
import { WorkspaceFeatureSectionLoading } from "@/components/ui";
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

export const BlinkText: React.FC<BlinkTextProps> = ({ children, style = {} }) => {
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
      | "stronglyDisagree"
      | "disagree"
      | "neutral"
      | "agree"
      | "stronglyAgree",
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
        <div className="quiz-retro-scale-options" role="group" aria-label="How much does this sound like you?">
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
  const [isDragging, setIsDragging] = useState(false);

  const calculatePosition = useCallback((clientX: number, clientY: number) => {
    if (!gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = 1 - ((clientY - rect.top) / rect.height) * 2;
    return {
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const pos = calculatePosition(e.clientX, e.clientY);
    if (pos) onSelect(pos);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const pos = calculatePosition(e.clientX, e.clientY);
    if (pos) onSelect(pos);
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
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

  const handleTouchEnd = () => setIsDragging(false);

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
                  transition: isDragging ? "none" : "all 0.15s ease-out",
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
            fontFamily: 'var(--font-body)',
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
                <p>The quiz editor is temporarily unavailable while styles are being updated.</p>
                <button 
                    className="ui-button ui-button--primary" 
                    onClick={onClose}
                >
                    <span className={"ui-button__content"}>Close Editor</span>
                </button>
            </div>
        </div>
    );
};




export interface QuizExperienceProps {
  currentUser: User | null;
  quizCompleted: boolean;
  onComplete: () => void;
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




interface QuizFlowProps {
  onComplete: () => void;
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
}

export const QUIZ_EMPTY_STATE_TEXT_STYLE = {
  fontFamily: 'var(--font-body)',
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
      ? Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)
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
            <p style={QUIZ_EMPTY_STATE_TEXT_STYLE}>Quiz complete</p>
            <button
              className="quiz-retro-btn"
              onClick={handleRetake}
              style={QUIZ_RETAKE_BUTTON_STYLE}
              aria-label="Retake Quiz"
            >
              Retake quiz
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
            question={currentQuestion as XYAxisQuestion}
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
      <div className="quiz-retro-main">
        <div className="quiz-retro-title-banner">
          <span className="quiz-retro-kicker">Movie-night personality</span>
          <h2>Which character are you?</h2>
          <p>Seven quick questions. Go with your first instinct.</p>
        </div>

        <div
          className="quiz-retro-progress-wrap"
          role="progressbar"
          aria-valuenow={currentQuestionIndex + 1}
          aria-valuemin={1}
          aria-valuemax={totalQuestions}
          aria-label={`Question ${currentQuestionIndex + 1} of ${totalQuestions}`}
        >
          <div className="quiz-retro-progress-label">
            <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
            <span>{progress}%</span>
          </div>
          <div className="quiz-retro-progress-track">
            <div
              className="quiz-retro-progress-fill"
              style={{ width: `${progress}%` }}
            />
            <div className="quiz-retro-progress-text">{progress}% COMPLETE</div>
          </div>
          <div className="quiz-retro-progress-sub">
            {currentQuestionIndex === totalQuestions - 1
              ? "Last one"
              : `${totalQuestions - currentQuestionIndex - 1} left after this`}
          </div>
        </div>

        <div
          key={currentQuestion.id}
          className="quiz-retro-question-card quiz-retro-question-stage"
        >
          {renderCurrentQuestion()}
        </div>

        <div className="quiz-retro-nav-row">
          <button
            className="quiz-retro-btn quiz-retro-btn--secondary"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            aria-label="Previous question"
          >
            Back
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
              ? "See my result"
              : "Next"}
          </button>
        </div>
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

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  result,
  onContinue,
  onRetake,
  characterDescriptions,
  neitherDescription,
}) => {
  const resultRootRef = useRef<HTMLDivElement>(null);
  const characterColor = characterColors[result.character] || "#888888";
  const characterEmoji = characterEmojis[result.character] || "🎞️";
  const resultName =
    result.character === "Neither" ? "A little bit of everyone" : result.character;
  const archetype = characterArchetypes[result.character] ?? "Your movie-night match";
  const description = getResultDescription(
    result,
    characterDescriptions,
    neitherDescription,
  );

  const sortedChars = (Object.keys(result.percentages) as QuizCharacter[]).sort(
    (a, b) => result.percentages[b] - result.percentages[a],
  );

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
      <div className="quiz-retro-main">
        <div className="quiz-retro-results-win">
          <span className="quiz-retro-results-star" aria-hidden="true">
            {characterEmoji}
          </span>
          <span className="quiz-retro-results-sub">Your movie-night match</span>
          <h2 className="quiz-retro-results-name">{resultName}</h2>
          <p className="quiz-retro-results-archetype">{archetype}</p>
        </div>

        <div className="quiz-retro-results-body">
          <div className="quiz-retro-results-description">
            <p className="quiz-retro-results-desc">{description}</p>
          </div>

          <div className="quiz-retro-results-breakdown">
            <div className="quiz-retro-results-breakdown-title">
              Your mix
            </div>
            {sortedChars.map((char) => {
              const isWinner = char === result.character;
              const pct = result.percentages[char];
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
                        width: `${pct}%`,
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

          <div className="quiz-retro-results-actions">
            <button
              className="quiz-retro-btn"
              onClick={onContinue}
              aria-label="Return to the movie library"
            >
              Back to movie night
            </button>
            <button
              className="quiz-retro-btn quiz-retro-btn--secondary"
              onClick={onRetake}
              aria-label="Retake the quiz"
            >
              Retake quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const QuizGame = QuizExperience;
export default QuizExperience;
