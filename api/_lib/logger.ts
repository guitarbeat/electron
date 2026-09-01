export interface LogContext {
  requestId?: string;
  scope?: string;
  userId?: string;
  path?: string;
  [key: string]: unknown;
}

const formatErrorDetails = (error: unknown): Record<string, unknown> | string => {
  if (error instanceof Error) {
    const errorObj: Record<string, unknown> = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
    if ("code" in error && (error as { code?: unknown }).code) {
      errorObj.code = (error as { code?: unknown }).code;
    }
    if ("cause" in error && error.cause) {
      errorObj.cause = formatErrorDetails(error.cause);
    }
    if ("status" in error && (error as { status?: unknown }).status) {
      errorObj.status = (error as { status?: unknown }).status;
    }
    return errorObj;
  }
  if (typeof error === "object" && error !== null) {
    return error as Record<string, unknown>;
  }
  return String(error);
};

const formatPrefix = (level: string, context?: LogContext): string => {
  const timestamp = new Date().toISOString();
  const ctxParts: string[] = [];
  if (context?.requestId) ctxParts.push(`req:${context.requestId}`);
  if (context?.scope) ctxParts.push(`scope:${context.scope}`);
  if (context?.userId) ctxParts.push(`user:${context.userId}`);

  const ctxStr = ctxParts.length > 0 ? ` [${ctxParts.join(" ")}]` : "";
  return `[${timestamp}] [${level}]${ctxStr}`;
};

export const logger = {
  debug: (message: unknown, ...args: unknown[]) => {
    if (process.env.NODE_ENV !== "production" || process.env.DEBUG) {
      console.debug(formatPrefix("DEBUG"), message, ...args);
    }
  },
  info: (message: unknown, ...args: unknown[]) => {
    console.info(formatPrefix("INFO"), message, ...args);
  },
  warn: (message: unknown, ...args: unknown[]) => {
    console.warn(formatPrefix("WARN"), message, ...args);
  },
  error: (message: unknown, ...args: unknown[]) => {
    const formattedArgs = args.map((arg) =>
      arg instanceof Error ? formatErrorDetails(arg) : arg,
    );
    console.error(formatPrefix("ERROR"), message, ...formattedArgs);
  },
  withContext: (context: LogContext) => ({
    debug: (message: unknown, ...args: unknown[]) => {
      if (process.env.NODE_ENV !== "production" || process.env.DEBUG) {
        console.debug(formatPrefix("DEBUG", context), message, ...args);
      }
    },
    info: (message: unknown, ...args: unknown[]) => {
      console.info(formatPrefix("INFO", context), message, ...args);
    },
    warn: (message: unknown, ...args: unknown[]) => {
      console.warn(formatPrefix("WARN", context), message, ...args);
    },
    error: (message: unknown, ...args: unknown[]) => {
      const formattedArgs = args.map((arg) =>
        arg instanceof Error ? formatErrorDetails(arg) : arg,
      );
      console.error(formatPrefix("ERROR", context), message, ...formattedArgs);
    },
  }),
};

