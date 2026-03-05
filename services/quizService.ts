/**
 * Quiz Service
 *
 * Handles fetching and saving quiz data from/to GitHub Gist
 */

import { GIST_TOKEN, GIST_QUIZ_FILENAME } from '../config/gistConfig.ts';
import type { QuizQuestion, QuizCharacter } from '../components/quiz/types.ts';
import { fetchGist, getGistFileContent, patchGistFile } from './gistClient.ts';
import {
  quizQuestions as defaultQuestions,
  characterDescriptions as defaultDescriptions,
  neitherDescription as defaultNeither,
} from '../components/quiz/data';

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

export const getQuizData = async (token: string = GIST_TOKEN): Promise<QuizData> => {
  try {
    const isDefaultToken = !token || (token as string) === 'YOUR_GITHUB_TOKEN';

    if (isDefaultToken) {
      console.warn('Using default token, returning default quiz data.');
      return defaultQuizData;
    }

    const response = await fetchGist({ token, cache: 'no-cache' });

    if (response.status === 401 || response.status === 404) {
      console.warn(`GitHub API returned ${response.status}, using default quiz data.`);
      return defaultQuizData;
    }

    if (!response.ok) {
      throw new Error(`GitHub API responded with ${response.status}`);
    }

    const gist = await response.json();
    const content = getGistFileContent(gist, GIST_QUIZ_FILENAME);
    if (content === null) {
      // Return default data if file doesn't exist yet
      return defaultQuizData;
    }

    const parsedData = JSON.parse(content);

    // Validate data structure
    if (!parsedData || !Array.isArray(parsedData.questions)) {
      console.warn('Invalid quiz data format fetched from Gist, returning defaults');
      return defaultQuizData;
    }

    // Ensure all required fields exist and use defaults if missing
    const sanitizedData: QuizData = {
      questions: parsedData.questions.length > 0 ? parsedData.questions : defaultQuestions,
      characterDescriptions: parsedData.characterDescriptions || defaultDescriptions,
      neitherDescription: parsedData.neitherDescription || defaultNeither,
    };

    return sanitizedData;
  } catch (error) {
    console.error('Error fetching quiz data from Gist:', error);
    // Return defaults on error
    return defaultQuizData;
  }
};

export const saveQuizData = async (data: QuizData): Promise<void> => {
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
