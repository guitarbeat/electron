import { z } from 'zod';
import { sanitizeInput, consoleError } from '../utils/shared.ts';

const UserPinsSchema = z.object({
  Aaron: z.string().trim().min(1).optional(),
  Electra: z.string().trim().min(1).optional(),
});

export type UserPins = z.infer<typeof UserPinsSchema>;

type SerialTaskRunner = <T>(task: () => Promise<T>) => Promise<T>;

export const clonePins = (pins: UserPins): UserPins => ({ ...pins });

export const normalizeUserPins = (value: unknown): UserPins | null => {
  const result = UserPinsSchema.safeParse(value);
  return result.success ? result.data : null;
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
