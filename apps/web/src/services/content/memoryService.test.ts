import test from "node:test";
import assert from "node:assert/strict";
import {
  getMemories,
  addMemory,
  updateMemory,
  updateMemoriesBatch,
  deleteMemory,
  toggleMemoryPin,
} from "./index.ts";
import type { SharedMemory } from "../../shared/types.ts";

test("memoryService", async (t) => {
  const originalFetch = globalThis.fetch;

  let lastMutateBody: any = null;

  t.beforeEach(() => {
    lastMutateBody = null;
    t.mock.method(globalThis.crypto, "randomUUID", () => "1234-5678" as `${string}-${string}-${string}-${string}-${string}`);
  });

  t.afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  await t.test("getMemories fetches and sorts memories by createdAt descending", async (t) => {
    const mockMemories: SharedMemory[] = [
      { id: "1", movieId: "m1", movieTitle: "A", author: "User1", note: "n1", createdAt: "2023-01-02T00:00:00Z" },
      { id: "2", movieId: "m2", movieTitle: "B", author: "User2", note: "n2", createdAt: "2023-01-01T00:00:00Z" },
      { id: "3", movieId: "m3", movieTitle: "C", author: "User3", note: "n3", createdAt: "2023-01-03T00:00:00Z" },
    ];

    globalThis.fetch = t.mock.fn(async () => {
      return {
        ok: true,
        json: async () => ({
          data: mockMemories,
          version: "1",
          degraded: false,
        }),
      } as Response;
    });

    const result = await getMemories();

    assert.equal(result.length, 3);
    assert.equal(result[0].id, "3");
    assert.equal(result[1].id, "1");
    assert.equal(result[2].id, "2");
  });

  await t.test("addMemory creates a new memory and queues mutation", async (t) => {
    globalThis.fetch = t.mock.fn(async (url: string | URL | Request, options?: RequestInit) => {
      if (options?.method === "POST") {
        lastMutateBody = JSON.parse(options.body as string);
        return {
          ok: true,
          json: async () => ({
            applied: true,
            version: "2",
          }),
        } as Response;
      }
      return {
        ok: true,
        json: async () => ({
          data: [],
          version: "1",
          degraded: false,
        }),
      } as Response;
    });

    const result = await addMemory(
      "m1",
      "Movie 1",
      "Aaron",
      "Great movie",
      "2023-10-01T00:00:00Z",
      "http://example.com/img.jpg"
    );

    assert.equal(result.id, "memory-1234-5678");
    assert.equal(result.movieId, "m1");
    assert.equal(result.movieTitle, "Movie 1");

    assert.ok(lastMutateBody);
    assert.equal(lastMutateBody.op, "add_memory");
    assert.deepEqual(lastMutateBody.payload, {
      id: "memory-1234-5678",
      movieId: "m1",
      movieTitle: "Movie 1",
      note: "Great movie",
      imageUrl: "http://example.com/img.jpg",
    });
  });

  await t.test("updateMemory updates an existing memory", async (t) => {
    const mockMemories: SharedMemory[] = [
      { id: "memory-1", movieId: "m1", movieTitle: "A", author: "User1", note: "n1", createdAt: "2023-01-02T00:00:00Z" }
    ];

    globalThis.fetch = t.mock.fn(async (url: string | URL | Request, options?: RequestInit) => {
      if (options?.method === "POST") {
        lastMutateBody = JSON.parse(options.body as string);
        return {
          ok: true,
          json: async () => ({
            applied: true,
            version: "2",
          }),
        } as Response;
      }
      return {
        ok: true,
        json: async () => ({
          data: mockMemories,
          version: "1",
          degraded: false,
        }),
      } as Response;
    });

    const result = await updateMemory("memory-1", {
      note: "updated note",
      movieTitle: "Updated Title"
    });

    assert.equal(result.id, "memory-1");
    assert.equal(result.note, "updated note");
    assert.equal(result.movieTitle, "Updated Title");

    assert.ok(lastMutateBody);
    assert.equal(lastMutateBody.op, "update_memory");
    assert.deepEqual(lastMutateBody.payload, {
      memoryId: "memory-1",
      updates: {
        note: "updated note",
        movieTitle: "Updated Title"
      }
    });
  });

  await t.test("updateMemory throws if memory not found", async (t) => {
    globalThis.fetch = t.mock.fn(async () => {
      return {
        ok: true,
        json: async () => ({
          data: [],
          version: "1",
          degraded: false,
        }),
      } as Response;
    });

    await assert.rejects(
      async () => {
        await updateMemory("not-found", { note: "hello" });
      },
      /Memory not found/
    );
  });

  await t.test("updateMemoriesBatch updates multiple memories", async (t) => {
    const mockMemories: SharedMemory[] = [
      { id: "memory-1", movieId: "m1", movieTitle: "A", author: "User1", note: "n1", createdAt: "2023-01-02T00:00:00Z" },
      { id: "memory-2", movieId: "m2", movieTitle: "B", author: "User2", note: "n2", createdAt: "2023-01-01T00:00:00Z" }
    ];

    globalThis.fetch = t.mock.fn(async (url: string | URL | Request, options?: RequestInit) => {
      if (options?.method === "POST") {
        lastMutateBody = JSON.parse(options.body as string);
        return {
          ok: true,
          json: async () => ({
            applied: true,
            version: "2",
          }),
        } as Response;
      }
      return {
        ok: true,
        json: async () => ({
          data: mockMemories,
          version: "1",
          degraded: false,
        }),
      } as Response;
    });

    const result = await updateMemoriesBatch([
      { memoryId: "memory-1", updates: { note: "note1 updated" } },
      { memoryId: "memory-2", updates: { movieTitle: "Title B" } }
    ]);

    assert.equal(result.length, 2);

    assert.ok(lastMutateBody);
    assert.equal(lastMutateBody.op, "update_memories_batch");
  });

  await t.test("deleteMemory deletes an existing memory", async (t) => {
    const mockMemories: SharedMemory[] = [
      { id: "memory-1", movieId: "m1", movieTitle: "A", author: "User1", note: "n1", createdAt: "2023-01-02T00:00:00Z" }
    ];

    globalThis.fetch = t.mock.fn(async (url: string | URL | Request, options?: RequestInit) => {
      if (options?.method === "POST") {
        lastMutateBody = JSON.parse(options.body as string);
        return {
          ok: true,
          json: async () => ({
            applied: true,
            version: "2",
          }),
        } as Response;
      }
      return {
        ok: true,
        json: async () => ({
          data: mockMemories,
          version: "1",
          degraded: false,
        }),
      } as Response;
    });

    await deleteMemory("memory-1");

    assert.ok(lastMutateBody);
    assert.equal(lastMutateBody.op, "delete_memory");
    assert.deepEqual(lastMutateBody.payload, { memoryId: "memory-1" });
  });

  await t.test("deleteMemory throws if memory not found", async (t) => {
    globalThis.fetch = t.mock.fn(async () => {
      return {
        ok: true,
        json: async () => ({
          data: [],
          version: "1",
          degraded: false,
        }),
      } as Response;
    });

    await assert.rejects(
      async () => {
        await deleteMemory("not-found");
      },
      /Memory not found/
    );
  });

  await t.test("toggleMemoryPin toggles pin state of an existing memory", async (t) => {
    const mockMemories: SharedMemory[] = [
      { id: "memory-1", movieId: "m1", movieTitle: "A", author: "User1", note: "n1", isPinned: false, createdAt: "2023-01-02T00:00:00Z" }
    ];

    globalThis.fetch = t.mock.fn(async (url: string | URL | Request, options?: RequestInit) => {
      if (options?.method === "POST") {
        lastMutateBody = JSON.parse(options.body as string);
        return {
          ok: true,
          json: async () => ({
            applied: true,
            version: "2",
          }),
        } as Response;
      }
      return {
        ok: true,
        json: async () => ({
          data: mockMemories,
          version: "1",
          degraded: false,
        }),
      } as Response;
    });

    const result = await toggleMemoryPin("memory-1");

    assert.equal(result.isPinned, true);

    assert.ok(lastMutateBody);
    assert.equal(lastMutateBody.op, "toggle_memory_pin");
    assert.deepEqual(lastMutateBody.payload, { memoryId: "memory-1" });
  });

  await t.test("toggleMemoryPin throws if memory not found", async (t) => {
    globalThis.fetch = t.mock.fn(async () => {
      return {
        ok: true,
        json: async () => ({
          data: [],
          version: "1",
          degraded: false,
        }),
      } as Response;
    });

    await assert.rejects(
      async () => {
        await toggleMemoryPin("not-found");
      },
      /Memory not found/
    );
  });
});
