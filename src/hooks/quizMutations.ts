import type { QuizQuestion, QuizCharacter } from "@/components/quiz/lib/types";
import type { QuizData } from "@/services/state/stateTypes";

export const quizMutations = {
  updateQuestions: (questions: QuizQuestion[]) => (data: QuizData): QuizData => ({
    ...data,
    questions,
  }),

  addQuestion: (question: QuizQuestion) => (data: QuizData): QuizData => ({
    ...data,
    questions: [...data.questions, question],
  }),

  updateQuestion: (questionId: string, updatedQuestion: QuizQuestion) => (data: QuizData): QuizData => ({
    ...data,
    questions: data.questions.map((q) =>
      q.id === questionId ? updatedQuestion : q
    ),
  }),

  deleteQuestion: (questionId: string) => (data: QuizData): QuizData => ({
    ...data,
    questions: data.questions.filter((q) => q.id !== questionId),
  }),

  updateCharacterDescription: (character: QuizCharacter, description: string) => (data: QuizData): QuizData => ({
    ...data,
    characterDescriptions: {
      ...data.characterDescriptions,
      [character]: description,
    },
  }),

  updateNeitherDescription: (description: string) => (data: QuizData): QuizData => ({
    ...data,
    neitherDescription: description,
  }),
};
