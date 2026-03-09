/**
 * useQuiz Hook
 *
 * Provides quiz data with polling and mutation support
 */

import { useState, useCallback, useRef } from 'react';
import { usePolling } from './usePolling';
import { QuizQuestion, QuizCharacter } from '@/components/quiz/types';
import {
  fetchGist,
  getGistFileContent,
  GIST_QUIZ_FILENAME,
  GIST_TOKEN,
  patchGistFile,
} from '@/services/gistClient.ts';
import {
  quizQuestions as defaultQuestions,
  characterDescriptions as defaultDescriptions,
  neitherDescription as defaultNeither,
} from '@/components/quiz/data';

export interface QuizData {
  questions: QuizQuestion[];
  characterDescriptions: Record<QuizCharacter, string>;
  neitherDescription: string;
}

const defaultQuizData: QuizData = {
  questions: defaultQuestions,
  characterDescriptions: defaultDescriptions,
  neitherDescription: defaultNeither,
};

const getQuizData = async (token: string = GIST_TOKEN): Promise<QuizData> => {
  try {
    const isDefaultToken = !token || token === 'YOUR_GITHUB_TOKEN';

    if (isDefaultToken) {
      return defaultQuizData;
    }

    const response = await fetchGist({ token, cache: 'no-cache' });

    if (response.status === 401 || response.status === 404) {
      return defaultQuizData;
    }

    if (!response.ok) {
      throw new Error(`GitHub API responded with ${response.status}`);
    }

    const gist = await response.json();
    const content = getGistFileContent(gist, GIST_QUIZ_FILENAME);
    if (content === null) {
      return defaultQuizData;
    }

    const parsedData = JSON.parse(content);
    if (!parsedData || !Array.isArray(parsedData.questions)) {
      return defaultQuizData;
    }

    return {
      questions: parsedData.questions.length > 0 ? parsedData.questions : defaultQuestions,
      characterDescriptions: parsedData.characterDescriptions || defaultDescriptions,
      neitherDescription: parsedData.neitherDescription || defaultNeither,
    };
  } catch (error) {
    console.error('Error fetching quiz data from Gist:', error);
    return defaultQuizData;
  }
};

const saveQuizData = async (data: QuizData): Promise<void> => {
  try {
    const response = await patchGistFile(
      GIST_QUIZ_FILENAME,
      JSON.stringify(data, null, 2),
      GIST_TOKEN
    );

    if (!response.ok) {
      const errorBody = await response.json();
      console.error('GitHub API error details:', errorBody);
      throw new Error(`GitHub API responded with ${response.status}`);
    }
  } catch (error) {
    console.error('Error saving quiz data to Gist:', error);
    throw error;
  }
};

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
