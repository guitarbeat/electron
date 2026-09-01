import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { GlobalErrorBoundary } from "./GlobalErrorBoundary.tsx";
import { logger } from "../services/logger.ts";

test("GlobalErrorBoundary initializes with clean state and getDerivedStateFromError captures errors", () => {
  const boundary = new GlobalErrorBoundary({ children: "child content" });
  assert.strictEqual(boundary.state.hasError, false);
  assert.strictEqual(boundary.state.error, null);
  assert.strictEqual(boundary.state.retryCount, 0);

  const testError = new Error("Component crashed");
  const derivedState = GlobalErrorBoundary.getDerivedStateFromError(testError);
  assert.strictEqual(derivedState.hasError, true);
  assert.strictEqual(derivedState.error, testError);
  assert.ok(typeof derivedState.errorTime === "string");
});

test("GlobalErrorBoundary logs component stack traces to centralized logger during componentDidCatch", () => {
  const boundary = new GlobalErrorBoundary({
    children: React.createElement("div", null, "child"),
    moduleName: "SpinWheelGame",
    fallbackTitle: "SPIN ERROR",
  });

  const testError = new Error("Critical canvas rendering fault");
  const fakeErrorInfo: React.ErrorInfo = {
    componentStack: "\n    in SpinSwipeGame\n    in GlobalErrorBoundary\n    in AppWorkspaceShell",
  };

  Object.defineProperty(boundary, "updater", { value: { enqueueSetState: (_: any, partial: any) => Object.assign(boundary.state, partial) } });
  boundary.componentDidCatch(testError, fakeErrorInfo);

  assert.strictEqual(boundary.state.errorInfo, fakeErrorInfo);

  const recentErrors = logger.getRecentErrors();
  assert.ok(recentErrors.length > 0);
  const matchingError = recentErrors.find((e) => e.message.includes("Critical canvas rendering fault"));
  assert.ok(matchingError);
  assert.ok(matchingError.componentStack?.includes("SpinSwipeGame"));
});

test("GlobalErrorBoundary render returns Y2K retro UI when hasError is true", () => {
  const boundary = new GlobalErrorBoundary({
    children: React.createElement("div", null, "Normal Child"),
    moduleName: "Workspace:movies",
    fallbackTitle: "WORKSPACE VIEW ERROR",
  });

  // Normal render
  const normalOutput = boundary.render();
  assert.ok(normalOutput);

  // Errored state
  boundary.state = {
    hasError: true,
    error: new TypeError("Cannot read properties of undefined"),
    errorInfo: {
      componentStack: "\n    in MoviesView\n    in GlobalErrorBoundary",
    },
    errorTime: new Date().toISOString(),
    copiedDump: false,
    retryCount: 1,
  };

  const errorOutput = boundary.render() as React.ReactElement<{ className?: string; style?: React.CSSProperties }>;
  assert.ok(errorOutput);
  assert.strictEqual(errorOutput.props.className?.includes("font-retro"), true);
  assert.strictEqual(errorOutput.props.className?.includes("y2k-error-boundary-container"), true);
});
