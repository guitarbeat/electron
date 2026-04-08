export interface UserPins {
  Aaron?: string;
  Electra?: string;
}

type SerialTaskRunner = <T>(task: () => Promise<T>) => Promise<T>;

const normalizeOptionalPinHash = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized || undefined;
};

export const clonePins = (pins: UserPins): UserPins => ({ ...pins });

export const normalizeUserPins = (value: unknown): UserPins | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const pins = value as Partial<UserPins>;

  return {
    Aaron: normalizeOptionalPinHash(pins.Aaron),
    Electra: normalizeOptionalPinHash(pins.Electra),
  };
};

export const isUserPinsRecord = (value: unknown): value is UserPins =>
  normalizeUserPins(value) !== null;

export const parsePinsContent = (fileContent: string | undefined): UserPins => {
  if (!fileContent) {
    return {};
  }

  try {
    const parsed = JSON.parse(fileContent);
    return normalizeUserPins(parsed) ?? {};
  } catch (parseError) {
    console.error('Error parsing PIN file:', parseError);
    return {};
  }
};

export const createSerialTaskRunner = (): SerialTaskRunner => {
  let pendingTask = Promise.resolve();

  return async <T>(task: () => Promise<T>): Promise<T> => {
    const nextTask = pendingTask.then(task, task);
    pendingTask = nextTask.then(
      () => undefined,
      () => undefined
    );
    return nextTask;
  };
};

// ---------------------------------------------------------------------------
// Generic pin record helpers (merged from content/pinHelpers.ts)
// ---------------------------------------------------------------------------

import { sanitizeInput } from '../utils/shared.ts';

export interface PinRecord {
  [key: string]: string;
}

export const normalizePinRecord = (value: unknown): PinRecord => {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const normalized: PinRecord = {};

  for (const [key, pinValue] of Object.entries(value)) {
    if (typeof pinValue === 'string' && pinValue.trim().length > 0) {
      normalized[key] = sanitizeInput(pinValue);
    }
  }

  return normalized;
};

export const isPinRecord = (value: unknown): value is PinRecord => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  return keys.length > 0 && keys.every(key => typeof record[key] === 'string' && (record[key] as string).trim().length > 0);
};
