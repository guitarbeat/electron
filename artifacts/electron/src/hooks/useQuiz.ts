/**
 * useQuiz Hook
 *
 * Provides quiz data with polling and mutation support
 */

import { useCallback } from "react";
import { QuizQuestion, QuizCharacter } from "@/components/quiz/lib/types";
import { consoleError } from "@/utils";
import type { QuizData } from "@/services/state/stateTypes";
import { useSyncedScope } from "./useSyncedScope";

const POLLING_INTERVAL = 30000;

export type { QuizData } from "@/services/state/stateTypes";

export const useQuiz = (isPaused: boolean = false) => {
  const {
    data: quizData,
    error,
    isLoading,
    isMutating: isSaving,
    isDegraded,
    isSyncBlocked,
    syncWarning,
    refresh,
    retrySync,
    mutate,
  } = useSyncedScope("quiz", {
    pollingInterval: POLLING_INTERVAL,
    isPaused,
  });

  const performMutation = useCallback(
    async (mutationFn: (data: QuizData) => QuizData) => {
      if (!quizData) return;

      try {
        const updatedData = mutationFn(quizData);
        await mutate({
          op: "replace_quiz",
          payload: { quizData: updatedData },
          optimisticData: updatedData,
        });
        void refresh();
      } catch (err) {
        consoleError("Quiz mutation failed:", err);
        throw err;
      }
    },
    [mutate, quizData, refresh],
  );

  const updateQuestions = useCallback(
    async (questions: QuizQuestion[]) => {
      await performMutation((data) => ({ ...data, questions }));
    },
    [performMutation],
  );

  const addQuestion = useCallback(
    async (question: QuizQuestion) => {
      await performMutation((data) => ({
        ...data,
        questions: [...data.questions, question],
      }));
    },
    [performMutation],
  );

  const updateQuestion = useCallback(
    async (questionId: string, updatedQuestion: QuizQuestion) => {
      await performMutation((data) => ({
        ...data,
        questions: data.questions.map((q) =>
          q.id === questionId ? updatedQuestion : q,
        ),
      }));
    },
    [performMutation],
  );

  const deleteQuestion = useCallback(
    async (questionId: string) => {
      await performMutation((data) => ({
        ...data,
        questions: data.questions.filter((q) => q.id !== questionId),
      }));
    },
    [performMutation],
  );

  const updateCharacterDescription = useCallback(
    async (character: QuizCharacter, description: string) => {
      await performMutation((data) => ({
        ...data,
        characterDescriptions: {
          ...data.characterDescriptions,
          [character]: description,
        },
      }));
    },
    [performMutation],
  );

  const updateNeitherDescription = useCallback(
    async (description: string) => {
      await performMutation((data) => ({
        ...data,
        neitherDescription: description,
      }));
    },
    [performMutation],
  );

  const saveAllData = useCallback(
    async (data: QuizData) => {
      if (!data) return;

      await mutate({
        op: "replace_quiz",
        payload: { quizData: data },
        optimisticData: data,
      });
      void refresh();
    },
    [mutate, refresh],
  );

  return {
    quizData,
    error,
    isLoading,
    isSaving,
    isDegraded,
    isSyncBlocked,
    syncWarning,
    refresh,
    retrySync,
    updateQuestions,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    updateCharacterDescription,
    updateNeitherDescription,
    saveAllData,
  };
};
