import { GIST_MESSAGES_FILENAME, GIST_TOKEN, GIST_API_URL, GIST_ID } from '../config/gistConfig';
import { Message } from '../types';

const mockMessages: Message[] = [];

export const getMessages = async (): Promise<Message[]> => {
  try {
    // If credentials are missing, use mock data instead of erroring
    if (!GIST_TOKEN?.trim() || !GIST_ID?.trim()) {
      console.warn(
        'GitHub credentials not configured. Using mock messages. Set VITE_GIST_TOKEN and VITE_GIST_ID to use real data.'
      );
      return mockMessages;
    }

    const response = await fetch(GIST_API_URL, {
      headers: {
        Authorization: `token ${GIST_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
      cache: 'no-cache',
    });

    if (!response.ok) {
      // Return mock data for 401 and other auth errors instead of throwing
      if (response.status === 401 || response.status === 403) {
        console.warn(`GitHub API returned ${response.status}. Falling back to mock messages.`);
        return mockMessages;
      }
      throw new Error(`GitHub API responded with ${response.status}`);
    }

    const gist = await response.json();
    const file = gist.files[GIST_MESSAGES_FILENAME];

    if (!file) {
      // If the file doesn't exist yet, return an empty array.
      return [];
    }

    if (!file.content) {
      return [];
    }

    return JSON.parse(file.content);
  } catch (error) {
    console.error('Error fetching messages from Gist:', error);
    // Return mock data as fallback when API fails
    console.warn('Falling back to mock messages');
    return mockMessages;
  }
};

export const saveMessages = async (messages: Message[]): Promise<void> => {
  try {
    const response = await fetch(GIST_API_URL, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${GIST_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        files: {
          [GIST_MESSAGES_FILENAME]: {
            content: JSON.stringify(messages, null, 2),
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
    console.error('Error saving messages to Gist:', error);
    throw error;
  }
};
