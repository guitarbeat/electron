import type { User } from "../shared/types.js";

// ============================================================================
// Security Constants & Validation
// ============================================================================

export const KNOWN_USERS = ["Aaron", "Electra"] as const;
export const USER_OPTIONS: ReadonlyArray<User> = KNOWN_USERS;

export const isUser = (value: unknown): value is User =>
  USER_OPTIONS.includes(value as User);

export const normalizeUser = (value: unknown): User | null =>
  isUser(value) ? value : null;

export const parseJsonContent = (content: string, context: string): unknown => {
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse ${context} JSON.`, { cause: error });
  }
};

export const deepClone = <T>(value: T): T => {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
};

export const areDeeplyEqual = <T>(left: T, right: T): boolean => {
  if (left === right) return true;
  if (left === null || right === null) return left === right;
  if (typeof left !== "object" || typeof right !== "object") return false;
  if (Array.isArray(left) !== Array.isArray(right)) return false;

  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) return false;
    return left.every((item, index) =>
      areDeeplyEqual(item, (right as unknown[])[index]),
    );
  }

  const leftObj = left as Record<string, unknown>;
  const rightObj = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftObj);
  const rightKeys = Object.keys(rightObj);
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(rightObj, key) &&
      areDeeplyEqual(leftObj[key], rightObj[key]),
  );
};

export const executeAction = (
  action?: () => void,
  onComplete?: () => void,
): void => {
  action?.();
  onComplete?.();
};

/**
 * Sanitizes input string by removing control characters and trimming whitespace.
 * This helps prevent injection attacks and storage of malformed data.
 */
export const sanitizeInput = (input: string | null | undefined): string => {
  if (!input) return "";
  // The sanitizer intentionally matches ASCII control characters.
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "").trim();
};

/**
 * Validates if a string is a safe URL (http/https).
 * This prevents javascript: or data: URLs which can be XSS vectors.
 */
export const isValidUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
};

/**
 * Encodes data for storage to prevent direct plaintext access in localStorage.
 * Uses a version prefix for future extensibility and Base64 for basic obfuscation.
 */
export const encodeStorageData = (data: string): string => {
  try {
    return `v1:${btoa(data)}`;
  } catch {
    return data;
  }
};

/**
 * Decodes data from storage. Supports both legacy plaintext and versioned encoded formats.
 */
export const decodeStorageData = (data: string): string => {
  if (!data || !data.startsWith("v1:")) {
    return data;
  }

  try {
    const encodedPart = data.substring(3);
    if (!/^[a-zA-Z0-9+/=]*$/.test(encodedPart)) {
      return data;
    }
    return atob(encodedPart);
  } catch {
    return data;
  }
};
