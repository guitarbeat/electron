export interface DiagnosticContext {
  componentStack?: string | null;
  context?: Record<string, unknown> | string;
  [key: string]: unknown;
}

export interface ClientErrorRecord {
  message: string;
  stack?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

const errorHistory: ClientErrorRecord[] = [];

export const getErrorMessage = (error: unknown, fallback = "An unexpected error occurred."): string => {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    if ("message" in error && typeof (error as { message: unknown }).message === "string") {
      return (error as { message: string }).message;
    }
  }
  return fallback;
};

export const readApiErrorMessage = getErrorMessage;

export const recordClientError = (
  error: unknown,
  metadata?: Record<string, unknown>,
  componentStack?: string,
): void => {
  const message = getErrorMessage(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const record: ClientErrorRecord = {
    message,
    stack: componentStack ? `${stack ?? ""}\nComponent Stack: ${componentStack}` : stack,
    timestamp: new Date().toISOString(),
    metadata,
  };
  errorHistory.push(record);
  if (errorHistory.length > 50) {
    errorHistory.shift();
  }
};

export const consoleError = (...args: unknown[]): void => {
  console.error(...args);
};

export const getClientErrorReportHistory = (): ClientErrorRecord[] => [...errorHistory];

export const formatDiagnosticReport = (
  error: unknown,
  diagnosticContext?: DiagnosticContext,
): string => {
  const message = getErrorMessage(error);
  const stack = error instanceof Error ? error.stack : String(error);
  const time = new Date().toISOString();
  return [
    `=== ELECTRON DIAGNOSTIC REPORT [${time}] ===`,
    `Error: ${message}`,
    `Stack: ${stack}`,
    diagnosticContext?.componentStack ? `Component Tree:\n${diagnosticContext.componentStack}` : "",
    diagnosticContext?.context ? `Context: ${JSON.stringify(diagnosticContext.context, null, 2)}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
};

export const copyTextToClipboard = async (text: string): Promise<boolean> => {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback
    }
  }
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    return true;
  } catch {
    return false;
  }
};

export const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

export const compareCreatedAtAsc = <T extends { createdAt?: string }>(a: T, b: T): number => {
  const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
  return timeA - timeB;
};

export const sanitizeInput = (input: string): string => {
  return input.trim();
};

export const runWithViewTransition = (callback: () => void): void => {
  if (typeof document !== "undefined" && "startViewTransition" in document) {
    (document as Document & { startViewTransition?: (cb: () => void) => void }).startViewTransition?.(callback);
  } else {
    callback();
  }
};

export const subscribeMediaQuery = (query: string, callback: (matches: boolean) => void): (() => void) => {
  if (typeof window === "undefined") return () => {};
  const mediaQuery = window.matchMedia(query);
  const listener = (e: MediaQueryListEvent) => callback(e.matches);
  mediaQuery.addEventListener("change", listener);
  return () => mediaQuery.removeEventListener("change", listener);
};

export const subscribeMotionPreferences = (callback: (reduced: boolean) => void): (() => void) => {
  return subscribeMediaQuery("(prefers-reduced-motion: reduce)", callback);
};

export const isChromaSpotlightEnabled = (): boolean => true;

export const hasHoverCapability = (): boolean => {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(hover: hover)").matches;
};

export const loadFeatureFonts = (): void => {};

export const areDeeplyEqual = (a: unknown, b: unknown): boolean => {
  return JSON.stringify(a) === JSON.stringify(b);
};
