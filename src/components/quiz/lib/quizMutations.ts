import type { QuizData } from "@/services/state/stateTypes";
import type { QuizQuestion, QuizCharacter } from "./types";

export const addQuestionToData = (data: QuizData, question: QuizQuestion): QuizData => ({
  ...data,
  questions: [...data.questions, question],
});

export const updateQuestionInData = (
  data: QuizData,
  questionId: string,
  updatedQuestion: QuizQuestion,
): QuizData => ({
  ...data,
  questions: data.questions.map((q) =>
    q.id === questionId ? updatedQuestion : q,
  ),
});

export const deleteQuestionFromData = (data: QuizData, questionId: string): QuizData => ({
  ...data,
  questions: data.questions.filter((q) => q.id !== questionId),
});

export const updateCharacterDescriptionInData = (
  data: QuizData,
  character: QuizCharacter,
  description: string,
): QuizData => ({
  ...data,
  characterDescriptions: {
    ...data.characterDescriptions,
    [character]: description,
  },
});

export const updateNeitherDescriptionInData = (data: QuizData, description: string): QuizData => ({
  ...data,
  neitherDescription: description,
});
