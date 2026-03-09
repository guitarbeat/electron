import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { GIST_ID, GIST_TOKEN } from '../config/gistConfig.ts';

const GIST_PINS_FILENAME = 'pins.json';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const MOCK_PINS = {
  Aaron: '',
  Electra: '',
};

interface UserPins {
  Aaron?: string;
  Electra?: string;
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
  if (!GIST_TOKEN || !GIST_ID) {
    return MOCK_PINS;
  }

  try {
    const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      cache,
      headers: {
        Authorization: `token ${GIST_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch pins from gist, using mock data');
      return MOCK_PINS;
    }

    const gist = await response.json();
    const fileContent = gist.files?.[GIST_PINS_FILENAME]?.content as string | undefined;
    return parsePinsContent(fileContent);
  } catch (error) {
    console.warn('Error fetching pins, using mock data:', error);
    return MOCK_PINS;
  }
};

const secureHashPin = async (pin: string, saltInput: string | null = null): Promise<string> => {
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

const verifySecurePin = async (pin: string, storedHash: string): Promise<boolean> => {
  const parts = storedHash.split(':');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') {
    return false;
  }

  const saltHex = parts[2];
  const computedHashFull = await secureHashPin(pin, saltHex);
  return computedHashFull === storedHash;
};

const getPins = async (): Promise<UserPins> => {
  const now = Date.now();

  if (cachedPins && now - lastFetchTime < CACHE_TTL) {
    return cachedPins;
  }

  if (fetchPromise) {
    return fetchPromise;
  }

  const fetchStartTime = Date.now();
  fetchPromise = fetchPinsFromGist()
    .then((parsedPins) => {
      if (lastFetchTime > fetchStartTime && cachedPins) {
        return cachedPins;
      }

      cachedPins = parsedPins;
      lastFetchTime = Date.now();
      return parsedPins;
    })
    .catch((error) => {
      console.error('Error fetching PINs:', error);
      if (cachedPins) {
        return cachedPins;
      }
      throw error;
    });

  const currentFetch = fetchPromise;
  fetchPromise.finally(() => {
    if (fetchPromise === currentFetch) {
      fetchPromise = null;
    }
  });

  return fetchPromise;
};

const savePins = async (pins: UserPins): Promise<boolean> => {
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

const setPin = async (user: User, pin: string): Promise<boolean> => {
  try {
    const freshPins = await fetchPinsFromGist('no-cache');
    freshPins[user] = await secureHashPin(pin);
    return savePins(freshPins);
  } catch (error) {
    console.error('Error setting PIN:', error);
    return false;
  }
};

const removePin = async (user: User): Promise<boolean> => {
  try {
    const freshPins = await fetchPinsFromGist('no-cache');
    delete freshPins[user];
    return savePins(freshPins);
  } catch (error) {
    console.error('Error removing PIN:', error);
    return false;
  }
};

const verifyPin = async (user: User, pin: string): Promise<boolean> => {
  let pins: UserPins;
  try {
    pins = await getPins();
  } catch (error) {
    console.error('PIN verification failed while loading PINs:', error);
    return false;
  }

  const storedHash = pins[user];
  if (!storedHash) {
    return true;
  }

  if (storedHash.startsWith('pbkdf2:')) {
    return verifySecurePin(pin, storedHash);
  }

  return false;
};

export const usePins = () => {
  const [pins, setPinsState] = useState<UserPins>({});
  const [isLoading, setIsLoading] = useState(true);

  const syncPins = useCallback(async () => {
    const latestPins = await getPins();
    setPinsState(latestPins);
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      await syncPins();
    } catch (error) {
      console.error('Error fetching PINs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [syncPins]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Also refresh every 30 seconds to get latest changes
  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [refresh]);

  const userHasPin = useCallback((user: User): boolean => !!pins[user], [pins]);

  const setUserPin = useCallback(
    async (user: User, pin: string): Promise<boolean> => {
      try {
        const success = await setPin(user, pin);
        if (success) {
          await syncPins();
        }
        return success;
      } catch (error) {
        console.error('Error setting PIN:', error);
        return false;
      }
    },
    [syncPins]
  );

  const removeUserPin = useCallback(
    async (user: User): Promise<boolean> => {
      try {
        const success = await removePin(user);
        if (success) {
          await syncPins();
        }
        return success;
      } catch (error) {
        console.error('Error removing PIN:', error);
        return false;
      }
    },
    [syncPins]
  );

  const verifyUserPin = useCallback(async (user: User, pin: string): Promise<boolean> => {
    return verifyPin(user, pin);
  }, []);

  return {
    pins,
    isLoading,
    userHasPin,
    setUserPin,
    removeUserPin,
    verifyUserPin,
    refresh,
  };
};
