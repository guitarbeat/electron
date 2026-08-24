export type QuizCharacter =
  | "Electra"
  | "Aaron"
  | "Madeleine"
  | "Nosferatu/Smeemo";

export const CHARACTERS: QuizCharacter[] = [
  "Aaron",
  "Electra",
  "Madeleine",
  "Nosferatu/Smeemo",
];

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
  answerIndex?: number;
  scaleValue?:
    | "stronglyDisagree"
    | "disagree"
    | "neutral"
    | "agree"
    | "stronglyAgree";
  xyPosition?: { x: number; y: number };
}

// Character scores
export type CharacterScores = Record<QuizCharacter, number>;

// Quiz result
export interface QuizResult {
  character: QuizCharacter | "Neither";
  scores: CharacterScores;
  percentages: Record<QuizCharacter, number>;
}

export const quizQuestions: QuizQuestion[] = [
  // Multiple Choice Questions (3)
  {
    id: "mc1",
    type: "multiple-choice",
    question: "What's your ideal Friday night?",
    options: [
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
        "Nosferatu/Smeemo": 0,
      },
      disagree: { Aaron: 1, Electra: 0, Madeleine: 0, "Nosferatu/Smeemo": 0 },
      neutral: { Aaron: 0, Electra: 1, Madeleine: 0, "Nosferatu/Smeemo": 0 },
      agree: { Aaron: 0, Electra: 0, Madeleine: 1, "Nosferatu/Smeemo": 0 },
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
    question: "Pick your aesthetic:",
    options: [
      {
        imageUrl: "/quiz-photos/quiz-img-1.png",
        alt: "Cozy cabin in the woods",
        scores: { Aaron: 2, Electra: 0, Madeleine: 0, "Nosferatu/Smeemo": 0 },
      },
      {
        imageUrl: "/quiz-photos/quiz-img-2.png",
        alt: "Neon cyber city",
        scores: { Aaron: 0, Electra: 2, Madeleine: 0, "Nosferatu/Smeemo": 0 },
      },
      {
        imageUrl: "/quiz-photos/quiz-img-3.png",
        alt: "Opulent golden palace",
        scores: { Aaron: 0, Electra: 0, Madeleine: 2, "Nosferatu/Smeemo": 0 },
      },
      {
        imageUrl: "/quiz-photos/quiz-img-4.png",
        alt: "Gothic shadow realm",
        scores: { Aaron: 0, Electra: 0, Madeleine: 0, "Nosferatu/Smeemo": 2 },
      },
    ],
  },
  {
    id: "img2",
    type: "image-choice",
    question: "Choose your ideal getaway:",
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
  const scores: CharacterScores = CHARACTERS.reduce((acc, char) => {
    acc[char] = 0;
    return acc;
  }, {} as CharacterScores);

  answers.forEach((answer) => {
    const question = questions.find((q) => q.id === answer.questionId);
    if (!question) return;

    if (
      question.type === "multiple-choice" &&
      answer.answerIndex !== undefined
    ) {
      const option = question.options[answer.answerIndex];
      if (option) {
        Object.entries(option.scores).forEach(([char, score]) => {
          scores[char as QuizCharacter] += (score as number) || 0;
        });
      }
    } else if (question.type === "agree-disagree" && answer.scaleValue) {
      const scaleScores = question.scores[answer.scaleValue];
      if (scaleScores) {
        Object.entries(scaleScores).forEach(([char, score]) => {
          scores[char as QuizCharacter] += (score as number) || 0;
        });
      }
    } else if (
      question.type === "image-choice" &&
      answer.answerIndex !== undefined
    ) {
      const option = question.options[answer.answerIndex];
      if (option) {
        Object.entries(option.scores).forEach(([char, score]) => {
          scores[char as QuizCharacter] += (score as number) || 0;
        });
      }
    } else if (question.type === "xy-axis" && answer.xyPosition) {
      const { x, y } = answer.xyPosition;
      const { quadrantScores } = question;

      const tlWeight = Math.max(0, -x) * Math.max(0, y);
      const trWeight = Math.max(0, x) * Math.max(0, y);
      const blWeight = Math.max(0, -x) * Math.max(0, -y);
      const brWeight = Math.max(0, x) * Math.max(0, -y);

      const totalWeight = tlWeight + trWeight + blWeight + brWeight || 1;

      const applyQuadrant = (
        qScores: Partial<Record<QuizCharacter, number>> | undefined,
        weight: number,
      ) => {
        if (!qScores) return;
        Object.entries(qScores).forEach(([char, score]) => {
          scores[char as QuizCharacter] +=
            ((score as number) * weight) / totalWeight;
        });
      };

      applyQuadrant(quadrantScores?.topLeft, tlWeight);
      applyQuadrant(quadrantScores?.topRight, trWeight);
      applyQuadrant(quadrantScores?.bottomLeft, blWeight);
      applyQuadrant(quadrantScores?.bottomRight, brWeight);
    }
  });

  const sortedCharacters = (Object.keys(scores) as QuizCharacter[]).sort(
    (a, b) => scores[b] - scores[a],
  );
  const [topCharacter] = sortedCharacters;

  const totalScore = Object.values(scores).reduce(
    (sum, score) => sum + score,
    0,
  );

  const percentages: Record<QuizCharacter, number> = CHARACTERS.reduce(
    (acc, char) => {
      acc[char] = totalScore > 0 ? Math.round((scores[char] / totalScore) * 100) : 0;
      return acc;
    },
    {} as Record<QuizCharacter, number>,
  );

  const topScore = scores[topCharacter] || 0;
  const isNeither =
    totalScore === 0 || (totalScore > 0 && topScore / totalScore < 0.35);

  return {
    character: isNeither ? "Neither" : topCharacter,
    scores,
    percentages,
  };
};

const QUIZ_PROGRESS_STORAGE_KEY = "quiz-flow-progress";

export interface SavedQuizProgress {
  questionSignature: string;
  currentQuestionIndex: number;
  answers: QuizAnswer[];
}

export const buildQuizProgressStorageKey = (sessionKey: string) =>
  `${QUIZ_PROGRESS_STORAGE_KEY}:${sessionKey}`;

export const readSavedQuizProgress = (
  storageKey: string,
  questionSignature: string,
): SavedQuizProgress | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<SavedQuizProgress>;
    if (
      parsed.questionSignature !== questionSignature ||
      typeof parsed.currentQuestionIndex !== "number" ||
      !Array.isArray(parsed.answers)
    ) {
      window.sessionStorage.removeItem(storageKey);
      return null;
    }

    return {
      questionSignature,
      currentQuestionIndex: parsed.currentQuestionIndex,
      answers: parsed.answers,
    };
  } catch {
    window.sessionStorage.removeItem(storageKey);
    return null;
  }
};

export const writeSavedQuizProgress = (
  storageKey: string,
  progress: SavedQuizProgress,
) => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(storageKey, JSON.stringify(progress));
};

export const clearSavedQuizProgress = (storageKey: string) => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(storageKey);
};
