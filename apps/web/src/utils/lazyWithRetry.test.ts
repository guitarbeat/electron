import assert from "node:assert/strict";
import test from "node:test";
import { importWithExponentialBackoff } from "./lazyWithRetry.ts";

test("importWithExponentialBackoff succeeds on first attempt", async () => {
  let callCount = 0;
  const mockComponent = () => null;

  const result = await importWithExponentialBackoff(async () => {
    callCount++;
    return { default: mockComponent };
  });

  assert.strictEqual(callCount, 1);
  assert.strictEqual(result.default, mockComponent);
});

test("importWithExponentialBackoff retries transient failures with backoff and succeeds", async () => {
  let callCount = 0;
  const mockComponent = () => null;

  const result = await importWithExponentialBackoff(
    async () => {
      callCount++;
      if (callCount < 3) {
        throw new TypeError("Failed to fetch dynamically imported module chunk_test.js");
      }
      return { default: mockComponent };
    },
    {
      maxRetries: 3,
      initialDelayMs: 10,
      backoffFactor: 2,
      componentName: "TestRetriedComponent",
    },
  );

  assert.strictEqual(callCount, 3);
  assert.strictEqual(result.default, mockComponent);
});

test("importWithExponentialBackoff throws and logs after exceeding maxRetries", async () => {
  let callCount = 0;

  await assert.rejects(
    async () => {
      await importWithExponentialBackoff(
        async () => {
          callCount++;
          throw new Error("Persistent network 404 chunk failure");
        },
        {
          maxRetries: 2,
          initialDelayMs: 10,
          backoffFactor: 1.5,
          componentName: "FailingChunkComponent",
        },
      );
    },
    {
      name: "Error",
      message: "Persistent network 404 chunk failure",
    },
  );

  // Initial attempt (1) + 2 retries = 3 total attempts
  assert.strictEqual(callCount, 3);
});
