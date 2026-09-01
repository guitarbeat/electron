import assert from "node:assert/strict";
import test from "node:test";
import {
  logger,
  frontendLogger,
  errorLogger,
  loggingService,
  FrontendLogger,
  sendDiagnosticReport,
} from "./logger.ts";

test("logger is a singleton instance matching all aliases", () => {
  assert.strictEqual(logger, frontendLogger);
  assert.strictEqual(logger, errorLogger);
  assert.strictEqual(logger, loggingService);
  assert.strictEqual(logger, FrontendLogger.getInstance());
});

test("logger.logCriticalError logs critical errors with stack trace without throwing", async () => {
  const err = new Error("Simulated critical workspace crash");
  const result = await logger.logCriticalError(err, {
    module: "AppWorkspaceShell",
    componentStack: "in Suspense\n    in AppWorkspaceShell",
    boundary: "GlobalErrorBoundary",
    retryCount: 2,
    extra: { tab: "messages" },
  });

  assert.ok(result);
  assert.strictEqual(typeof result.ok, "boolean");
  assert.strictEqual(typeof result.sentToEndpoint, "boolean");
});

test("logger.logError and logger.captureError forward critical error records", async () => {
  const customError = new TypeError("Invalid tab configuration object");
  const result1 = await logger.logError(customError, {
    module: "AppWorkspaceShell",
  });
  assert.ok(result1);

  const result2 = await logger.captureError("String error message", {
    module: "InlinePanel",
  });
  assert.ok(result2);
});

test("logger.logWarn, logInfo, logDebug output telemetry without throwing", async () => {
  const warnRes = await logger.logWarn("Slow rendering detected", { renderDurationMs: 120 });
  assert.ok(warnRes);
  assert.strictEqual(typeof warnRes.ok, "boolean");

  const infoRes = await logger.logInfo("Active tab transitioned", { activeTab: "movies" });
  assert.ok(infoRes);
  assert.strictEqual(typeof infoRes.ok, "boolean");

  const debugRes = await logger.logDebug("Debug probe active", { probeId: 101 });
  assert.ok(debugRes);
  assert.strictEqual(typeof debugRes.ok, "boolean");
});

test("logger.logMetric and startTimer record performance measurements", async () => {
  const metricRes = await logger.logMetric(
    "shell_initial_render_time",
    42.8,
    "ms",
    { tab: "movies" },
  );
  assert.ok(metricRes);
  assert.strictEqual(typeof metricRes.ok, "boolean");

  const timer = logger.startTimer("tab_switch_latency", { from: "movies", to: "messages" });
  await new Promise((r) => setTimeout(r, 15));
  const elapsed = timer.getElapsedMs();
  assert.ok(elapsed >= 10);

  const duration = await timer.stop({ completed: true });
  assert.ok(duration >= 10);
});

test("logger.trackAsync measures async functions and catches exceptions", async () => {
  const successVal = await logger.trackAsync(
    "load_user_profile",
    async () => {
      await new Promise((r) => setTimeout(r, 10));
      return { id: "user_42", name: "Alice" };
    },
    { role: "admin" },
  );
  assert.deepStrictEqual(successVal, { id: "user_42", name: "Alice" });

  await assert.rejects(
    async () => {
      await logger.trackAsync("failing_async_op", async () => {
        throw new Error("Network timeout during fetch");
      });
    },
    { message: "Network timeout during fetch" },
  );
});

test("logger.formatReport generates formatted diagnostic markdown", () => {
  const err = new Error("Component render fault");
  const report = logger.formatReport(err, {
    componentStack: "in ChildComponent\n    in ParentComponent",
    context: { activeTab: "movies" },
  });

  assert.ok(typeof report === "string");
  assert.ok(report.includes("Component render fault"));
  assert.ok(report.includes("Workspace Crash Diagnostic Report"));
});

test("sendDiagnosticReport gracefully handles offline or unreachable backend", async () => {
  const res = await sendDiagnosticReport({
    level: "error",
    message: "Test offline send",
    module: "AppWorkspaceShell",
    timestamp: new Date().toISOString(),
    url: "http://localhost:3000/",
    userAgent: "TestRunner",
    viewport: "1920x1080",
  });

  assert.ok(res);
  assert.strictEqual(typeof res.sentToEndpoint, "boolean");
});
