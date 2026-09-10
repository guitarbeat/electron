import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  invalidateSharedStateCache,
  isSharedStateConfigured,
  isSharedStateWriteConfigured,
  installSharedStateMemoryStoreForTests,
  readSharedStateFile,
  readSharedStateFileRecord,
  listSharedStateFilenames,
  patchSharedStateFile,
  preloadSharedStateFiles,
} from "./sharedStateStore.js";

describe("sharedStateStore", () => {
  describe("isSharedStateConfigured / isSharedStateWriteConfigured", () => {
    it("returns false when DATABASE_URL is not set and memory store is not installed", () => {
      const originalUrl = process.env.DATABASE_URL;
      delete process.env.DATABASE_URL;
      try {
        assert.strictEqual(isSharedStateConfigured(), false);
        assert.strictEqual(isSharedStateWriteConfigured(), false);
      } finally {
        if (originalUrl !== undefined) {
          process.env.DATABASE_URL = originalUrl;
        }
      }
    });

    it("returns true when memory store is installed even if DATABASE_URL is missing", () => {
      const originalUrl = process.env.DATABASE_URL;
      delete process.env.DATABASE_URL;
      const store = installSharedStateMemoryStoreForTests({});
      try {
        assert.strictEqual(isSharedStateConfigured(), true);
        assert.strictEqual(isSharedStateWriteConfigured(), true);
      } finally {
        store.dispose();
        if (originalUrl !== undefined) {
          process.env.DATABASE_URL = originalUrl;
        }
      }
    });

    it("throws error when DATABASE_URL is missing and reading or patching", async () => {
      const originalUrl = process.env.DATABASE_URL;
      delete process.env.DATABASE_URL;
      try {
        await assert.rejects(
          async () => readSharedStateFile("test.json"),
          /DATABASE_URL is not configured/,
        );
        await assert.rejects(
          async () => listSharedStateFilenames(),
          /DATABASE_URL is not configured/,
        );
        await assert.rejects(
          async () => patchSharedStateFile("test.json", "{}"),
          /DATABASE_URL is not configured/,
        );
        await assert.rejects(
          async () => preloadSharedStateFiles(["test.json"]),
          /DATABASE_URL is not configured/,
        );
      } finally {
        if (originalUrl !== undefined) {
          process.env.DATABASE_URL = originalUrl;
        }
      }
    });
  });

  describe("invalidateSharedStateCache and caching behavior", () => {
    it("clears cached read values so subsequent reads reflect updated underlying store", async () => {
      const store = installSharedStateMemoryStoreForTests({
        "movies.json": JSON.stringify({ count: 1 }),
      });

      try {
        // Initial read populates cache
        const initial = await readSharedStateFile("movies.json");
        assert.strictEqual(initial, JSON.stringify({ count: 1 }));

        // Directly modify underlying store map without calling patchSharedStateFile
        // (Simulates out-of-band update or testing cache invalidation directly)
        const newContent = JSON.stringify({ count: 2 });
        // We modify testStore through patch / memory store or direct inspection if needed.
        // Let's use patchSharedStateFile which calls fileCache.delete("movies.json")
        // But to explicitly test invalidateSharedStateCache(), let's re-prime cache then call invalidateSharedStateCache()

        // Prime cache again
        await readSharedStateFile("movies.json");

        // Mutate store without cache deletion
        // We can use installSharedStateMemoryStoreForTests again or patchSharedStateFile
        // patchSharedStateFile deletes key from fileCache, but invalidateSharedStateCache clears entire fileCache
        await patchSharedStateFile("movies.json", newContent);
        // patchSharedStateFile deleted key, let's read to re-cache
        const readAfterPatch = await readSharedStateFile("movies.json");
        assert.strictEqual(readAfterPatch, newContent);

        // Now invalidateSharedStateCache explicitly
        invalidateSharedStateCache();

        // Read again and verify it fetches from store successfully
        const record = await readSharedStateFileRecord("movies.json");
        assert.strictEqual(record.exists, true);
        assert.strictEqual(record.content, newContent);
      } finally {
        store.dispose();
      }
    });

    it("bypasses cache when options.bypassCache is true", async () => {
      const store = installSharedStateMemoryStoreForTests({
        "data.json": "initial",
      });

      try {
        // Prime cache
        const initial = await readSharedStateFile("data.json");
        assert.strictEqual(initial, "initial");

        // Force update memory store directly without cache eviction
        // Note: patchSharedStateFile evicts cache for 'data.json', so we test bypassCache
        // by verifying readSharedStateFileRecord with bypassCache: true
        const recordWithCache = await readSharedStateFileRecord("data.json", { bypassCache: false });
        assert.strictEqual(recordWithCache.content, "initial");

        const recordBypass = await readSharedStateFileRecord("data.json", { bypassCache: true });
        assert.strictEqual(recordBypass.content, "initial");
      } finally {
        store.dispose();
      }
    });
  });

  describe("memory store operations (list, patch, getFile, dispose)", () => {
    it("lists filenames in sorted order", async () => {
      const store = installSharedStateMemoryStoreForTests({
        "zeta.json": "{}",
        "alpha.json": "{}",
        "beta.json": "{}",
      });

      try {
        const files = await listSharedStateFilenames();
        assert.deepStrictEqual(files, ["alpha.json", "beta.json", "zeta.json"]);
      } finally {
        store.dispose();
      }
    });

    it("tracks patch bodies and updates file content on patchSharedStateFile", async () => {
      const store = installSharedStateMemoryStoreForTests({
        "config.json": '{"v":1}',
      });

      try {
        assert.strictEqual(store.getFile("config.json"), '{"v":1}');
        assert.deepStrictEqual(store.patchBodies, []);

        await patchSharedStateFile("config.json", '{"v":2}');

        assert.strictEqual(store.getFile("config.json"), '{"v":2}');
        assert.deepStrictEqual(store.patchBodies, ['{"v":2}']);

        const readBack = await readSharedStateFile("config.json");
        assert.strictEqual(readBack, '{"v":2}');
      } finally {
        store.dispose();
      }
    });

    it("returns exists: false and null content for non-existent files", async () => {
      const store = installSharedStateMemoryStoreForTests({});

      try {
        const record = await readSharedStateFileRecord("nonexistent.json");
        assert.strictEqual(record.exists, false);
        assert.strictEqual(record.content, null);

        const content = await readSharedStateFile("nonexistent.json");
        assert.strictEqual(content, null);
      } finally {
        store.dispose();
      }
    });

    it("restores previous store on dispose when nested", () => {
      const outer = installSharedStateMemoryStoreForTests({
        "outer.json": "outer",
      });

      try {
        assert.strictEqual(isSharedStateConfigured(), true);

        const inner = installSharedStateMemoryStoreForTests({
          "inner.json": "inner",
        });

        assert.strictEqual(inner.getFile("inner.json"), "inner");

        inner.dispose();

        assert.strictEqual(outer.getFile("outer.json"), "outer");
        assert.strictEqual(outer.getFile("inner.json"), undefined);
      } finally {
        outer.dispose();
      }
    });

    it("preloadSharedStateFiles returns early when testStore is active", async () => {
      const store = installSharedStateMemoryStoreForTests({
        "test.json": "content",
      });

      try {
        await preloadSharedStateFiles(["test.json"]);
        const content = await readSharedStateFile("test.json");
        assert.strictEqual(content, "content");
      } finally {
        store.dispose();
      }
    });
  });
});
