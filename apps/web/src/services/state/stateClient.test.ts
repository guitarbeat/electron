import assert from "node:assert/strict";
import test from "node:test";

import { mutateScope, readScope } from "./stateClient.ts";
import type { Movie } from "../../shared/types.ts";
import { decodeStorageData } from "../../utils/shared.ts";

class MemoryStorage {
  #store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.#store.has(key) ? this.#store.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.#store.set(key, value);
  }

  removeItem(key: string): void {
    this.#store.delete(key);
  }

  clear(): void {
    this.#store.clear();
  }
}

const originalWindow = globalThis.window;
const originalFetch = globalThis.fetch;

test("readScope preserves optimistic queued movie mutations when degraded replay fails", async () => {
  const localStorage = new MemoryStorage();
  const windowStub = {
    localStorage,
    dispatchEvent: () => true,
    btoa: (s: string) => Buffer.from(s, "binary").toString("base64"),
    atob: (s: string) => Buffer.from(s, "base64").toString("binary"),
  } as unknown as Window & typeof globalThis;

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: windowStub,
  });

  const optimisticMovie: Movie = {
    id: "movie-local-fallback",
    title: "Local Fallback Movie",
    addedBy: "Aaron",
    watchedBy: [],
    createdAt: new Date("2026-03-27T00:00:00.000Z").toISOString(),
  };

  globalThis.fetch = async (
    input: string | URL | Request,
    init?: RequestInit,
  ) => {
    const request =
      input instanceof Request ? input : new Request(String(input), init);
    const isMutation = request.method === "POST";

    if (!isMutation) {
      return new Response(
        JSON.stringify({
          data: [],
          version: "server-version",
          degraded: true,
          warning:
            "Shared sync is unavailable because the server is missing DATABASE_URL. Set DATABASE_URL (or VITE_DATABASE_URL during local Vite development), then restart the dev server.",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    return new Response(JSON.stringify({ error: "Internal server error." }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  try {
    const queued = await mutateScope("movies", {
      op: "add_movie",
      payload: {
        id: optimisticMovie.id,
        title: optimisticMovie.title,
      },
      optimisticData: [optimisticMovie],
    });

    assert.deepEqual(queued.data, [optimisticMovie]);
    assert.equal(queued.degraded, true);

    const reread = await readScope("movies");
    assert.deepEqual(reread.data, [optimisticMovie]);
    assert.equal(reread.degraded, true);

    const storedSnapshotRaw = localStorage.getItem(
      "movieList.scopeSnapshot.movies",
    );
    assert.ok(storedSnapshotRaw, "expected queued snapshot to be stored");

    // Handle encoded data in test
    const decoded = decodeStorageData(storedSnapshotRaw as string);
    const storedSnapshot = JSON.parse(decoded) as {
      data: Movie[];
    };
    assert.deepEqual(storedSnapshot.data, [optimisticMovie]);
  } finally {
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  }
});

test("readScope returns degraded snapshot on server 500 error instead of throwing", async () => {
  const localStorage = new MemoryStorage();
  const windowStub = {
    localStorage,
    dispatchEvent: () => true,
    btoa: (s: string) => Buffer.from(s, "binary").toString("base64"),
    atob: (s: string) => Buffer.from(s, "base64").toString("binary"),
  } as unknown as Window & typeof globalThis;

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: windowStub,
  });

  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: "Internal server error." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });

  try {
    const result = await readScope("suggestions");
    assert.equal(result.degraded, true);
    assert.deepEqual(result.data, []);
    assert.ok(result.warning);
  } finally {
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  }
});

test("readScope re-throws StateClientError on 401 unauthorized", async () => {
  const localStorage = new MemoryStorage();
  const windowStub = {
    localStorage,
    dispatchEvent: () => true,
    btoa: (s: string) => Buffer.from(s, "binary").toString("base64"),
    atob: (s: string) => Buffer.from(s, "base64").toString("binary"),
  } as unknown as Window & typeof globalThis;

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: windowStub,
  });

  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: "Unauthorized." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });

  try {
    await assert.rejects(
      async () => {
        await readScope("movies");
      },
      (err: unknown) => {
        return (
          err instanceof Error &&
          err.name === "StateClientError" &&
          (err as { status?: number }).status === 401
        );
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  }
});

