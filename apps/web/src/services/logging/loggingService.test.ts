import assert from "node:assert/strict";
import test from "node:test";
import {
  loggingService,
  errorLogger,
  sendDiagnosticReport,
  WorkspaceLoggingService,
} from "./index.ts";

test("loggingService is a singleton matching errorLogger", () => {
  assert.strictEqual(loggingService, errorLogger);
  assert.strictEqual(loggingService, WorkspaceLoggingService.getInstance());
});

test("errorLogger captures runtime errors without throwing", async () => {
  const err = new Error("Simulated test component crash");
  const result = await errorLogger.captureError(err, {
    module: "TestWorkspaceModule",
    componentStack: "in TestComponent\n    in AppWorkspaceShell",
    retryCount: 1,
  });

  assert.ok(result);
  assert.strictEqual(typeof result.ok, "boolean");
});

test("errorLogger captures warnings and info gracefully", async () => {
  const warnResult = await errorLogger.captureWarning(
    "Potential memory or render anomaly detected",
    { tab: "movies" },
    "TestWorkspaceModule",
  );
  assert.ok(warnResult);
  assert.strictEqual(typeof warnResult.ok, "boolean");

  const infoResult = await loggingService.captureInfo(
    "Workspace tab mounted",
    { activeTab: "movies" },
    "AppWorkspaceShell",
  );
  assert.ok(infoResult);
  assert.strictEqual(typeof infoResult.ok, "boolean");
});

test("loggingService captures performance metrics and batches", async () => {
  const metricResult = await loggingService.captureMetric(
    "workspace_tab_render_duration_ms",
    34.5,
    "ms",
    { tab: "movies" },
    "AppWorkspaceShell",
  );
  assert.ok(metricResult);
  assert.strictEqual(typeof metricResult.ok, "boolean");

  const batchResult = await loggingService.captureMetrics(
    {
      fcp_ms: 220,
      ttfb_ms: 80,
      dom_interactive_ms: 190,
    },
    { page: "workspace" },
    "WebVitals",
  );
  assert.ok(batchResult);
  assert.strictEqual(typeof batchResult.ok, "boolean");
});

test("loggingService tracks performance stopwatch timers", async () => {
  const timer = loggingService.startPerformanceTimer(
    "test_operation_time",
    { step: 1 },
    "AppWorkspaceShell",
  );

  // Small pause
  await new Promise((resolve) => setTimeout(resolve, 10));

  const elapsed = timer.getElapsedMs();
  assert.ok(elapsed >= 5);

  const duration = await timer.stop({ status: "done" });
  assert.ok(duration >= 5);
});

test("loggingService tracks async operations with trackAsync", async () => {
  const result = await loggingService.trackAsync(
    "fetch_test_data",
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return { success: true };
    },
    { userId: "test_user" },
    "AppWorkspaceShell",
  );

  assert.deepStrictEqual(result, { success: true });
});

test("loggingService handles errors inside trackAsync and re-throws", async () => {
  await assert.rejects(
    async () => {
      await loggingService.trackAsync(
        "failing_operation",
        async () => {
          throw new Error("Tracked async failure");
        },
        { tag: "test" },
        "AppWorkspaceShell",
      );
    },
    { message: "Tracked async failure" },
  );
});

test("sendDiagnosticReport gracefully handles offline or fetch failures", async () => {
  const result = await sendDiagnosticReport({
    level: "error",
    message: "Offline test report",
    module: "TestModule",
    timestamp: new Date().toISOString(),
    url: "http://localhost:3000/#movies",
    userAgent: "NodeTestRunner",
    viewport: "1920x1080",
  });

  assert.strictEqual(typeof result.sentToEndpoint, "boolean");
});
