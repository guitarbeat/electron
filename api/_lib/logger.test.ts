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

    it("should log debug messages when NODE_ENV is undefined", () => {
      delete process.env.NODE_ENV;
      delete process.env.DEBUG;

      logger.debug("debug when NODE_ENV is undefined");

      assert.strictEqual(debugCalls.length, 1);
      assert.match(debugCalls[0][0] as string, /^\[.+\] \[DEBUG\]$/);
      assert.strictEqual(debugCalls[0][1], "debug when NODE_ENV is undefined");
    });

    it("should NOT log debug messages in production when DEBUG is not set", () => {
      process.env.NODE_ENV = "production";
      delete process.env.DEBUG;

      logger.debug("should not log");

      assert.strictEqual(debugCalls.length, 0);
    });

    it("should NOT log debug messages in production when DEBUG is empty string", () => {
      process.env.NODE_ENV = "production";
      process.env.DEBUG = "";

      logger.debug("should not log when DEBUG is empty");

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

    it("should respect production/DEBUG settings in scopedLogger debug calls", () => {
      const scoped = logger.withContext({ requestId: "req-debug" });

      process.env.NODE_ENV = "production";
      delete process.env.DEBUG;
      scoped.debug("scoped production no debug");
      assert.strictEqual(debugCalls.length, 0);

      process.env.DEBUG = "true";
      scoped.debug("scoped production with debug");
      assert.strictEqual(debugCalls.length, 1);
      assert.match(
        debugCalls[0][0] as string,
        /^\[.+\] \[DEBUG\] \[req:req-debug\]$/,
      );
      assert.strictEqual(debugCalls[0][1], "scoped production with debug");
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
      logger.warn("warn message", "extra arg");

      assert.strictEqual(warnCalls.length, 1);
      assert.match(warnCalls[0][0] as string, /^\[.+\] \[WARN\]$/);
      assert.strictEqual(warnCalls[0][1], "warn message");
      assert.strictEqual(warnCalls[0][2], "extra arg");
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

    it("should format plain Error objects without optional code/status/cause properties", () => {
      const simpleErr = new Error("simple error");

      logger.error("simple error test", simpleErr);

      assert.strictEqual(errorCalls.length, 1);
      const formattedErr = errorCalls[0][2] as Record<string, unknown>;
      assert.strictEqual(formattedErr.name, "Error");
      assert.strictEqual(formattedErr.message, "simple error");
      assert.strictEqual("code" in formattedErr, false);
      assert.strictEqual("status" in formattedErr, false);
      assert.strictEqual("cause" in formattedErr, false);
    });

    it("should ignore falsy code, status, or cause values on Error objects", () => {
      const errWithFalsyProps = new Error("falsy props");
      (errWithFalsyProps as unknown as Record<string, unknown>).code = "";
      (errWithFalsyProps as unknown as Record<string, unknown>).status = 0;
      errWithFalsyProps.cause = null;

      logger.error("falsy test", errWithFalsyProps);

      assert.strictEqual(errorCalls.length, 1);
      const formatted = errorCalls[0][2] as Record<string, unknown>;
      assert.strictEqual(formatted.name, "Error");
      assert.strictEqual(formatted.message, "falsy props");
      assert.strictEqual("code" in formatted, false);
      assert.strictEqual("status" in formatted, false);
      assert.strictEqual("cause" in formatted, false);
    });

    it("should format deeply nested Error causes recursively", () => {
      const deepCause = new Error("deepest cause");
      const middleCause = new Error("middle cause");
      middleCause.cause = deepCause;
      const topError = new Error("top error");
      topError.cause = middleCause;

      logger.error("deep error cause", topError);

      assert.strictEqual(errorCalls.length, 1);
      const formattedTop = errorCalls[0][2] as Record<string, unknown>;
      const formattedMiddle = formattedTop.cause as Record<string, unknown>;
      const formattedDeep = formattedMiddle.cause as Record<string, unknown>;

      assert.strictEqual(formattedTop.message, "top error");
      assert.strictEqual(formattedMiddle.message, "middle cause");
      assert.strictEqual(formattedDeep.message, "deepest cause");
    });

    it("should format Error instances with non-Error cause (string, object)", () => {
      const errWithStringCause = new Error("string cause error");
      errWithStringCause.cause = "string cause text";

      const errWithObjCause = new Error("object cause error");
      errWithObjCause.cause = { customCauseField: "cause data" };

      logger.error("cause test", errWithStringCause, errWithObjCause);

      assert.strictEqual(errorCalls.length, 1);
      const formatted1 = errorCalls[0][2] as Record<string, unknown>;
      assert.strictEqual(formatted1.cause, "string cause text");

      const formatted2 = errorCalls[0][3] as Record<string, unknown>;
      assert.deepStrictEqual(formatted2.cause, { customCauseField: "cause data" });
    });

    it("should format non-Error objects and non-object error args properly", () => {
      const objErr = { custom: "error object" };
      const strErr = "simple string error";
      const numArg = 404;
      const nullArg = null;
      const undefinedArg = undefined;
      const boolArg = false;

      logger.error("error with mixed primitives/objects", objErr, strErr, numArg, nullArg, undefinedArg, boolArg);

      assert.strictEqual(errorCalls.length, 1);
      assert.deepStrictEqual(errorCalls[0][2], objErr);
      assert.strictEqual(errorCalls[0][3], strErr);
      assert.strictEqual(errorCalls[0][4], 404);
      assert.strictEqual(errorCalls[0][5], null);
      assert.strictEqual(errorCalls[0][6], undefined);
      assert.strictEqual(errorCalls[0][7], false);
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

    it("should support partial context properties (scope only, userId only)", () => {
      const scopeOnly = logger.withContext({ scope: "state" });
      scopeOnly.info("scope log");
      assert.match(infoCalls[0][0] as string, /^\[.+\] \[INFO\] \[scope:state\]$/);

      const userOnly = logger.withContext({ userId: "Electra" });
      userOnly.info("user log");
      assert.match(infoCalls[1][0] as string, /^\[.+\] \[INFO\] \[user:Electra\]$/);

      const scopeAndUser = logger.withContext({ scope: "state", userId: "Electra" });
      scopeAndUser.info("scope and user log");
      assert.match(infoCalls[2][0] as string, /^\[.+\] \[INFO\] \[scope:state user:Electra\]$/);

      const reqAndUser = logger.withContext({ requestId: "req-99", userId: "Electra" });
      reqAndUser.info("req and user log");
      assert.match(infoCalls[3][0] as string, /^\[.+\] \[INFO\] \[req:req-99 user:Electra\]$/);

      const reqAndScope = logger.withContext({ requestId: "req-99", scope: "state" });
      reqAndScope.info("req and scope log");
      assert.match(infoCalls[4][0] as string, /^\[.+\] \[INFO\] \[req:req-99 scope:state\]$/);
    });

    it("should handle context with explicit undefined values gracefully", () => {
      const scopedLogger = logger.withContext({
        requestId: undefined,
        scope: "movies",
        userId: undefined,
      });

      scopedLogger.info("undefined context values");

      assert.strictEqual(infoCalls.length, 1);
      assert.match(
        infoCalls[0][0] as string,
        /^\[.+\] \[INFO\] \[scope:movies\]$/,
      );
    });

    it("should handle custom or extra context fields without crashing", () => {
      const scopedLogger = logger.withContext({
        path: "/api/movies",
        customProp: "hello",
      });

      scopedLogger.info("custom context test");

      assert.strictEqual(infoCalls.length, 1);
      assert.match(infoCalls[0][0] as string, /^\[.+\] \[INFO\]$/);
    });

    it("should handle empty context gracefully without trailing brackets", () => {
      const scopedLogger = logger.withContext({});

      scopedLogger.info("empty context");

      assert.strictEqual(infoCalls.length, 1);
      assert.match(infoCalls[0][0] as string, /^\[.+\] \[INFO\]$/);
    });

    it("should properly format error objects in scopedLogger.error with multiple args", () => {
      const scopedLogger = logger.withContext({ scope: "test" });
      const err = new Error("scoped error");
      (err as unknown as Record<string, unknown>).code = "SCOPED_ERR";

      scopedLogger.error("scoped error log", err, { extra: true });

      assert.strictEqual(errorCalls.length, 1);
      assert.match(errorCalls[0][0] as string, /^\[.+\] \[ERROR\] \[scope:test\]$/);
      assert.strictEqual(errorCalls[0][1], "scoped error log");

      const formattedErr = errorCalls[0][2] as Record<string, unknown>;
      assert.strictEqual(formattedErr.name, "Error");
      assert.strictEqual(formattedErr.message, "scoped error");
      assert.strictEqual(formattedErr.code, "SCOPED_ERR");
      assert.deepStrictEqual(errorCalls[0][3], { extra: true });
    });
  });
});
