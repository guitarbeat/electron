import type { User, QuizResult } from "@/shared/types";

const QUIZ_COMPLETION_STORAGE_KEY = "quiz-completed-by-user";
const QUIZ_OUTCOME_USER_STORAGE_KEY = "quiz-outcome-by-user";

const getQuizCompletionKey = (user: User | null) => user ?? "guest";

export const readQuizCompletionState = (user: User | null): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const raw = window.localStorage.getItem(QUIZ_COMPLETION_STORAGE_KEY);
    if (!raw) {
      return false;
    }

    const parsed = JSON.parse(raw) as Partial<Record<string, boolean>>;
    return parsed[getQuizCompletionKey(user)] === true;
  } catch {
    window.localStorage.removeItem(QUIZ_COMPLETION_STORAGE_KEY);
    return false;
  }
};

export const writeQuizCompletionState = (
  user: User | null,
  completed: boolean,
) => {
  if (typeof window === "undefined") {
    return;
  }

  let nextState: Record<string, boolean> = {};

  try {
    const raw = window.localStorage.getItem(QUIZ_COMPLETION_STORAGE_KEY);
    if (raw) {
      nextState = JSON.parse(raw) as Record<string, boolean>;
    }
  } catch {
    nextState = {};
  }

  nextState[getQuizCompletionKey(user)] = completed;
  window.localStorage.setItem(
    QUIZ_COMPLETION_STORAGE_KEY,
    JSON.stringify(nextState),
  );
};

export const readUserQuizOutcome = (user: User | null): QuizResult | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(QUIZ_OUTCOME_USER_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<Record<string, QuizResult>>;
    const outcome = parsed[getQuizCompletionKey(user)];
    if (
      outcome &&
      typeof outcome.character === "string" &&
      typeof outcome.scores === "object" &&
      typeof outcome.percentages === "object"
    ) {
      return outcome;
    }
    return null;
  } catch {
    window.localStorage.removeItem(QUIZ_OUTCOME_USER_STORAGE_KEY);
    return null;
  }
};

export const writeUserQuizOutcome = (
  user: User | null,
  outcome: QuizResult | null,
) => {
  if (typeof window === "undefined") {
    return;
  }

  let nextState: Record<string, QuizResult | null> = {};

  try {
    const raw = window.localStorage.getItem(QUIZ_OUTCOME_USER_STORAGE_KEY);
    if (raw) {
      nextState = JSON.parse(raw) as Record<string, QuizResult | null>;
    }
  } catch {
    nextState = {};
  }

  if (outcome) {
    nextState[getQuizCompletionKey(user)] = outcome;
  } else {
    delete nextState[getQuizCompletionKey(user)];
  }

  window.localStorage.setItem(
    QUIZ_OUTCOME_USER_STORAGE_KEY,
    JSON.stringify(nextState),
  );
};

