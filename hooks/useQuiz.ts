/**
 * useQuiz Hook
 *
 * Provides quiz data with polling and mutation support
 */

import { useState, useCallback, useRef } from 'react';
import { usePolling } from '@/hooks/usePolling';
import { getQuizData, saveQuizData, QuizData } from '@/services/quizService';
import { QuizQuestion, QuizCharacter } from '@/quiz/types';

export const useQuiz = (isPaused: boolean = false) => {
  const {
    data: quizData,
    error,
    isLoading,
    refresh,
  } = usePolling(getQuizData, 5000, (prev, next) => JSON.stringify(prev) === JSON.stringify(next), {
    key: 'quiz',
    isPaused,
  });
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);

  const performMutation = useCallback(
    async (mutationFn: (data: QuizData) => QuizData) => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      setIsSaving(true);
      try {
        const latestData = await getQuizData();
        const updatedData = mutationFn(latestData);
        await saveQuizData(updatedData);
        refresh();
      } catch (err) {
        console.error('Quiz mutation failed:', err);
        throw err;
      } finally {
        isSavingRef.current = false;
        setIsSaving(false);
      }
    },
    [refresh]
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
      await performMutation(() => data);
    },
    [performMutation]
  );

  return {
    quizData,
    error,
    isLoading,
    isSaving,
    refresh,
    updateQuestions,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    updateCharacterDescription,
    updateNeitherDescription,
    saveAllData,
  };
};
