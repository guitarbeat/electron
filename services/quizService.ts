/**
 * Quiz Service
 *
 * Handles fetching and saving quiz data from/to GitHub Gist
 */

import { GIST_TOKEN, GIST_QUIZ_FILENAME, GIST_API_URL } from '../config/gistConfig';
import type { QuizQuestion, QuizCharacter } from '../components/quiz/types.ts';
import {
  quizQuestions as defaultQuestions,
  characterDescriptions as defaultDescriptions,
  neitherDescription as defaultNeither,
} from '../components/quiz/data.ts';

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
      // eslint-disable-next-line no-console
      console.warn('Using default token, returning default quiz data.');
      return defaultQuizData;
    }

    const response = await fetch(GIST_API_URL, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
      cache: 'no-cache',
    });

    if (response.status === 401 || response.status === 404) {
      // eslint-disable-next-line no-console
      console.warn(`GitHub API returned ${response.status}, using default quiz data.`);
      return defaultQuizData;
    }

    if (!response.ok) {
      throw new Error(`GitHub API responded with ${response.status}`);
    }

    const gist = await response.json();
    const file = gist.files[GIST_QUIZ_FILENAME];

    if (!file || !file.content) {
      // Return default data if file doesn't exist yet
      return defaultQuizData;
    }

    const parsedData = JSON.parse(file.content);

    // Validate data structure
    if (!parsedData || !Array.isArray(parsedData.questions)) {
      // eslint-disable-next-line no-console
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
    // eslint-disable-next-line no-console
    console.error('Error fetching quiz data from Gist:', error);
    // Return defaults on error
    return defaultQuizData;
  }
};

export const saveQuizData = async (data: QuizData): Promise<void> => {
  try {
    const response = await fetch(GIST_API_URL, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${GIST_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        files: {
          [GIST_QUIZ_FILENAME]: {
            content: JSON.stringify(data, null, 2),
          },
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      // eslint-disable-next-line no-console
      console.error('GitHub API error details:', errorBody);
      throw new Error(`GitHub API responded with ${response.status}`);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error saving quiz data to Gist:', error);
    throw error;
  }
};
