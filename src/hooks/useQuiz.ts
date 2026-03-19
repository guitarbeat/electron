/**
 * useQuiz Hook
 *
 * Provides quiz data with polling and mutation support
 */

import { useState, useCallback, useRef } from 'react';
import { usePolling } from '@/services/polling';
import { QuizQuestion, QuizCharacter } from '@/components/quiz/types';
import { areDeeplyEqual, parseJsonContent } from '@/utils';
import {
  GIST_QUIZ_FILENAME,
  readGistJsonFile,
  readStoredJson,
  saveGistJson,
  setLocalOverride,
  writeStoredJson,
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

const QUIZ_LOCAL_STORAGE_KEY = 'movieList.localQuizData';

const cloneQuizData = (data: QuizData): QuizData => JSON.parse(JSON.stringify(data)) as QuizData;

const normalizeQuizData = (value: unknown): QuizData | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<QuizData> & {
    characterDescriptions?: Partial<Record<QuizCharacter, unknown>>;
    neitherDescription?: unknown;
  };

  if (!Array.isArray(candidate.questions)) {
    return null;
  }

  const characterDescriptions = {
    Aaron:
      typeof candidate.characterDescriptions?.Aaron === 'string'
        ? candidate.characterDescriptions.Aaron
        : defaultDescriptions.Aaron,
    Electra:
      typeof candidate.characterDescriptions?.Electra === 'string'
        ? candidate.characterDescriptions.Electra
        : defaultDescriptions.Electra,
    Madeleine:
      typeof candidate.characterDescriptions?.Madeleine === 'string'
        ? candidate.characterDescriptions.Madeleine
        : defaultDescriptions.Madeleine,
    'Nosferatu/Smeemo':
      typeof candidate.characterDescriptions?.['Nosferatu/Smeemo'] === 'string'
        ? candidate.characterDescriptions['Nosferatu/Smeemo']
        : defaultDescriptions['Nosferatu/Smeemo'],
  } satisfies Record<QuizCharacter, string>;
  const questions =
    candidate.questions.length > 0 ? (candidate.questions as QuizQuestion[]) : defaultQuestions;

  return {
    questions,
    characterDescriptions,
    neitherDescription:
      typeof candidate.neitherDescription === 'string'
        ? candidate.neitherDescription
        : defaultNeither,
  };
};

const readStoredLocalQuizData = (): QuizData | null =>
  readStoredJson({
    storageKey: QUIZ_LOCAL_STORAGE_KEY,
    validate: (value): value is QuizData => normalizeQuizData(value) !== null,
    clone: (value) => normalizeQuizData(value) ?? cloneQuizData(defaultQuizData),
    label: 'local quiz fallback',
  });

const getFallbackQuizData = (): QuizData =>
  readStoredLocalQuizData() ?? cloneQuizData(defaultQuizData);

const saveLocalQuizData = (data: QuizData): void => {
  writeStoredJson({
    storageKey: QUIZ_LOCAL_STORAGE_KEY,
    value: data,
    clone: cloneQuizData,
    label: 'local quiz fallback',
  });
  setLocalOverride('quiz', true);
};

const getQuizData = async (): Promise<QuizData> => {
  try {
    return await readGistJsonFile({
      scope: 'quiz',
      filename: GIST_QUIZ_FILENAME,
      fallback: getFallbackQuizData,
      onMissingFileWhenWritable: () => cloneQuizData(defaultQuizData),
      parse: (content) =>
        normalizeQuizData(parseJsonContent(content, GIST_QUIZ_FILENAME)) ??
        cloneQuizData(defaultQuizData),
    });
  } catch (error) {
    console.error('Error fetching quiz data from Gist:', error);
    return getFallbackQuizData();
  }
};

const saveQuizData = (data: QuizData): Promise<void> =>
  saveGistJson(GIST_QUIZ_FILENAME, 'quiz', data, saveLocalQuizData);

export const useQuiz = (isPaused: boolean = false) => {
  const {
    data: quizData,
    error,
    isLoading,
    refresh,
  } = usePolling(getQuizData, 5000, areDeeplyEqual, {
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
