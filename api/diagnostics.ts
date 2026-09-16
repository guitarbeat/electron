import {
  badRequestResponse,
  jsonResponse,
  mergeHeaders,
  methodNotAllowedResponse,
} from "./_lib/http.js";
import { logger } from "./_lib/logger.js";
import { withWebHandler } from "./_lib/webHandler.js";

export interface DiagnosticLogPayload {
  level?: "error" | "warn" | "info" | "debug" | "metric";
  type?: "error" | "warn" | "info" | "debug" | "metric";
  message?: string;
  metricName?: string;
  metricValue?: number;
  metricUnit?: string;
  metrics?: Record<string, number | string>;
  stack?: string;
  componentStack?: string;
  module?: string;
  context?: Record<string, unknown>;
  timestamp?: string;
  url?: string;
  userAgent?: string;
  viewport?: string;
  retryCount?: number;
}

const MAX_PAYLOAD_SIZE_BYTES = 65536;
const MAX_FIELD_LENGTH = 2000;
const DIAGNOSTIC_WINDOW_MS = 60_000;
const DIAGNOSTIC_MAX_REQUESTS = 30;
const diagnosticRequests = new Map<string, { count: number; resetAt: number }>();

const truncate = (value: unknown, max = MAX_FIELD_LENGTH): string | undefined =>
  typeof value === "string" ? value.slice(0, max) : undefined;

const getClientKey = (request: Request): string =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

const isRateLimited = (request: Request): boolean => {
  const now = Date.now();
  const key = getClientKey(request);
  const current = diagnosticRequests.get(key);
  if (!current || current.resetAt <= now) {
    diagnosticRequests.set(key, { count: 1, resetAt: now + DIAGNOSTIC_WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > DIAGNOSTIC_MAX_REQUESTS;
};

export async function diagnosticsHandler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: mergeHeaders({
        Allow: "GET, POST, OPTIONS",
      }),
    });
  }

  if (req.method === "GET") {
    return jsonResponse({
      ok: true,
      service: "diagnostics",
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  }

  if (req.method !== "POST") {
    return methodNotAllowedResponse("GET, POST, OPTIONS");
  }

  if (isRateLimited(req)) {
    return new Response(JSON.stringify({ error: "Too many diagnostic reports." }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": "60" },
    });
  }

  try {
    const rawBody = await req.text();
    if (!rawBody || rawBody.length > MAX_PAYLOAD_SIZE_BYTES) {
      return badRequestResponse(
        rawBody ? "Payload exceeds maximum allowed size (64KB)." : "Request body is required.",
      );
    }

    let payload: DiagnosticLogPayload;
    try {
      payload = JSON.parse(rawBody) as DiagnosticLogPayload;
    } catch {
      return badRequestResponse("Invalid JSON payload.");
    }

    const isMetric =
      payload.type === "metric" ||
      payload.level === "metric" ||
      Boolean(payload.metricName) ||
      Boolean(payload.metrics);

    let message = payload.message;
    if (!message || typeof message !== "string") {
      if (isMetric) {
        message = payload.metricName
          ? `Performance Metric: ${payload.metricName} = ${payload.metricValue ?? "N/A"}${payload.metricUnit || ""}`
          : `Performance Metrics Batch (${Object.keys(payload.metrics || {}).length} items)`;
      } else {
        return badRequestResponse("Field 'message' (string) is required.");
      }
    }

    const logId = `diag_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const receivedAt = new Date().toISOString();
    const moduleName = truncate(payload.module, 120) || (isMetric ? "PerformanceMetrics" : "UnknownModule");
    const level = isMetric ? "info" : payload.level || "error";
    message = truncate(message) || "Client diagnostic report";

    const diagLogger = logger.withContext({
      requestId: logId,
      scope: isMetric ? "client_metrics" : "client_diagnostics",
      module: moduleName,
      path: payload.url,
      level,
    });

    const details = {
      id: logId,
      receivedAt,
      clientTimestamp: truncate(payload.timestamp, 80),
      module: moduleName,
      message,
      url: truncate(payload.url, 500),
      userAgent: truncate(payload.userAgent, 500),
      viewport: truncate(payload.viewport, 80),
      retryCount: Number.isInteger(payload.retryCount) ? payload.retryCount : undefined,
      stack: truncate(payload.stack),
      componentStack: truncate(payload.componentStack),
      metricName: truncate(payload.metricName, 120),
      metricValue: typeof payload.metricValue === "number" && Number.isFinite(payload.metricValue) ? payload.metricValue : undefined,
      metricUnit: truncate(payload.metricUnit, 40),
      metrics: payload.metrics && typeof payload.metrics === "object" ? Object.fromEntries(Object.entries(payload.metrics).slice(0, 50).map(([key, value]) => [truncate(key, 80), typeof value === "string" ? truncate(value, 120) : value])) : undefined,
      context: undefined,
    };

    if (isMetric) {
      diagLogger.info(`[Client Metric in <${moduleName}>]: ${message}`, details);
    } else if (level === "warn") {
      diagLogger.warn(`[Client Warning in <${moduleName}>]: ${message}`, details);
    } else if (level === "info" || level === "debug") {
      diagLogger.info(`[Client Info in <${moduleName}>]: ${message}`, details);
    } else {
      diagLogger.error(`[Client Error in <${moduleName}>]: ${message}`, details);
    }

    return jsonResponse({
      ok: true,
      id: logId,
      receivedAt,
    });
  } catch (error) {
    logger.error("Failed to process diagnostic error report:", error);
    return jsonResponse(
      {
        ok: false,
        error: "Failed to process diagnostics report",
      },
      { status: 500 },
    );
  }
}

export default withWebHandler(diagnosticsHandler);
