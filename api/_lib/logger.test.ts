import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { logger } from "./logger.js";

describe("logger helper", () => {
  let originalEnv: Record<string, string | undefined>;
  let originalConsoleDebug: typeof console.debug;
  let originalConsoleInfo: typeof console.info;
  let originalConsoleWarn: typeof console.warn;
  let originalConsoleError: typeof console.error;

  let debugCalls: unknown[][] = [];
  let infoCalls: unknown[][] = [];
  let warnCalls: unknown[][] = [];
  let errorCalls: unknown[][] = [];

  beforeEach(() => {
    originalEnv = {
      NODE_ENV: process.env.NODE_ENV,
      DEBUG: process.env.DEBUG,
    };

    originalConsoleDebug = console.debug;
    originalConsoleInfo = console.info;
    originalConsoleWarn = console.warn;
    originalConsoleError = console.error;

    debugCalls = [];
    infoCalls = [];
    warnCalls = [];
    errorCalls = [];

    console.debug = (...args: unknown[]) => {
      debugCalls.push(args);
    };
    console.info = (...args: unknown[]) => {
      infoCalls.push(args);
    };
    console.warn = (...args: unknown[]) => {
      warnCalls.push(args);
    };
    console.error = (...args: unknown[]) => {
      errorCalls.push(args);
    };
  });

  afterEach(() => {
    if (originalEnv.NODE_ENV !== undefined) {
      process.env.NODE_ENV = originalEnv.NODE_ENV;
    } else {
      delete process.env.NODE_ENV;
    }

    if (originalEnv.DEBUG !== undefined) {
      process.env.DEBUG = originalEnv.DEBUG;
    } else {
      delete process.env.DEBUG;
    }

    console.debug = originalConsoleDebug;
    console.info = originalConsoleInfo;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  });

  describe("debug logging", () => {
    it("should log debug messages when NODE_ENV is not production", () => {
      process.env.NODE_ENV = "development";
      delete process.env.DEBUG;

      logger.debug("test debug message", { extra: "data" });

      assert.strictEqual(debugCalls.length, 1);
      assert.match(debugCalls[0][0] as string, /^\[.+\] \[DEBUG\]$/);
      assert.strictEqual(debugCalls[0][1], "test debug message");
      assert.deepStrictEqual(debugCalls[0][2], { extra: "data" });
    });

    it("should NOT log debug messages in production when DEBUG is not set", () => {
      process.env.NODE_ENV = "production";
      delete process.env.DEBUG;

      logger.debug("should not log");

      assert.strictEqual(debugCalls.length, 0);
    });

    it("should log debug messages in production when DEBUG is truthy", () => {
      process.env.NODE_ENV = "production";
      process.env.DEBUG = "1";

      logger.debug("production debug message");

      assert.strictEqual(debugCalls.length, 1);
      assert.match(debugCalls[0][0] as string, /^\[.+\] \[DEBUG\]$/);
      assert.strictEqual(debugCalls[0][1], "production debug message");
    });
  });

  describe("info, warn, error logging", () => {
    it("should log info messages with formatted prefix", () => {
      logger.info("info message", 123);

      assert.strictEqual(infoCalls.length, 1);
      assert.match(infoCalls[0][0] as string, /^\[.+\] \[INFO\]$/);
      assert.strictEqual(infoCalls[0][1], "info message");
      assert.strictEqual(infoCalls[0][2], 123);
    });

    it("should log warn messages with formatted prefix", () => {
      logger.warn("warn message");

      assert.strictEqual(warnCalls.length, 1);
      assert.match(warnCalls[0][0] as string, /^\[.+\] \[WARN\]$/);
      assert.strictEqual(warnCalls[0][1], "warn message");
    });

    it("should log error messages and format Error objects", () => {
      const err = new Error("something went wrong");
      (err as unknown as Record<string, unknown>).code = "ERR_CODE";
      (err as unknown as Record<string, unknown>).status = 500;
      err.cause = new Error("root cause");

      logger.error("error occurred", err, "plain arg");

      assert.strictEqual(errorCalls.length, 1);
      assert.match(errorCalls[0][0] as string, /^\[.+\] \[ERROR\]$/);
      assert.strictEqual(errorCalls[0][1], "error occurred");

      const formattedErr = errorCalls[0][2] as Record<string, unknown>;
      assert.strictEqual(formattedErr.name, "Error");
      assert.strictEqual(formattedErr.message, "something went wrong");
      assert.strictEqual(formattedErr.code, "ERR_CODE");
      assert.strictEqual(formattedErr.status, 500);
      assert.strictEqual(typeof formattedErr.stack, "string");

      const formattedCause = formattedErr.cause as Record<string, unknown>;
      assert.strictEqual(formattedCause.name, "Error");
      assert.strictEqual(formattedCause.message, "root cause");

      assert.strictEqual(errorCalls[0][3], "plain arg");
    });

    it("should format non-Error objects and non-object error args properly", () => {
      const objErr = { custom: "error object" };
      const strErr = "simple string error";

      logger.error("error with custom objects", objErr, strErr);

      assert.strictEqual(errorCalls.length, 1);
      assert.deepStrictEqual(errorCalls[0][2], objErr);
      assert.strictEqual(errorCalls[0][3], strErr);
    });
  });

  describe("withContext logging", () => {
    it("should attach request, scope, and user context to log prefix", () => {
      const scopedLogger = logger.withContext({
        requestId: "req-123",
        scope: "movies",
        userId: "Aaron",
      });

      process.env.NODE_ENV = "development";
      scopedLogger.debug("context debug");
      scopedLogger.info("context info");
      scopedLogger.warn("context warn");

      const customErr = new Error("context error");
      scopedLogger.error("context error msg", customErr);

      assert.strictEqual(debugCalls.length, 1);
      assert.match(
        debugCalls[0][0] as string,
        /^\[.+\] \[DEBUG\] \[req:req-123 scope:movies user:Aaron\]$/,
      );

      assert.strictEqual(infoCalls.length, 1);
      assert.match(
        infoCalls[0][0] as string,
        /^\[.+\] \[INFO\] \[req:req-123 scope:movies user:Aaron\]$/,
      );

      assert.strictEqual(warnCalls.length, 1);
      assert.match(
        warnCalls[0][0] as string,
        /^\[.+\] \[WARN\] \[req:req-123 scope:movies user:Aaron\]$/,
      );

      assert.strictEqual(errorCalls.length, 1);
      assert.match(
        errorCalls[0][0] as string,
        /^\[.+\] \[ERROR\] \[req:req-123 scope:movies user:Aaron\]$/,
      );
    });

    it("should support partial context properties", () => {
      const scopedLogger = logger.withContext({
        requestId: "req-456",
      });

      scopedLogger.info("partial context");

      assert.strictEqual(infoCalls.length, 1);
      assert.match(
        infoCalls[0][0] as string,
        /^\[.+\] \[INFO\] \[req:req-456\]$/,
      );
    });

    it("should handle empty context gracefully without trailing brackets", () => {
      const scopedLogger = logger.withContext({});

      scopedLogger.info("empty context");

      assert.strictEqual(infoCalls.length, 1);
      assert.match(infoCalls[0][0] as string, /^\[.+\] \[INFO\]$/);
    });
  });
});
