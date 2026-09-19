import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import { fetchWithRetry } from "./retryFetch.js";

describe("fetchWithRetry", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns immediately on 200 OK without retry", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });

    let calls = 0;
    globalThis.fetch = async (input, init) => {
      calls++;
      return new Response("ok", { status: 200 });
    };

    const promise = fetchWithRetry("https://example.com", undefined, "test-ctx");
    t.mock.timers.tick(100000);
    const res = await promise;

    assert.equal(calls, 1);
    assert.equal(res.status, 200);
    assert.equal(await res.text(), "ok");
  });

  it("returns immediately on non-retryable status (e.g. 400, 404, 501)", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });

    for (const status of [400, 404, 501]) {
      let calls = 0;
      globalThis.fetch = async () => {
        calls++;
        return new Response("error", { status });
      };

      const promise = fetchWithRetry("https://example.com", undefined, "test-ctx");
      t.mock.timers.tick(100000);
      const res = await promise;

      assert.equal(calls, 1);
      assert.equal(res.status, status);
    }
  });

  it("retries on 500 status and succeeds on subsequent attempt", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });

    let calls = 0;
    globalThis.fetch = async () => {
      calls++;
      if (calls === 1) {
        return new Response("server error", { status: 500 });
      }
      return new Response("success", { status: 200 });
    };

    const promise = fetchWithRetry("https://example.com", undefined, "test-ctx");
    // Tick timers repeatedly to allow sleep and timeout promises to settle
    for (let i = 0; i < 10; i++) {
      t.mock.timers.tick(1000);
      await new Promise((r) => setImmediate(r));
    }
    const res = await promise;

    assert.equal(calls, 2);
    assert.equal(res.status, 200);
    assert.equal(await res.text(), "success");
  });

  it("retries up to 3 attempts on continuous 500 status and returns last response", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });

    let calls = 0;
    globalThis.fetch = async () => {
      calls++;
      return new Response(`fail ${calls}`, { status: 500 });
    };

    const promise = fetchWithRetry("https://example.com", undefined, "test-ctx");
    for (let i = 0; i < 20; i++) {
      t.mock.timers.tick(1000);
      await new Promise((r) => setImmediate(r));
    }
    const res = await promise;

    assert.equal(calls, 3);
    assert.equal(res.status, 500);
    assert.equal(await res.text(), "fail 3");
  });

  it("retries on 429 status and respects Retry-After header", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });

    let calls = 0;
    globalThis.fetch = async () => {
      calls++;
      if (calls === 1) {
        return new Response("rate limited", {
          status: 429,
          headers: { "Retry-After": "2" },
        });
      }
      return new Response("ok", { status: 200 });
    };

    const promise = fetchWithRetry("https://example.com", undefined, "test-ctx");
    for (let i = 0; i < 20; i++) {
      t.mock.timers.tick(1000);
      await new Promise((r) => setImmediate(r));
    }
    const res = await promise;

    assert.equal(calls, 2);
    assert.equal(res.status, 200);
  });

  it("retries network errors and throws after max attempts", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });

    let calls = 0;
    globalThis.fetch = async () => {
      calls++;
      throw new Error("Network connection lost");
    };

    const promise = fetchWithRetry("https://example.com", undefined, "test-ctx");

    // We catch the expectation
    const expectation = assert.rejects(
      async () => {
        await promise;
      },
      (err: Error) => {
        assert.equal(err.message, "Network connection lost");
        return true;
      },
    );

    for (let i = 0; i < 20; i++) {
      t.mock.timers.tick(1000);
      await new Promise((r) => setImmediate(r));
    }

    await expectation;
    assert.equal(calls, 3);
  });

  it("does not retry caller-initiated abort errors", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });

    const controller = new AbortController();
    let calls = 0;

    globalThis.fetch = async (input, init) => {
      calls++;
      const error = new Error("This operation was aborted");
      error.name = "AbortError";
      throw error;
    };

    controller.abort();

    const promise = fetchWithRetry(
      "https://example.com",
      { signal: controller.signal },
      "test-ctx",
    );

    const expectation = assert.rejects(
      async () => {
        await promise;
      },
      (err: Error) => {
        assert.equal(err.name, "AbortError");
        return true;
      },
    );

    t.mock.timers.tick(1000);
    await expectation;

    assert.equal(calls, 1);
  });

  it("aborts immediately when caller aborts during an in-flight fetch request", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });

    const controller = new AbortController();
    let calls = 0;

    globalThis.fetch = async (input, init) => {
      calls++;
      const signal = init?.signal as AbortSignal;
      return new Promise<Response>((_, reject) => {
        signal.addEventListener("abort", () => {
          const err = new Error("Caller aborted in-flight request");
          err.name = "AbortError";
          reject(err);
        });
      });
    };

    const promise = fetchWithRetry(
      "https://example.com",
      { signal: controller.signal },
      "abort-in-flight-ctx",
    );

    // Abort the caller signal while fetch is pending/in-flight
    controller.abort();

    const expectation = assert.rejects(
      async () => {
        await promise;
      },
      (err: Error) => {
        assert.equal(err.name, "AbortError");
        assert.equal(err.message, "Caller aborted in-flight request");
        return true;
      },
    );

    await expectation;
    assert.equal(calls, 1);
  });

  it("wraps non-Error thrown exceptions with context string", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });

    let calls = 0;
    globalThis.fetch = async () => {
      calls++;
      throw "string exception";
    };

    const promise = fetchWithRetry("https://example.com", undefined, "custom-ctx");

    const expectation = assert.rejects(
      async () => {
        await promise;
      },
      (err: Error) => {
        assert.equal(err.message, "custom-ctx: string exception");
        return true;
      },
    );

    for (let i = 0; i < 20; i++) {
      t.mock.timers.tick(1000);
      await new Promise((r) => setImmediate(r));
    }

    await expectation;
    assert.equal(calls, 3);
  });

  it("falls back to exponential backoff when Retry-After header is invalid or negative", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });

    for (const invalidHeader of ["invalid-header", "-10"]) {
      let calls = 0;
      globalThis.fetch = async () => {
        calls++;
        if (calls === 1) {
          return new Response("rate limited", {
            status: 429,
            headers: { "Retry-After": invalidHeader },
          });
        }
        return new Response("ok", { status: 200 });
      };

      const promise = fetchWithRetry("https://example.com", undefined, "test-ctx");
      for (let i = 0; i < 20; i++) {
        t.mock.timers.tick(1000);
        await new Promise((r) => setImmediate(r));
      }
      const res = await promise;

      assert.equal(calls, 2);
      assert.equal(res.status, 200);
    }
  });

  it("aborts and retries when fetch request exceeds custom timeoutMs option", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });

    let calls = 0;
    globalThis.fetch = async (input, init) => {
      calls++;
      const signal = init?.signal;
      return new Promise<Response>((resolve, reject) => {
        if (signal) {
          signal.addEventListener("abort", () => {
            const err = new Error("The operation was aborted");
            err.name = "AbortError";
            reject(err);
          });
        }
      });
    };

    const promise = fetchWithRetry("https://example.com", undefined, "timeout-ctx", {
      timeoutMs: 50,
    });

    const expectation = assert.rejects(
      async () => {
        await promise;
      },
      (err: Error) => {
        assert.equal(err.name, "AbortError");
        return true;
      },
    );

    for (let i = 0; i < 20; i++) {
      t.mock.timers.tick(100);
      await new Promise((r) => setImmediate(r));
    }

    await expectation;
    assert.equal(calls, 3);
  });

  it("passes request options such as method and custom headers to fetch", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });

    let receivedInit: RequestInit | undefined;
    globalThis.fetch = async (input, init) => {
      receivedInit = init;
      return new Response("ok", { status: 200 });
    };

    const promise = fetchWithRetry(
      "https://example.com/api",
      { method: "POST", headers: { "X-Custom-Header": "test-value" } },
      "options-ctx",
    );
    t.mock.timers.tick(1000);
    const res = await promise;

    assert.equal(res.status, 200);
    assert.equal(receivedInit?.method, "POST");
    assert.equal(
      (receivedInit?.headers as Record<string, string>)["X-Custom-Header"],
      "test-value",
    );
  });

  it("propagates abort error when caller aborts during retry delay after 500 response", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });

    const controller = new AbortController();
    let calls = 0;

    globalThis.fetch = async (input, init) => {
      calls++;
      const signal = init?.signal;
      if (signal?.aborted) {
        const err = new Error("The operation was aborted");
        err.name = "AbortError";
        throw err;
      }
      return new Response("server error", { status: 500 });
    };

    const promise = fetchWithRetry(
      "https://example.com",
      { signal: controller.signal },
      "abort-delay-ctx",
    );

    const expectation = assert.rejects(
      async () => {
        await promise;
      },
      (err: Error) => {
        assert.equal(err.name, "AbortError");
        return true;
      },
    );

    // Allow attempt 1 fetch to settle and enter sleep
    await new Promise((r) => setImmediate(r));

    // Abort caller signal during sleep
    controller.abort();

    for (let i = 0; i < 5; i++) {
      t.mock.timers.tick(1000);
      await new Promise((r) => setImmediate(r));
    }

    await expectation;
    assert.equal(calls, 2);
  });

  it("propagates abort error immediately when signal is pre-aborted before invocation", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });

    const controller = new AbortController();
    controller.abort();
    let calls = 0;

    globalThis.fetch = async (input, init) => {
      calls++;
      const signal = init?.signal;
      if (signal?.aborted) {
        const err = new Error("This operation was aborted");
        err.name = "AbortError";
        throw err;
      }
      return new Response("ok", { status: 200 });
    };

    const promise = fetchWithRetry(
      "https://example.com",
      { signal: controller.signal },
      "pre-aborted-ctx",
    );

    const expectation = assert.rejects(
      async () => {
        await promise;
      },
      (err: Error) => {
        assert.equal(err.name, "AbortError");
        return true;
      },
    );

    for (let i = 0; i < 5; i++) {
      t.mock.timers.tick(1000);
      await new Promise((r) => setImmediate(r));
    }

    await expectation;
    assert.equal(calls, 1);
  });

  it("propagates abort error when caller aborts during retry delay after network error", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });

    const controller = new AbortController();
    let calls = 0;

    globalThis.fetch = async (input, init) => {
      calls++;
      const signal = init?.signal;
      if (signal?.aborted) {
        const err = new Error("The operation was aborted");
        err.name = "AbortError";
        throw err;
      }
      throw new Error("Network failure");
    };

    const promise = fetchWithRetry(
      "https://example.com",
      { signal: controller.signal },
      "abort-net-delay-ctx",
    );

    const expectation = assert.rejects(
      async () => {
        await promise;
      },
      (err: Error) => {
        assert.equal(err.name, "AbortError");
        return true;
      },
    );

    // Allow attempt 1 catch block to run and enter sleep
    await new Promise((r) => setImmediate(r));

    // Abort caller signal during retry sleep
    controller.abort();

    for (let i = 0; i < 5; i++) {
      t.mock.timers.tick(1000);
      await new Promise((r) => setImmediate(r));
    }

    await expectation;
    assert.equal(calls, 2);
  });
});
