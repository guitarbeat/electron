import { z } from 'zod';
import { sanitizeInput, consoleError } from '../../utils/shared.ts';

export interface UserPins {
  Aaron?: string;
  Electra?: string;
}

type SerialTaskRunner = <T>(task: () => Promise<T>) => Promise<T>;

export const clonePins = (pins: UserPins): UserPins => ({ ...pins });

export const normalizeUserPins = (value: unknown): UserPins | null => {
  if (value === null || (typeof value !== 'object' && !Array.isArray(value))) {
    return null;
  }

  const result: UserPins = {
    Aaron: undefined,
    Electra: undefined,
  };

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    if (typeof record.Aaron === 'string') {
      const trimmed = record.Aaron.trim();
      if (trimmed.length > 0) {
        result.Aaron = trimmed;
      }
    }
    if (typeof record.Electra === 'string') {
      const trimmed = record.Electra.trim();
      if (trimmed.length > 0) {
        result.Electra = trimmed;
      }
    }
  }

  return result;
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
    consoleError('Error parsing PIN file:', parseError);
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

const PinRecordSchema = z.record(z.string(), z.string().trim().min(1));

export type PinRecord = z.infer<typeof PinRecordSchema>;

export const normalizePinRecord = (value: unknown): PinRecord => {
  const result = PinRecordSchema.safeParse(value);
  if (!result.success) {
    return {};
  }

  const normalized: PinRecord = {};
  for (const [key, pinValue] of Object.entries(result.data)) {
    normalized[key] = sanitizeInput(pinValue);
  }

  return normalized;
};

export const isPinRecord = (value: unknown): value is PinRecord => {
  const result = PinRecordSchema.safeParse(value);
  return result.success && Object.keys(result.data).length > 0;
};
