import type { QuizAnswer } from "./types";

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
