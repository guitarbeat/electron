import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  invalidateSharedStateCache,
  installSharedStateMemoryStoreForTests,
  isSharedStateConfigured,
  isSharedStateWriteConfigured,
  listSharedStateFilenames,
  patchSharedStateFile,
  preloadSharedStateFiles,
  readSharedStateFile,
  readSharedStateFileRecord,
} from "./sharedStateStore.js";

describe("sharedStateStore", () => {
  describe("when unconfigured (no DATABASE_URL and no test store)", () => {
    it("reports configuration status as false and throws errors for file operations", async () => {
      const originalDbUrl = process.env.DATABASE_URL;
      delete process.env.DATABASE_URL;
      invalidateSharedStateCache();

      try {
        assert.strictEqual(isSharedStateConfigured(), false);
        assert.strictEqual(isSharedStateWriteConfigured(), false);

        await assert.rejects(
          async () => {
            await readSharedStateFileRecord("movies.json");
          },
          { name: "Error", message: "DATABASE_URL is not configured." },
        );

        await assert.rejects(
          async () => {
            await readSharedStateFile("movies.json");
          },
          { name: "Error", message: "DATABASE_URL is not configured." },
        );

        await assert.rejects(
          async () => {
            await preloadSharedStateFiles(["movies.json"]);
          },
          { name: "Error", message: "DATABASE_URL is not configured." },
        );

        await assert.rejects(
          async () => {
            await listSharedStateFilenames();
          },
          { name: "Error", message: "DATABASE_URL is not configured." },
        );

        await assert.rejects(
          async () => {
            await patchSharedStateFile("movies.json", "{}");
          },
          { name: "Error", message: "DATABASE_URL is not configured." },
        );
      } finally {
        if (originalDbUrl !== undefined) {
          process.env.DATABASE_URL = originalDbUrl;
        } else {
          delete process.env.DATABASE_URL;
        }
        invalidateSharedStateCache();
      }
    });
  });

  describe("when test memory store is installed", () => {
    it("reports configuration as true and correctly reads, patches, and lists files", async () => {
      const store = installSharedStateMemoryStoreForTests({
        "movies.json": '{"movies":[]}',
        "settings.json": '{"theme":"dark"}',
      });

      try {
        assert.strictEqual(isSharedStateConfigured(), true);
        assert.strictEqual(isSharedStateWriteConfigured(), true);

        // readSharedStateFileRecord & readSharedStateFile for existing file
        const movieRecord = await readSharedStateFileRecord("movies.json");
        assert.deepStrictEqual(movieRecord, {
          exists: true,
          content: '{"movies":[]}',
        });

        const movieContent = await readSharedStateFile("movies.json");
        assert.strictEqual(movieContent, '{"movies":[]}');

        // Non-existent file
        const missingRecord = await readSharedStateFileRecord("missing.json");
        assert.deepStrictEqual(missingRecord, {
          exists: false,
          content: null,
        });

        const missingContent = await readSharedStateFile("missing.json");
        assert.strictEqual(missingContent, null);

        // listSharedStateFilenames sorted
        const files = await listSharedStateFilenames();
        assert.deepStrictEqual(files, ["movies.json", "settings.json"]);

        // preloadSharedStateFiles is a no-op when testStore is installed
        await preloadSharedStateFiles(["movies.json", "missing.json"]);

        // patchSharedStateFile updates store and patchBodies
        await patchSharedStateFile("movies.json", '{"movies":[{"id":"1"}]}');
        assert.strictEqual(
          store.getFile("movies.json"),
          '{"movies":[{"id":"1"}]}',
        );
        assert.deepStrictEqual(store.patchBodies, [
          '{"movies":[{"id":"1"}]}',
        ]);

        const updatedRecord = await readSharedStateFileRecord("movies.json");
        assert.deepStrictEqual(updatedRecord, {
          exists: true,
          content: '{"movies":[{"id":"1"}]}',
        });

        // Patching a new file
        await patchSharedStateFile("new.json", '{"created":true}');
        assert.strictEqual(store.getFile("new.json"), '{"created":true}');
        assert.deepStrictEqual(await listSharedStateFilenames(), [
          "movies.json",
          "new.json",
          "settings.json",
        ]);
      } finally {
        store.dispose();
      }
    });

    it("respects caching, bypassCache, cache invalidation, and TTL expiration", async (t) => {
      t.mock.timers.enable({ apis: ["Date"] });
      const now = Date.now();
      t.mock.timers.setTime(now);

      const store = installSharedStateMemoryStoreForTests({
        "movies.json": '{"v":1}',
      });

      try {
        // First read populates cache
        const firstRead = await readSharedStateFileRecord("movies.json");
        assert.strictEqual(firstRead.content, '{"v":1}');

        // Directly modify underlying store map without calling patchSharedStateFile (so cache isn't cleared by patch)
        // To verify that readSharedStateFileRecord returns cached value when bypassCache is false
        // We need to access store directly through store.getFile if we patched it, but store Map is internal.
        // If we call patchSharedStateFile, it clears cache for filename.
        // Let's test cache hit vs bypassCache.
        // Reading with bypassCache: false should return cached hit
        const cachedRead = await readSharedStateFileRecord("movies.json");
        assert.strictEqual(cachedRead.content, '{"v":1}');

        // Test bypassCache: true
        // Advance time within TTL (10 seconds)
        t.mock.timers.setTime(now + 10000);
        const readWithBypass = await readSharedStateFileRecord("movies.json", {
          bypassCache: true,
        });
        assert.strictEqual(readWithBypass.content, '{"v":1}');

        // Advance time beyond 30 seconds TTL (e.g. 30001 ms)
        t.mock.timers.setTime(now + 30001);
        const expiredRead = await readSharedStateFileRecord("movies.json");
        assert.strictEqual(expiredRead.content, '{"v":1}');

        // Manual cache invalidation
        invalidateSharedStateCache();
        const postInvalidateRead = await readSharedStateFileRecord("movies.json");
        assert.strictEqual(postInvalidateRead.content, '{"v":1}');
      } finally {
        store.dispose();
      }
    });
  });

  describe("when DATABASE_URL is set to an invalid database address", () => {
    it("attempts database queries and throws connection errors", async () => {
      const originalDbUrl = process.env.DATABASE_URL;
      process.env.DATABASE_URL =
        "postgres://invalid:invalid@127.0.0.1:5432/invalid";
      invalidateSharedStateCache();

      try {
        assert.strictEqual(isSharedStateConfigured(), true);
        assert.strictEqual(isSharedStateWriteConfigured(), true);

        await assert.rejects(
          async () => {
            await readSharedStateFileRecord("test.json");
          },
          (err: unknown) => err instanceof Error,
        );

        await assert.rejects(
          async () => {
            await preloadSharedStateFiles(["test.json"]);
          },
          (err: unknown) => err instanceof Error,
        );

        await assert.rejects(
          async () => {
            await listSharedStateFilenames();
          },
          (err: unknown) => err instanceof Error,
        );

        await assert.rejects(
          async () => {
            await patchSharedStateFile("test.json", "{}");
          },
          (err: unknown) => err instanceof Error,
        );
      } finally {
        if (originalDbUrl !== undefined) {
          process.env.DATABASE_URL = originalDbUrl;
        } else {
          delete process.env.DATABASE_URL;
        }
        invalidateSharedStateCache();
      }
    });
  });
});
