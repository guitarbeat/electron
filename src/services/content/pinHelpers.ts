import type { User } from '../../shared/types.ts';
import { sanitizeInput } from '../../utils/shared.ts';

export interface UserPins {
  [key: string]: string;
}

export const normalizeUserPins = (value: unknown): UserPins => {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const normalized: UserPins = {};
  
  for (const [key, pinValue] of Object.entries(value)) {
    if (typeof pinValue === 'string' && pinValue.trim().length > 0) {
      normalized[key] = sanitizeInput(pinValue);
    }
  }

  return normalized;
};

export const isUserPinsRecord = (value: unknown): value is UserPins => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  return keys.length > 0 && keys.every(key => typeof record[key] === 'string' && (record[key] as string).trim().length > 0);
};
