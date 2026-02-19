import { GIST_TOKEN, GIST_ID } from '../gistConfig';
import { User } from '../types';

const GIST_PINS_FILENAME = 'pins.json';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface UserPins {
  Aaron?: string; // Hashed PIN
  Electra?: string; // Hashed PIN
}

let cachedPins: UserPins | null = null;
let lastFetchTime = 0;

/**
 * Simple hash function for PIN codes.
 * Note: This is basic obfuscation for a private app between trusted users.
 */
export const hashPin = (pin: string): string => {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
};

/**
 * Fetches the current PINs from the Gist.
 */
export const getPins = async (): Promise<UserPins> => {
  const now = Date.now();
  if (cachedPins && now - lastFetchTime < CACHE_TTL) {
    return cachedPins;
  }

  try {
    const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: {
        Authorization: `token ${GIST_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch gist: ${response.status}`);
    }

    const gist = await response.json();
    const fileContent = gist.files?.[GIST_PINS_FILENAME]?.content;

    if (!fileContent) {
      cachedPins = {};
      lastFetchTime = now;
      return {};
    }

    cachedPins = JSON.parse(fileContent);
    lastFetchTime = now;
    return cachedPins as UserPins;
  } catch (error) {
    console.error('Error fetching PINs:', error);
    return {};
  }
};

/**
 * Saves PINs to the Gist.
 */
export const savePins = async (pins: UserPins): Promise<boolean> => {
  try {
    const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${GIST_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          [GIST_PINS_FILENAME]: {
            content: JSON.stringify(pins, null, 2),
          },
        },
      }),
    });

    if (response.ok) {
      // Update cache on successful save
      cachedPins = { ...pins };
      lastFetchTime = Date.now();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error saving PINs:', error);
    return false;
  }
};

/**
 * Sets or updates a PIN for a user.
 */
export const setPin = async (user: User, pin: string): Promise<boolean> => {
  const pins = await getPins();
  pins[user] = hashPin(pin);
  return savePins(pins);
};

/**
 * Removes a PIN for a user.
 */
export const removePin = async (user: User): Promise<boolean> => {
  const pins = await getPins();
  delete pins[user];
  return savePins(pins);
};

/**
 * Verifies a PIN for a user.
 */
export const verifyPin = async (user: User, pin: string): Promise<boolean> => {
  const pins = await getPins();
  const storedHash = pins[user];

  if (!storedHash) {
    return true; // No PIN set, allow access
  }

  return storedHash === hashPin(pin);
};

/**
 * Checks if a user has a PIN set.
 */
export const hasPin = async (user: User): Promise<boolean> => {
  const pins = await getPins();
  return !!pins[user];
};
