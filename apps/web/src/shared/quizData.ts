export type QuizCharacter =
  "Electra" | "Aaron" | "Madeleine" | "Nosferatu/Smeemo";

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
    "stronglyDisagree" | "disagree" | "neutral" | "agree" | "stronglyAgree";
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
  {
    id: "movie-night-indecision",
    type: "multiple-choice",
    question:
      "The group has been scrolling for twenty minutes. What do you do?",
    options: [
      {
        text: "Shortlist three great options and make the case for each",
        scores: { Aaron: 2, Electra: 0, Madeleine: 1, "Nosferatu/Smeemo": 0 },
      },
      {
        text: "Ask what everyone is in the mood for and find the overlap",
        scores: { Aaron: 0, Electra: 2, Madeleine: 0, "Nosferatu/Smeemo": 1 },
      },
      {
        text: "Take the remote and confidently pick the winner",
        scores: { Aaron: 0, Electra: 1, Madeleine: 2, "Nosferatu/Smeemo": 0 },
      },
      {
        text: "Choose the strangest title on screen and embrace the risk",
        scores: { Aaron: 1, Electra: 0, Madeleine: 0, "Nosferatu/Smeemo": 2 },
      },
    ],
  },
  {
    id: "movie-night-vibe",
    type: "multiple-choice",
    question: "Pick the energy you want from tonight's movie.",
    options: [
      {
        text: "Quiet, beautifully made, and worth thinking about",
        scores: { Aaron: 2, Electra: 0, Madeleine: 0, "Nosferatu/Smeemo": 1 },
      },
      {
        text: "Warm, funny, and easy to enjoy together",
        scores: { Aaron: 0, Electra: 2, Madeleine: 1, "Nosferatu/Smeemo": 0 },
      },
      {
        text: "Big emotions, sharp outfits, and unforgettable drama",
        scores: { Aaron: 0, Electra: 1, Madeleine: 2, "Nosferatu/Smeemo": 0 },
      },
      {
        text: "Something uncanny that might permanently alter the group chat",
        scores: { Aaron: 1, Electra: 0, Madeleine: 0, "Nosferatu/Smeemo": 2 },
      },
    ],
  },
  {
    id: "movie-night-host",
    type: "multiple-choice",
    question:
      "When you host movie night, what are you secretly responsible for?",
    options: [
      {
        text: "The thoughtful lineup and the room being exactly right",
        scores: { Aaron: 2, Electra: 0, Madeleine: 1, "Nosferatu/Smeemo": 0 },
      },
      {
        text: "Making sure everyone has snacks and feels included",
        scores: { Aaron: 0, Electra: 2, Madeleine: 0, "Nosferatu/Smeemo": 1 },
      },
      {
        text: "Turning an ordinary watch into a full event",
        scores: { Aaron: 0, Electra: 1, Madeleine: 2, "Nosferatu/Smeemo": 0 },
      },
      {
        text: "Producing one deeply questionable surprise snack",
        scores: { Aaron: 1, Electra: 0, Madeleine: 0, "Nosferatu/Smeemo": 2 },
      },
    ],
  },
  {
    id: "movie-night-wildcard",
    type: "multiple-choice",
    question: "The movie is objectively strange. What's your reaction?",
    options: [
      {
        text: "Start quietly assembling a theory that explains everything",
        scores: { Aaron: 2, Electra: 0, Madeleine: 0, "Nosferatu/Smeemo": 1 },
      },
      {
        text: "Check whether everyone else is having as much fun as you are",
        scores: { Aaron: 0, Electra: 2, Madeleine: 1, "Nosferatu/Smeemo": 0 },
      },
      {
        text: "Commit fully and declare it an instant classic",
        scores: { Aaron: 0, Electra: 1, Madeleine: 2, "Nosferatu/Smeemo": 0 },
      },
      {
        text: "Feel vindicated—this is exactly why you chose it",
        scores: { Aaron: 1, Electra: 0, Madeleine: 0, "Nosferatu/Smeemo": 2 },
      },
    ],
  },
  {
    id: "movie-night-rewatch",
    type: "agree-disagree",
    question: "A perfect comfort rewatch can beat a promising new release.",
    scores: {
      stronglyDisagree: {
        Aaron: 0,
        Electra: 0,
        Madeleine: 2,
        "Nosferatu/Smeemo": 1,
      },
      disagree: { Aaron: 0, Electra: 1, Madeleine: 2, "Nosferatu/Smeemo": 0 },
      neutral: { Aaron: 1, Electra: 1, Madeleine: 1, "Nosferatu/Smeemo": 1 },
      agree: { Aaron: 2, Electra: 1, Madeleine: 0, "Nosferatu/Smeemo": 0 },
      stronglyAgree: {
        Aaron: 2,
        Electra: 0,
        Madeleine: 0,
        "Nosferatu/Smeemo": 1,
      },
    },
  },
  {
    id: "movie-night-debrief",
    type: "agree-disagree",
    question: "The conversation after the credits is part of the movie night.",
    scores: {
      stronglyDisagree: {
        Aaron: 0,
        Electra: 0,
        Madeleine: 1,
        "Nosferatu/Smeemo": 2,
      },
      disagree: { Aaron: 0, Electra: 1, Madeleine: 0, "Nosferatu/Smeemo": 2 },
      neutral: { Aaron: 1, Electra: 1, Madeleine: 1, "Nosferatu/Smeemo": 1 },
      agree: { Aaron: 1, Electra: 2, Madeleine: 1, "Nosferatu/Smeemo": 0 },
      stronglyAgree: {
        Aaron: 2,
        Electra: 2,
        Madeleine: 0,
        "Nosferatu/Smeemo": 0,
      },
    },
  },
  {
    id: "movie-night-outing",
    type: "image-choice",
    question: "Choose the place that should come before or after the movie.",
    options: [
      {
        imageUrl: "/quiz-photos/quiz-img-6.png",
        alt: "A quiet mountain retreat for a thoughtful escape",
        scores: { Aaron: 2, Electra: 0, Madeleine: 0, "Nosferatu/Smeemo": 1 },
      },
      {
        imageUrl: "/quiz-photos/quiz-img-5.png",
        alt: "A lively beach gathering with friends",
        scores: { Aaron: 0, Electra: 2, Madeleine: 1, "Nosferatu/Smeemo": 0 },
      },
      {
        imageUrl: "/quiz-photos/quiz-img-7.png",
        alt: "A bright city night with somewhere glamorous to go",
        scores: { Aaron: 0, Electra: 1, Madeleine: 2, "Nosferatu/Smeemo": 0 },
      },
      {
        imageUrl: "/quiz-photos/quiz-img-8.png",
        alt: "A remote cabin that feels a little mysterious",
        scores: { Aaron: 1, Electra: 0, Madeleine: 0, "Nosferatu/Smeemo": 2 },
      },
    ],
  },
];

const LEGACY_DEFAULT_QUIZ_IDS = [
  "mc1",
  "mc2",
  "mc3",
  "ad1",
  "ad2",
  "ad3",
  "img1",
  "img2",
  "img3",
] as const;

export const isLegacyDefaultQuizQuestions = (
  questions: readonly unknown[],
): boolean =>
  questions.length === LEGACY_DEFAULT_QUIZ_IDS.length &&
  LEGACY_DEFAULT_QUIZ_IDS.every((id, index) => {
    const question = questions[index];
    return (
      question !== null &&
      typeof question === "object" &&
      "id" in question &&
      question.id === id
    );
  });

export const characterDescriptions: Record<QuizCharacter, string> = {
  Electra:
    "You are the connective tissue of movie night. You notice the room, keep everyone included, and know that the best pick is the one people will still be talking about together tomorrow.",
  Aaron:
    "You are the thoughtful curator. You remember the overlooked recommendation, care about the details, and would rather choose one genuinely good film than scroll through fifty almost-right ones.",
  Madeleine:
    "You turn watching a movie into an occasion. Your picks have confidence, your reactions have range, and nobody leaves without feeling like the night had a proper main event.",
  "Nosferatu/Smeemo":
    "You are the fearless wildcard. You follow the odd title, defend the misunderstood masterpiece, and make sure movie night never becomes predictable—even when the group has questions afterward.",
};

export const neitherDescription =
  "You are the perfect blend: part curator, part host, part scene-stealer, and part wildcard. Your ideal movie night changes with the people, the place, and whatever story the evening needs.";

export const normalizeQuizPercentages = (
  scores: CharacterScores,
): Record<QuizCharacter, number> => {
  const totalScore = Object.values(scores).reduce(
    (sum, score) => sum + score,
    0,
  );

  if (totalScore <= 0) {
    return CHARACTERS.reduce(
      (percentages, character) => {
        percentages[character] = 0;
        return percentages;
      },
      {} as Record<QuizCharacter, number>,
    );
  }

  const rankedRemainders = CHARACTERS.map((character, index) => {
    const exact = (scores[character] / totalScore) * 100;
    return { character, index, floor: Math.floor(exact), remainder: exact % 1 };
  });
  const pointsToDistribute =
    100 - rankedRemainders.reduce((sum, item) => sum + item.floor, 0);

  rankedRemainders.sort(
    (a, b) => b.remainder - a.remainder || a.index - b.index,
  );

  const bonusCharacters = new Set(
    rankedRemainders.slice(0, pointsToDistribute).map((item) => item.character),
  );

  return CHARACTERS.reduce(
    (percentages, character) => {
      const item = rankedRemainders.find(
        (candidate) => candidate.character === character,
      );
      percentages[character] =
        (item?.floor ?? 0) + (bonusCharacters.has(character) ? 1 : 0);
      return percentages;
    },
    {} as Record<QuizCharacter, number>,
  );
};

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

  const percentages = normalizeQuizPercentages(scores);

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

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(storageKey);
  } catch {
    // Ignore localStorage read errors
  }

  if (!raw) {
    try {
      raw = window.sessionStorage.getItem(storageKey);
    } catch {
      // Ignore sessionStorage read errors
    }
  }

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SavedQuizProgress>;
    if (
      parsed.questionSignature !== questionSignature ||
      typeof parsed.currentQuestionIndex !== "number" ||
      !Array.isArray(parsed.answers)
    ) {
      clearSavedQuizProgress(storageKey);
      return null;
    }

    return {
      questionSignature,
      currentQuestionIndex: parsed.currentQuestionIndex,
      answers: parsed.answers,
    };
  } catch {
    clearSavedQuizProgress(storageKey);
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

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(progress));
  } catch (err) {
    console.warn("Failed to save quiz progress to localStorage:", err);
  }

  try {
    window.sessionStorage.removeItem(storageKey);
  } catch {
    // Ignore sessionStorage cleanup errors
  }
};

export const clearSavedQuizProgress = (storageKey: string) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    // Ignore localStorage cleanup errors
  }

  try {
    window.sessionStorage.removeItem(storageKey);
  } catch {
    // Ignore sessionStorage cleanup errors
  }
};
