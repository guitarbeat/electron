import { GIST_TOKEN, GIST_ID } from '../config/gistConfig.ts';
import type { User } from '../types.ts';

const GIST_PINS_FILENAME = 'pins.json';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface UserPins {
  Aaron?: string; // Hashed PIN
  Electra?: string; // Hashed PIN
}

let cachedPins: UserPins | null = null;
let lastFetchTime = 0;
let fetchPromise: Promise<UserPins> | null = null;

/**
 * Simple hash function for PIN codes.
 * Note: This is basic obfuscation for a private app between trusted users.
 * @deprecated Use secureHashPin instead. Kept for backward compatibility.
 */
export const legacyHashPin = (pin: string): string => {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
};

/**
 * Alias for legacyHashPin to maintain compatibility with tests.
 * @deprecated
 */
export const hashPin = legacyHashPin;

/**
 * Generates a secure PBKDF2 hash for a PIN.
 * Format: pbkdf2:iterations:salt:hash
 */
export const secureHashPin = async (
  pin: string,
  saltInput: string | null = null
): Promise<string> => {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  let salt: Uint8Array;
  if (saltInput) {
    // Decode hex salt
    const matches = saltInput.match(/.{1,2}/g);
    if (!matches) throw new Error('Invalid salt format');
    salt = new Uint8Array(matches.map((byte) => parseInt(byte, 16)));
  } else {
    salt = crypto.getRandomValues(new Uint8Array(16));
  }

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    true,
    ['sign', 'verify']
  );

  const exported = await crypto.subtle.exportKey('raw', key);
  const hashHex = Array.from(new Uint8Array(exported))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `pbkdf2:100000:${saltHex}:${hashHex}`;
};

/**
 * Verifies a PIN against a secure hash.
 */
export const verifySecurePin = async (pin: string, storedHash: string): Promise<boolean> => {
  const parts = storedHash.split(':');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') {
    return false;
  }

  const saltHex = parts[2];

  // Re-hash with the same salt and compare
  const computedHashFull = await secureHashPin(pin, saltHex);
  return computedHashFull === storedHash;
};

/**
 * Fetches the current PINs from the Gist.
 */
export const getPins = async (): Promise<UserPins> => {
  const now = Date.now();
  if (cachedPins && now - lastFetchTime < CACHE_TTL) {
    return cachedPins;
  }

  if (fetchPromise) {
    return fetchPromise;
  }

  // Capture the time when we started the fetch
  const fetchStartTime = Date.now();

  const promise = (async () => {
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

      // Check if cache was updated by a write operation while we were fetching
      if (lastFetchTime > fetchStartTime && cachedPins) {
        return cachedPins;
      }

      if (!fileContent) {
        cachedPins = {};
        lastFetchTime = Date.now();
        return {};
      }

      cachedPins = JSON.parse(fileContent);
      lastFetchTime = Date.now();
      return cachedPins as UserPins;
    } catch (error) {
      console.error('Error fetching PINs:', error);
      return {};
    }
  })();

  fetchPromise = promise;

  promise.finally(() => {
    fetchPromise = null;
  });

  return promise;
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
  pins[user] = await secureHashPin(pin);
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

  // Check for new secure format
  if (storedHash.startsWith('pbkdf2:')) {
    return verifySecurePin(pin, storedHash);
  }

  // Check legacy format
  if (storedHash === legacyHashPin(pin)) {
    // Automatically upgrade to secure hash
    try {
      await setPin(user, pin);
    } catch (error) {
      console.error('Failed to upgrade legacy PIN hash:', error);
      // Continue to allow login even if upgrade fails
    }
    return true;
  }

  return false;
};

/**
 * Checks if a user has a PIN set.
 */
export const hasPin = async (user: User): Promise<boolean> => {
  const pins = await getPins();
  return !!pins[user];
};
