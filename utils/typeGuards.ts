/**
 * Type guards and type safety utilities
 */

export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !Number.isNaN(value);
};

export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const isArray = (value: unknown): value is unknown[] => {
  return Array.isArray(value);
};

export const isFunction = (value: unknown): value is Function => {
  return typeof value === 'function';
};

export const isDate = (value: unknown): value is Date => {
  return value instanceof Date && !Number.isNaN(value.getTime());
};

export const isError = (value: unknown): value is Error => {
  return value instanceof Error;
};

export const hasProperty = <K extends string | number | symbol>(
  obj: unknown,
  prop: K
): obj is Record<K, unknown> => {
  return isObject(obj) && prop in obj;
};

export const isEmpty = (value: unknown): boolean => {
  if (value == null) return true;
  if (isString(value) || isArray(value)) return value.length === 0;
  if (isObject(value)) return Object.keys(value).length === 0;
  return false;
};

export const isValidEmail = (email: unknown): email is string => {
  return isString(email) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidUrl = (url: unknown): url is string => {
  return isString(url) && /^https?:\/\/.+/.test(url);
};
