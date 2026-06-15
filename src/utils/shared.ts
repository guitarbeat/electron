export const sanitizeInput = (input: string): string => {
  if (!input) return "";
  /* eslint-disable no-control-regex */
  return input.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "").trim();
};

export const getErrorMessage = (
  error: unknown,
  fallback: string = "Something went wrong.",
): string => {
  if (error instanceof Error) {
    const message = sanitizeInput(error.message);
    if (message) {
      return message;
    }
  }

  return fallback;
};
