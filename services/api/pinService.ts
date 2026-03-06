import { GIST_TOKEN, GIST_ID } from '../../config/gistConfig.ts';
import type { User } from '../../types.ts';
import { fetchGist } from '../core/gistClient.ts';

const GIST_PINS_FILENAME = 'pins.json';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface UserPins {
  Aaron?: string; // Hashed PIN
  Electra?: string; // Hashed PIN
}

let cachedPins: UserPins | null = null;
let lastFetchTime = 0;
let fetchPromise: Promise<UserPins> | null = null;

const parsePinsContent = (fileContent: string | undefined): UserPins => {
  if (!fileContent) {
    return {};
  }

  try {
    return JSON.parse(fileContent) as UserPins;
  } catch (parseError) {
    console.error('Error parsing PIN file:', parseError);
    return {};
  }
};

const fetchPinsFromGist = async (cache: RequestCache = 'default'): Promise<UserPins> => {
  const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    cache,
    headers: {
      Authorization: `token ${GIST_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch gist: ${response.status}`);
  }

  const gist = await response.json();
  const fileContent = gist.files?.[GIST_PINS_FILENAME]?.content as string | undefined;
  return parsePinsContent(fileContent);
};

/**
 * Clears the PIN cache - useful for testing or when PINs are changed externally
 */
export const clearPinCache = (): void => {
  cachedPins = null;
  lastFetchTime = 0;
  fetchPromise = null;
};

/**
 * Fetches user PINs with intelligent caching
 */
export const getPins = async (): Promise<UserPins> => {
  const now = Date.now();
  
  // Return cached data if still valid
  if (cachedPins && (now - lastFetchTime) < CACHE_TTL) {
    return cachedPins;
  }

  // Return existing promise if request is in flight
  if (fetchPromise) {
    return fetchPromise;
  }

  // Start new fetch
  fetchPromise = fetchPinsFromGist();
  
  try {
    const pins = await fetchPromise;
    cachedPins = pins;
    lastFetchTime = now;
    return pins;
  } finally {
    fetchPromise = null;
  }
};

/**
 * Hashes a PIN using PBKDF2 for secure storage
 */
export const hashPin = async (pin: string, salt?: string): Promise<{ hash: string; salt: string }> => {
  const actualSalt = salt || crypto.getRandomValues(new Uint8Array(16)).toString();
  
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(actualSalt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  const exported = await crypto.subtle.exportKey('raw', key);
  const hash = Array.from(new Uint8Array(exported))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
    
  return { hash, salt: actualSalt };
};

/**
 * Verifies a PIN against the stored hash
 */
export const verifySecurePin = async (pin: string, storedHash: string, salt: string): Promise<boolean> => {
  const { hash: computedHash } = await hashPin(pin, salt);
  return computedHash === storedHash;
};

/**
 * Legacy PIN verification (for backwards compatibility)
 */
export const verifyLegacyPin = (pin: string, storedPin: string): boolean => {
  // Simple hash for legacy PINs - not secure, only for migration
  return pin === storedPin;
};

/**
 * Main PIN verification function that routes to appropriate verification method
 */
export const verifyPin = async (user: User, pin: string): Promise<boolean> => {
  try {
    const pins = await getPins();
    const storedPin = pins[user];
    
    if (!storedPin) {
      return false;
    }
    
    // Check if it's a modern PBKDF2 hash (contains salt separator)
    if (storedPin.includes(':')) {
      const [hash, salt] = storedPin.split(':');
      return await verifySecurePin(pin, hash, salt);
    }
    
    // Legacy format - reject for security
    console.warn(`Legacy PIN format detected for user ${user}. Please reset PIN.`);
    return false;
    
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return false;
  }
};

/**
 * Saves a new PIN for a user
 */
export const savePin = async (user: User, pin: string): Promise<void> => {
  const { hash, salt } = await hashPin(pin);
  const storedPin = `${hash}:${salt}`;
  
  const pins = await getPins();
  pins[user] = storedPin;
  
  // Update the gist with new pins
  const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: 'PATCH',
    headers: {
      Authorization: `token ${GIST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: {
        [GIST_PINS_FILENAME]: {
          content: JSON.stringify(pins, null, 2)
        }
      }
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to save PIN: ${response.status}`);
  }
  
  // Clear cache to force refresh
  clearPinCache();
};
