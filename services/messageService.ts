import { GIST_MESSAGES_FILENAME, GIST_TOKEN, GIST_API_URL } from '../config/gistConfig.ts';
import { Message } from '../types.ts';

export const getMessages = async (): Promise<Message[]> => {
  try {
    const response = await fetch(GIST_API_URL, {
      headers: {
        Authorization: `token ${GIST_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
      cache: 'no-cache',
    });

    if (!response.ok) {
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
    throw error;
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
