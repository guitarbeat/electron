/**
 * Quiz Service
 *
 * Handles fetching and saving quiz data from/to GitHub Gist
 */

import { GIST_TOKEN, GIST_ID, GIST_QUIZ_FILENAME } from '../gistConfig';
import { QuizQuestion, QuizCharacter } from '../components/quiz/types';
import {
  quizQuestions as defaultQuestions,
  characterDescriptions as defaultDescriptions,
  neitherDescription as defaultNeither,
} from '../components/quiz/data';

const GIST_API_URL = `https://api.github.com/gists/${GIST_ID}`;

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

export const getQuizData = async (): Promise<QuizData> => {
  try {
    const isDefaultToken = !GIST_TOKEN || GIST_TOKEN.startsWith('ghp_') || GIST_TOKEN === 'YOUR_GITHUB_TOKEN';
    
    if (isDefaultToken) {
      // Logic for handling default token if needed
    }

    const response = await fetch(GIST_API_URL, {
      headers: {
        Authorization: `token ${GIST_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
      cache: 'no-cache',
    });

    if (response.status === 401 || response.status === 404) {
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
    if (!parsedData || !Array.isArray(parsedData.questions) || parsedData.questions.length === 0) {
      console.warn('Invalid quiz data fetched from Gist, using defaults');
      return defaultQuizData;
    }

    return parsedData;
  } catch (error) {
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
      console.error('GitHub API error details:', errorBody);
      throw new Error(`GitHub API responded with ${response.status}`);
    }
  } catch (error) {
    console.error('Error saving quiz data to Gist:', error);
    throw error;
  }
};
