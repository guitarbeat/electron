import { sanitizeInput } from "./security.js";

export interface ClientErrorRecord {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  componentStack?: string;
  context?: Record<string, unknown>;
}

const MAX_ERROR_HISTORY = 30;
const clientErrorHistory: ClientErrorRecord[] = [];

export const recordClientError = (
  error: unknown,
  context?: Record<string, unknown>,
  componentStack?: string,
): ClientErrorRecord => {
  const message = getErrorMessage(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const record: ClientErrorRecord = {
    id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    message,
    stack,
    componentStack,
    context,
  };

  clientErrorHistory.unshift(record);

  if (clientErrorHistory.length > MAX_ERROR_HISTORY) {
    clientErrorHistory.pop();
  }

  if (typeof window !== "undefined") {
    (window as unknown as { __appErrorReportHistory?: ClientErrorRecord[] }).__appErrorReportHistory = clientErrorHistory;
  }

  return record;
};

export const getClientErrorReportHistory = (): readonly ClientErrorRecord[] =>
  clientErrorHistory;

export const formatDiagnosticReport = (
  error: unknown,
  info?: { componentStack?: string | null; context?: Record<string, unknown> },
): string => {
  const timestamp = new Date().toISOString();
  const url = typeof window !== "undefined" ? window.location.href : "unknown";
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "unknown";
  const screenInfo =
    typeof window !== "undefined"
      ? `${window.innerWidth}x${window.innerHeight} (dpr: ${window.devicePixelRatio || 1})`
      : "unknown";

  const message = getErrorMessage(error);
  const stack = error instanceof Error ? error.stack : String(error);

  const lines = [
    `# Workspace Crash Diagnostic Report`,
    `**Timestamp:** ${timestamp}`,
    `**URL:** ${url}`,
    `**User Agent:** ${userAgent}`,
    `**Viewport:** ${screenInfo}`,
    ``,
    `## Error Summary`,
    `**Message:** ${message}`,
    ``,
  ];

  if (info?.context && Object.keys(info.context).length > 0) {
    lines.push(`## Context Metadata`);
    lines.push("```json");
    lines.push(JSON.stringify(info.context, null, 2));
    lines.push("```");
    lines.push("");
  }

  if (stack) {
    lines.push(`## Stack Trace`);
    lines.push("```");
    lines.push(stack);
    lines.push("```");
    lines.push("");
  }

  if (info?.componentStack) {
    lines.push(`## Component Stack`);
    lines.push("```");
    lines.push(info.componentStack.trim());
    lines.push("```");
    lines.push("");
  }

  if (clientErrorHistory.length > 1) {
    lines.push(`## Recent Errors (${clientErrorHistory.length})`);
    clientErrorHistory.slice(0, 5).forEach((rec, idx) => {
      lines.push(`${idx + 1}. [${rec.timestamp}] ${rec.message}`);
    });
    lines.push("");
  }

  return lines.join("\n");
};

export const getErrorMessage = (
  error: unknown,
  fallback: string = "Something went wrong.",
): string => {
  if (!error) return fallback;

  if (error instanceof Error) {
    let message = sanitizeInput(error.message);
    if ("cause" in error && error.cause) {
      const causeMsg = getErrorMessage(error.cause, "");
      if (causeMsg && !message.includes(causeMsg)) {
        message = message ? `${message} (Cause: ${causeMsg})` : causeMsg;
      }
    }
    if (message) {
      return message;
    }
  }

  if (typeof error === "object") {
    const errObj = error as Record<string, unknown>;
    if (typeof errObj.message === "string" && errObj.message) {
      return sanitizeInput(errObj.message) || fallback;
    }
    if (typeof errObj.error === "string" && errObj.error) {
      return sanitizeInput(errObj.error) || fallback;
    }
    if (typeof errObj.detail === "string" && errObj.detail) {
      return sanitizeInput(errObj.detail) || fallback;
    }
    if (Array.isArray(errObj.issues)) {
      const issueSummary = errObj.issues
        .map((iss: { path?: (string | number)[]; message?: string }) =>
          iss.path?.length ? `${iss.path.join(".")}: ${iss.message}` : iss.message,
        )
        .filter(Boolean)
        .join("; ");
      if (issueSummary) {
        return `Validation failed: ${issueSummary}`;
      }
    }
  }

  if (typeof error === "string") {
    const clean = sanitizeInput(error);
    if (clean) return clean;
  }

  return fallback;
};

/**
 * Log error with extra info if available (status, code, etc) and record to diagnostics history
 */
export const consoleError = (
  message: string,
  error: unknown,
  context?: Record<string, unknown>,
): void => {
  const details =
    error && typeof error === "object"
      ? {
          status: (error as Record<string, unknown>).status,
          code: (error as Record<string, unknown>).code,
          conflict: (error as Record<string, unknown>).conflict,
          ...context,
        }
      : context;

  recordClientError(error, { message, ...details });

  const hasDetails =
    details && Object.values(details).some((v) => v !== undefined);
  if (hasDetails) {
    console.error(message, error, details);
  } else {
    console.error(message, error);
  }
};

export const readApiErrorMessage = async (
  response: Response,
  fallback: string,
): Promise<string> => {
  try {
    const payload = (await response.clone().json()) as {
      error?: unknown;
      message?: unknown;
      details?: unknown;
    };
    if (typeof payload?.message === "string") {
      const msg = sanitizeInput(payload.message);
      if (msg) return msg;
    }
    if (typeof payload?.error === "string") {
      const msg = sanitizeInput(payload.error);
      if (msg) return msg;
    }
    if (typeof payload?.details === "string") {
      const msg = sanitizeInput(payload.details);
      if (msg) return msg;
    }
  } catch {
    // Fall through to the provided fallback.
  }

  if (response.status) {
    return `${fallback} (HTTP ${response.status}${response.statusText ? `: ${response.statusText}` : ""})`;
  }

  return fallback;
};
