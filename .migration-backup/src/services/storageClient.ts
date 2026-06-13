import { encodeStorageData, decodeStorageData } from '../utils/shared.ts';

export interface StoredJsonReadOptions<T> {
  storageKey: string;
  validate: (value: unknown) => value is T;
  clone: (value: T) => T;
  label: string;
}

export interface StoredJsonWriteOptions<T> {
  storageKey: string;
  value: T;
  clone: (value: T) => T;
  label: string;
}

export const readStoredJson = <T>({
  storageKey,
  validate,
  clone,
  label,
}: StoredJsonReadOptions<T>): T | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }

    const decoded = decodeStorageData(raw);
    const parsed = JSON.parse(decoded);
    if (validate(parsed)) {
      return clone(parsed);
    }
  } catch (error) {
    console.warn(`Failed to read ${label}.`, error);
  }

  return null;
};

export const writeStoredJson = <T>({
  storageKey,
  value,
  clone,
  label,
}: StoredJsonWriteOptions<T>): T => {
  const nextValue = clone(value);

  if (typeof window !== 'undefined') {
    try {
      const encoded = encodeStorageData(JSON.stringify(nextValue));
      window.localStorage.setItem(storageKey, encoded);
    } catch (error) {
      console.warn(`Failed to persist ${label}.`, error);
    }
  }

  return nextValue;
};

export const removeStoredJson = (storageKey: string, label: string): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(storageKey);
  } catch (error) {
    console.warn(`Failed to clear ${label}.`, error);
  }
};
