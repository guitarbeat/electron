import {
  getErrorMessage,
  recordClientError,
  formatDiagnosticReport,
  type ClientErrorRecord,
  getClientErrorReportHistory,
} from "../utils/index.ts";

export interface ErrorCaptureContext {
  module?: string;
  componentStack?: string | null;
  boundary?: string;
  retryCount?: number;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface PerformanceMetricRecord {
  name: string;
  value: number;
  unit: string;
  module?: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

export interface DiagnosticPayload {
  level?: "error" | "warn" | "info" | "debug" | "metric";
  type?: "error" | "warn" | "info" | "debug" | "metric";
  message?: string;
  metricName?: string;
  metricValue?: number;
  metricUnit?: string;
  metrics?: Record<string, number | string>;
  stack?: string;
  componentStack?: string;
  module: string;
  context?: Record<string, unknown>;
  timestamp: string;
  url: string;
  userAgent: string;
  viewport: string;
  retryCount?: number;
}

export interface DiagnosticSendResult {
  ok: boolean;
  id?: string;
  sentToEndpoint: boolean;
  error?: string;
}

// In-memory sliding window for error deduplication (max 1 dispatch per unique error signature every 5 seconds)
const DEDUPE_WINDOW_MS = 5000;
const recentErrorSignatures = new Map<string, number>();

function getErrorSignature(message: string, module: string, stack?: string): string {
  const stackSummary = (stack || "").slice(0, 100);
  return `${module}::${message}::${stackSummary}`;
}

function shouldThrottleDispatch(signature: string): boolean {
  const now = Date.now();
  const lastTime = recentErrorSignatures.get(signature);

  // Clean old entries
  if (recentErrorSignatures.size > 100) {
    for (const [key, time] of recentErrorSignatures.entries()) {
      if (now - time > DEDUPE_WINDOW_MS) {
        recentErrorSignatures.delete(key);
      }
    }
  }

  if (lastTime && now - lastTime < DEDUPE_WINDOW_MS) {
    return true;
  }

  recentErrorSignatures.set(signature, now);
  return false;
}

/**
 * Sends structured diagnostic payload to the /api/diagnostics endpoint.
 * Gracefully degrades if offline or if backend is unreachable.
 */
export async function sendDiagnosticReport(
  payload: DiagnosticPayload,
): Promise<DiagnosticSendResult> {
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine !== false : true;
  if (!isOnline) {
    return { ok: false, sentToEndpoint: false, error: "Client is offline." };
  }

  const endpoint = "/api/diagnostics";
  const jsonString = JSON.stringify(payload);

  try {
    // Attempt non-blocking keepalive fetch
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: jsonString,
      keepalive: true,
    });

    if (response.ok) {
      const data = (await response.json()) as { ok?: boolean; id?: string };
      return { ok: true, sentToEndpoint: true, id: data.id };
    }

    return {
      ok: false,
      sentToEndpoint: true,
      error: `Diagnostics endpoint responded with HTTP ${response.status}`,
    };
  } catch (networkError) {
    // Fallback attempt: if sendBeacon is supported and jsonString fits
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      try {
        const blob = new Blob([jsonString], { type: "application/json" });
        const beaconSuccess = navigator.sendBeacon(endpoint, blob);
        if (beaconSuccess) {
          return { ok: true, sentToEndpoint: true };
        }
      } catch {
        // Beacon failed as well
      }
    }

    return {
      ok: false,
      sentToEndpoint: false,
      error: networkError instanceof Error ? networkError.message : String(networkError),
    };
  }
}

export interface PerformanceTimer {
  getElapsedMs: () => number;
  stop: (extraContext?: Record<string, unknown>) => Promise<number>;
}

/**
 * Centralized frontend logging service that exposes methods for error tracking,
 * critical exception logging with stack traces, performance metrics, and telemetry reporting.
 */
export class FrontendLogger {
  private static instance: FrontendLogger | null = null;
  private hasInitializedPerformance = false;

  public static getInstance(): FrontendLogger {
    if (!FrontendLogger.instance) {
      FrontendLogger.instance = new FrontendLogger();
    }
    return FrontendLogger.instance;
  }

  /**
   * Logs a critical application error with full stack trace, component stack,
   * developer console diagnostic formatting, and remote telemetry dispatch.
   */
  public async logCriticalError(
    error: unknown,
    context?: ErrorCaptureContext,
  ): Promise<DiagnosticSendResult> {
    const timestamp = new Date().toISOString();
    const moduleName = context?.module || "AppWorkspaceShell";
    const message = getErrorMessage(error, "Critical runtime error occurred.");
    const stack = error instanceof Error ? error.stack : undefined;
    const componentStack = context?.componentStack || undefined;

    const url = typeof window !== "undefined" ? window.location.href : "unknown";
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "unknown";
    const viewport =
      typeof window !== "undefined"
        ? `${window.innerWidth}x${window.innerHeight} (dpr: ${window.devicePixelRatio || 1})`
        : "unknown";

    // 1. Output high-visibility structured error & stack trace to developer console
    console.error(
      `%c[CRITICAL ERROR: ${moduleName.toUpperCase()}]%c ${message}\n` +
        `• Timestamp: ${timestamp}\n` +
        `• URL: ${url}\n` +
        `• Context: ${JSON.stringify(context?.extra || context || {})}\n` +
        `• Stack Trace:\n${stack || "(No JavaScript stack available)"}` +
        (componentStack ? `\n• Component Tree:\n${componentStack.trim()}` : ""),
      "background: #881337; color: #fda4af; font-weight: bold; padding: 3px 8px; border-radius: 4px;",
      "color: #f43f5e; font-weight: 600;",
    );

    // 2. Record locally for diagnostics ring buffer & error boundary modal
    const clientRecord: ClientErrorRecord = recordClientError(
      error,
      {
        critical: true,
        module: moduleName,
        boundary: context?.boundary,
        retryCount: context?.retryCount,
        ...context?.extra,
      },
      componentStack || undefined,
    );

    // 3. Build diagnostic payload for remote telemetry endpoint
    const payload: DiagnosticPayload = {
      level: "error",
      type: "error",
      message: `[CRITICAL] ${message}`,
      stack,
      componentStack: componentStack || undefined,
      module: moduleName,
      timestamp,
      url,
      userAgent,
      viewport,
      retryCount: context?.retryCount,
      context: {
        critical: true,
        recordId: clientRecord.id,
        boundary: context?.boundary,
        tags: context?.tags,
        ...context?.extra,
      },
    };

    // 4. Rate-limit / throttle repetitive crash loops before sending over network
    const signature = getErrorSignature(message, moduleName, stack);
    if (shouldThrottleDispatch(signature)) {
      return { ok: true, sentToEndpoint: false, error: "Throttled duplicate error dispatch." };
    }

    return await sendDiagnosticReport(payload);
  }

  /**
   * Captures runtime errors, records stack traces, and logs them to telemetry.
   */
  public async captureError(
    error: unknown,
    context?: ErrorCaptureContext,
  ): Promise<DiagnosticSendResult> {
    return this.logCriticalError(error, context);
  }

  /**
   * General error logging method.
   */
  public async logError(
    error: unknown,
    context?: ErrorCaptureContext,
  ): Promise<DiagnosticSendResult> {
    return this.logCriticalError(error, context);
  }

  /**
   * Captures runtime warnings and logs context.
   */
  public async logWarn(
    message: string,
    context?: Record<string, unknown>,
    module: string = "AppWorkspaceShell",
  ): Promise<DiagnosticSendResult> {
    const timestamp = new Date().toISOString();
    console.warn(
      `%c[WARN: ${module}]%c ${message}`,
      "background: #422006; color: #fde047; font-weight: bold; padding: 2px 6px; border-radius: 3px;",
      "color: #fef08a;",
      context,
    );

    const payload: DiagnosticPayload = {
      level: "warn",
      type: "warn",
      message,
      module,
      timestamp,
      url: typeof window !== "undefined" ? window.location.href : "unknown",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      viewport:
        typeof window !== "undefined"
          ? `${window.innerWidth}x${window.innerHeight}`
          : "unknown",
      context,
    };

    return await sendDiagnosticReport(payload);
  }

  public async captureWarning(
    message: string,
    context?: Record<string, unknown>,
    module: string = "AppWorkspaceShell",
  ): Promise<DiagnosticSendResult> {
    return this.logWarn(message, context, module);
  }

  /**
   * Captures informational logs.
   */
  public async logInfo(
    message: string,
    context?: Record<string, unknown>,
    module: string = "AppWorkspaceShell",
  ): Promise<DiagnosticSendResult> {
    const timestamp = new Date().toISOString();
    console.info(
      `%c[INFO: ${module}]%c ${message}`,
      "background: #082f49; color: #38bdf8; font-weight: bold; padding: 2px 6px; border-radius: 3px;",
      "color: #bae6fd;",
      context,
    );

    const payload: DiagnosticPayload = {
      level: "info",
      type: "info",
      message,
      module,
      timestamp,
      url: typeof window !== "undefined" ? window.location.href : "unknown",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      viewport:
        typeof window !== "undefined"
          ? `${window.innerWidth}x${window.innerHeight}`
          : "unknown",
      context,
    };

    return await sendDiagnosticReport(payload);
  }

  public async captureInfo(
    message: string,
    context?: Record<string, unknown>,
    module: string = "AppWorkspaceShell",
  ): Promise<DiagnosticSendResult> {
    return this.logInfo(message, context, module);
  }

  /**
   * Captures debug logs.
   */
  public async logDebug(
    message: string,
    context?: Record<string, unknown>,
    module: string = "AppWorkspaceShell",
  ): Promise<DiagnosticSendResult> {
    const timestamp = new Date().toISOString();
    if (process.env.NODE_ENV !== "production") {
      console.debug(`[DEBUG: ${module}] ${message}`, context);
    }

    const payload: DiagnosticPayload = {
      level: "debug",
      type: "debug",
      message,
      module,
      timestamp,
      url: typeof window !== "undefined" ? window.location.href : "unknown",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      viewport:
        typeof window !== "undefined"
          ? `${window.innerWidth}x${window.innerHeight}`
          : "unknown",
      context,
    };

    return await sendDiagnosticReport(payload);
  }

  /**
   * Records a single performance metric and sends it to /api/diagnostics.
   */
  public async logMetric(
    name: string,
    value: number,
    unit: string = "ms",
    context?: Record<string, unknown>,
    module: string = "AppWorkspaceShell",
  ): Promise<DiagnosticSendResult> {
    const timestamp = new Date().toISOString();
    const roundedValue = Math.round(value * 100) / 100;

    if (process.env.NODE_ENV !== "production") {
      console.debug(
        `%c[METRIC: ${module}]%c ${name}: ${roundedValue}${unit}`,
        "background: #064e3b; color: #34d399; font-weight: bold; padding: 2px 6px; border-radius: 3px;",
        "color: #a7f3d0;",
        context || "",
      );
    }

    const payload: DiagnosticPayload = {
      level: "metric",
      type: "metric",
      message: `Performance Metric: ${name} = ${roundedValue}${unit}`,
      metricName: name,
      metricValue: roundedValue,
      metricUnit: unit,
      module,
      timestamp,
      url: typeof window !== "undefined" ? window.location.href : "unknown",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      viewport:
        typeof window !== "undefined"
          ? `${window.innerWidth}x${window.innerHeight}`
          : "unknown",
      context,
    };

    return await sendDiagnosticReport(payload);
  }

  public async captureMetric(
    name: string,
    value: number,
    unit: string = "ms",
    context?: Record<string, unknown>,
    module: string = "AppWorkspaceShell",
  ): Promise<DiagnosticSendResult> {
    return this.logMetric(name, value, unit, context, module);
  }

  public async captureMetrics(
    metrics: Record<string, number | string>,
    context?: Record<string, unknown>,
    module: string = "AppWorkspaceShell",
  ): Promise<DiagnosticSendResult> {
    const timestamp = new Date().toISOString();
    const payload: DiagnosticPayload = {
      level: "metric",
      type: "metric",
      message: `Performance Metrics Batch (${Object.keys(metrics).length} items)`,
      metrics,
      module,
      timestamp,
      url: typeof window !== "undefined" ? window.location.href : "unknown",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      viewport:
        typeof window !== "undefined"
          ? `${window.innerWidth}x${window.innerHeight}`
          : "unknown",
      context,
    };

    return await sendDiagnosticReport(payload);
  }

  /**
   * Starts a high-resolution performance stopwatch that logs metric on completion.
   */
  public startTimer(
    name: string,
    context?: Record<string, unknown>,
    module: string = "AppWorkspaceShell",
  ): PerformanceTimer {
    const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();

    return {
      getElapsedMs: () => {
        const now = typeof performance !== "undefined" ? performance.now() : Date.now();
        return Math.round((now - startTime) * 100) / 100;
      },
      stop: async (extraContext?: Record<string, unknown>) => {
        const now = typeof performance !== "undefined" ? performance.now() : Date.now();
        const duration = Math.round((now - startTime) * 100) / 100;
        await this.logMetric(
          name,
          duration,
          "ms",
          { ...context, ...extraContext },
          module,
        );
        return duration;
      },
    };
  }

  public startPerformanceTimer(
    name: string,
    context?: Record<string, unknown>,
    module: string = "AppWorkspaceShell",
  ): PerformanceTimer {
    return this.startTimer(name, context, module);
  }

  /**
   * Automatically instruments an async function to measure duration and catch errors.
   */
  public async trackAsync<T>(
    operationName: string,
    operation: () => Promise<T>,
    context?: Record<string, unknown>,
    module: string = "AppWorkspaceShell",
  ): Promise<T> {
    const timer = this.startTimer(operationName, context, module);
    try {
      const result = await operation();
      void timer.stop({ status: "success" });
      return result;
    } catch (error) {
      const elapsed = timer.getElapsedMs();
      void this.logCriticalError(error, {
        module,
        extra: {
          operationName,
          durationMs: elapsed,
          status: "failed",
          ...context,
        },
      });
      throw error;
    }
  }

  /**
   * Sets up global window error & unhandledrejection listeners for full-session observability.
   */
  public initGlobalErrorListeners(activeTab?: string): () => void {
    if (typeof window === "undefined") return () => undefined;

    const handleUnhandledError = (event: ErrorEvent) => {
      void this.logCriticalError(event.error || event.message, {
        module: "AppWorkspaceShell:WindowError",
        extra: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          tab: activeTab,
        },
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      void this.logCriticalError(event.reason, {
        module: "AppWorkspaceShell:UnhandledPromiseRejection",
        extra: {
          type: "unhandledrejection",
          tab: activeTab,
        },
      });
    };

    window.addEventListener("error", handleUnhandledError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleUnhandledError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }

  /**
   * Observes Web Vitals and initial navigation timing metrics (FCP, LCP, TTFB, DOM Complete).
   */
  public initWebVitalsObservability(module: string = "WebVitals"): void {
    if (typeof window === "undefined" || this.hasInitializedPerformance) return;
    this.hasInitializedPerformance = true;

    // Collect Navigation & Resource Timing
    const collectNavigationTiming = () => {
      if (typeof performance === "undefined" || !performance.getEntriesByType) return;

      const navEntries = performance.getEntriesByType("navigation");
      if (navEntries && navEntries.length > 0) {
        const nav = navEntries[0] as PerformanceNavigationTiming;
        const metrics: Record<string, number | string> = {
          ttfb_ms: Math.round(nav.responseStart - nav.requestStart),
          dns_lookup_ms: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
          tcp_handshake_ms: Math.round(nav.connectEnd - nav.connectStart),
          response_duration_ms: Math.round(nav.responseEnd - nav.responseStart),
          dom_interactive_ms: Math.round(nav.domInteractive),
          dom_complete_ms: Math.round(nav.domComplete),
          load_event_ms: Math.round(nav.loadEventEnd),
        };

        const perfWithMemory = performance as unknown as {
          memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
        };
        if (perfWithMemory.memory) {
          metrics.used_heap_mb = Math.round(perfWithMemory.memory.usedJSHeapSize / (1024 * 1024));
          metrics.total_heap_mb = Math.round(perfWithMemory.memory.totalJSHeapSize / (1024 * 1024));
        }

        void sendDiagnosticReport({
          level: "metric",
          type: "metric",
          message: `Navigation Timing Metrics (${Object.keys(metrics).length} items)`,
          metrics,
          module,
          timestamp: new Date().toISOString(),
          url: typeof window !== "undefined" ? window.location.href : "unknown",
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
          viewport:
            typeof window !== "undefined"
              ? `${window.innerWidth}x${window.innerHeight}`
              : "unknown",
          context: { type: "navigation_timing" },
        });
      }
    };

    if (document.readyState === "complete") {
      setTimeout(collectNavigationTiming, 1000);
    } else {
      window.addEventListener("load", () => {
        setTimeout(collectNavigationTiming, 1000);
      });
    }

    if (typeof PerformanceObserver !== "undefined") {
      try {
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === "first-contentful-paint") {
              void this.logMetric(
                "first_contentful_paint_ms",
                Math.round(entry.startTime),
                "ms",
                { entryType: "paint" },
                module,
              );
            }
          }
        });
        paintObserver.observe({ type: "paint", buffered: true });
      } catch {
        // Observer not supported
      }

      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            void this.logMetric(
              "largest_contentful_paint_ms",
              Math.round(lastEntry.startTime),
              "ms",
              { entryType: "largest-contentful-paint" },
              module,
            );
          }
        });
        lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
      } catch {
        // Observer not supported
      }
    }
  }

  /**
   * Helper to format a diagnostic report for an error.
   */
  public formatReport(
    error: unknown,
    info?: { componentStack?: string | null; context?: Record<string, unknown> },
  ): string {
    return formatDiagnosticReport(error, info);
  }

  /**
   * Returns recent client error records stored in memory.
   */
  public getRecentErrors(): readonly ClientErrorRecord[] {
    return getClientErrorReportHistory();
  }
}

export const logger = FrontendLogger.getInstance();
export const frontendLogger = logger;
export const errorLogger = logger;
export const loggingService = logger;
export const WorkspaceLoggingService = FrontendLogger;
export type WorkspaceLoggingService = FrontendLogger;
export default logger;
