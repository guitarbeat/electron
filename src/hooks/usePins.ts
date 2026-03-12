import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import {
  canReadGist,
  canWriteGist,
  fetchGist,
  getGistFileContent,
  patchGistFile,
  readLocalOverride,
  readStoredJson,
  setLocalOverride,
  writeStoredJson,
} from '../services/gistClient.ts';

const GIST_PINS_FILENAME = 'pins.json';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const PINS_LOCAL_STORAGE_KEY = 'movieList.localPins';

const MOCK_PINS = {
  Aaron: '',
  Electra: '',
};

interface UserPins {
  Aaron?: string;
  Electra?: string;
}

const clonePins = (pins: UserPins): UserPins => ({ ...pins });

const isUserPinsRecord = (value: unknown): value is UserPins => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const pins = value as Partial<UserPins>;

  return (
    (pins.Aaron === undefined || typeof pins.Aaron === 'string') &&
    (pins.Electra === undefined || typeof pins.Electra === 'string')
  );
};

const readStoredLocalPins = (): UserPins | null =>
  readStoredJson({
    storageKey: PINS_LOCAL_STORAGE_KEY,
    validate: isUserPinsRecord,
    clone: clonePins,
    label: 'local PIN fallback',
  });

const getFallbackPins = (): UserPins => readStoredLocalPins() ?? clonePins(MOCK_PINS);

const saveLocalPins = (pins: UserPins): void => {
  writeStoredJson({
    storageKey: PINS_LOCAL_STORAGE_KEY,
    value: pins,
    clone: clonePins,
    label: 'local PIN fallback',
  });
  setLocalOverride('pins', true);
};

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
  if (!canReadGist) {
    return getFallbackPins();
  }

  const localOverride = readLocalOverride('pins', readStoredLocalPins);
  if (localOverride.enabled && localOverride.value) {
    return localOverride.value;
  }

  try {
    const response = await fetchGist({ cache });

    if (!response.ok) {
      console.warn(`Failed to fetch pins from gist (${response.status}), using local fallback.`);
      return getFallbackPins();
    }

    const gist = await response.json();
    const fileContent = getGistFileContent(gist, GIST_PINS_FILENAME);
    if (fileContent === null) {
      if (!canWriteGist) {
        return getFallbackPins();
      }
      return {};
    }

    return parsePinsContent(fileContent);
  } catch (error) {
    console.warn('Error fetching pins, using local fallback:', error);
    return getFallbackPins();
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
  if (!canWriteGist) {
    saveLocalPins(pins);
    cachedPins = clonePins(pins);
    lastFetchTime = Date.now();
    return true;
  }

  try {
    const response = await patchGistFile(GIST_PINS_FILENAME, JSON.stringify(pins, null, 2));

    if (response.ok) {
      setLocalOverride('pins', false);
      cachedPins = clonePins(pins);
      lastFetchTime = Date.now();
      return true;
    }

    console.warn(`Failed to save PINs to Gist (${response.status}), using local fallback.`);
    saveLocalPins(pins);
    cachedPins = clonePins(pins);
    lastFetchTime = Date.now();
    return true;
  } catch (error) {
    console.warn('Error saving PINs, using local fallback:', error);
    saveLocalPins(pins);
    cachedPins = clonePins(pins);
    lastFetchTime = Date.now();
    return true;
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
