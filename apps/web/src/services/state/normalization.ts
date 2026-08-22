import { isValidUrl, sanitizeInput } from "../../utils/shared.js";

export const normalizeRequiredString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  return sanitizeInput(value) || null;
};

export const normalizeOptionalString = (
  value: unknown,
): string | undefined => {
  if (typeof value !== "string") return undefined;
  return sanitizeInput(value) || undefined;
};

export const normalizeRequiredDate = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  return Number.isNaN(Date.parse(value)) ? null : value;
};

export const normalizeOptionalDate = (
  value: unknown,
): string | undefined => normalizeRequiredDate(value) ?? undefined;

export const normalizeOptionalUrl = (
  value: unknown,
): string | undefined => {
  const normalized = normalizeOptionalString(value);
  return normalized && isValidUrl(normalized) ? normalized : undefined;
};

export const normalizeOptionalFiniteNumber = (
  value: unknown,
): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

export const normalizeRecordList = <T>(
  value: unknown,
  normalizeRecord: (entry: unknown) => T | null,
): T[] =>
  Array.isArray(value)
    ? value.flatMap((entry) => {
        const normalized = normalizeRecord(entry);
        return normalized === null ? [] : [normalized];
      })
    : [];
