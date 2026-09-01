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

const MAX_PAYLOAD_SIZE_BYTES = 65536; // 64KB cap to prevent DoS

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
    const moduleName = payload.module || (isMetric ? "PerformanceMetrics" : "UnknownModule");
    const level = isMetric ? "info" : payload.level || "error";

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
      clientTimestamp: payload.timestamp,
      module: moduleName,
      message,
      url: payload.url,
      userAgent: payload.userAgent,
      viewport: payload.viewport,
      retryCount: payload.retryCount,
      stack: payload.stack,
      componentStack: payload.componentStack,
      metricName: payload.metricName,
      metricValue: payload.metricValue,
      metricUnit: payload.metricUnit,
      metrics: payload.metrics,
      context: payload.context,
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
