import type { User } from "@/shared/types";

const QUIZ_COMPLETION_STORAGE_KEY = "quiz-completed-by-user";

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
