export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const deepClone = <T>(value: T): T => {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
};
