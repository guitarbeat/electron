/**
 * useQuiz Hook
 *
 * Provides quiz data with polling and mutation support
 */

import { useState, useCallback } from 'react';
import { usePolling } from '@/services/polling';
import { QuizQuestion, QuizCharacter } from '@/components/quiz/lib/types';
import { areDeeplyEqual, consoleError } from '@/utils';
import { mutateScope, readScope, retryScopeSync } from '@/services/state';
import type { QuizData } from '@/services/state/stateTypes';

const POLLING_INTERVAL = 30000;

export type { QuizData } from '@/services/state/stateTypes';

export const useQuiz = (isPaused: boolean = false) => {
  const readQuiz = useCallback(() => readScope('quiz'), []);
  const {
    data: snapshot,
    error,
    isLoading,
    refresh,
  } = usePolling(readQuiz, POLLING_INTERVAL, areDeeplyEqual, {
    key: 'quiz',
    isPaused,
  });
  const [isSaving, setIsSaving] = useState(false);

  const quizData = snapshot?.data;

  const performMutation = useCallback(
    async (mutationFn: (data: QuizData) => QuizData) => {
      if (!quizData) return;

      setIsSaving(true);
      try {
        const updatedData = mutationFn(quizData);
        await mutateScope('quiz', {
          op: 'replace_quiz',
          payload: { quizData: updatedData },
          optimisticData: updatedData,
        });
        refresh();
      } catch (err) {
        consoleError('Quiz mutation failed:', err);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [quizData, refresh]
  );

  const updateQuestions = useCallback(
    async (questions: QuizQuestion[]) => {
      await performMutation((data) => ({ ...data, questions }));
    },
    [performMutation]
  );

  const addQuestion = useCallback(
    async (question: QuizQuestion) => {
      await performMutation((data) => ({
        ...data,
        questions: [...data.questions, question],
      }));
    },
    [performMutation]
  );

  const updateQuestion = useCallback(
    async (questionId: string, updatedQuestion: QuizQuestion) => {
      await performMutation((data) => ({
        ...data,
        questions: data.questions.map((q) => (q.id === questionId ? updatedQuestion : q)),
      }));
    },
    [performMutation]
  );

  const deleteQuestion = useCallback(
    async (questionId: string) => {
      await performMutation((data) => ({
        ...data,
        questions: data.questions.filter((q) => q.id !== questionId),
      }));
    },
    [performMutation]
  );

  const updateCharacterDescription = useCallback(
    async (character: QuizCharacter, description: string) => {
      await performMutation((data) => ({
        ...data,
        characterDescriptions: { ...data.characterDescriptions, [character]: description },
      }));
    },
    [performMutation]
  );

  const updateNeitherDescription = useCallback(
    async (description: string) => {
      await performMutation((data) => ({
        ...data,
        neitherDescription: description,
      }));
    },
    [performMutation]
  );

  const saveAllData = useCallback(
    async (data: QuizData) => {
      if (!data) return;

      setIsSaving(true);
      try {
        await mutateScope('quiz', {
          op: 'replace_quiz',
          payload: { quizData: data },
          optimisticData: data,
        });
        refresh();
      } finally {
        setIsSaving(false);
      }
    },
    [refresh]
  );

  const retrySync = useCallback(async () => {
    await retryScopeSync('quiz');
    refresh();
  }, [refresh]);

  return {
    quizData,
    error,
    isLoading,
    isSaving,
    isDegraded: snapshot?.degraded ?? false,
    isSyncBlocked: snapshot?.blocked ?? false,
    syncWarning: snapshot?.warning,
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
