import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isSharedStateConfigured,
  isSharedStateWriteConfigured,
  invalidateSharedStateCache,
  installSharedStateMemoryStoreForTests,
  readSharedStateFile,
  readSharedStateFileRecord,
  preloadSharedStateFiles,
  listSharedStateFilenames,
  patchSharedStateFile,
} from "./sharedStateStore.js";

describe("sharedStateStore", () => {
  describe("configuration and cache operations when DATABASE_URL is unconfigured", () => {
    it("reports configuration status correctly when process.env.DATABASE_URL is missing", () => {
      const originalUrl = process.env.DATABASE_URL;
      delete process.env.DATABASE_URL;
      invalidateSharedStateCache();

      try {
        assert.strictEqual(isSharedStateConfigured(), false);
        assert.strictEqual(isSharedStateWriteConfigured(), false);
      } finally {
        if (originalUrl !== undefined) {
          process.env.DATABASE_URL = originalUrl;
        }
        invalidateSharedStateCache();
      }
    });

    it("throws an error for functions requiring database configuration when process.env.DATABASE_URL is missing", async () => {
      const originalUrl = process.env.DATABASE_URL;
      delete process.env.DATABASE_URL;
      invalidateSharedStateCache();

      try {
        await assert.rejects(
          async () => {
            await readSharedStateFile("test.json");
          },
          { message: "DATABASE_URL is not configured." },
        );

        await assert.rejects(
          async () => {
            await readSharedStateFileRecord("test.json");
          },
          { message: "DATABASE_URL is not configured." },
        );

        await assert.rejects(
          async () => {
            await preloadSharedStateFiles(["test.json"]);
          },
          { message: "DATABASE_URL is not configured." },
        );

        await assert.rejects(
          async () => {
            await listSharedStateFilenames();
          },
          { message: "DATABASE_URL is not configured." },
        );

        await assert.rejects(
          async () => {
            await patchSharedStateFile("test.json", "{}");
          },
          { message: "DATABASE_URL is not configured." },
        );
      } finally {
        if (originalUrl !== undefined) {
          process.env.DATABASE_URL = originalUrl;
        }
        invalidateSharedStateCache();
      }
    });
  });

  describe("memory store for tests (testStore)", () => {
    it("operates correctly with memory store for reads, lists, and patches", async () => {
      const initialFiles = {
        "file1.json": '{"a":1}',
        "file2.json": '{"b":2}',
      };

      const store = installSharedStateMemoryStoreForTests(initialFiles);

      try {
        assert.strictEqual(isSharedStateConfigured(), true);
        assert.strictEqual(isSharedStateWriteConfigured(), true);

        // Read existing file
        const content1 = await readSharedStateFile("file1.json");
        assert.strictEqual(content1, '{"a":1}');

        const record1 = await readSharedStateFileRecord("file1.json");
        assert.strictEqual(record1.exists, true);
        assert.strictEqual(record1.content, '{"a":1}');

        // Read cached file
        const cachedContent = await readSharedStateFile("file1.json");
        assert.strictEqual(cachedContent, '{"a":1}');

        // Read file with bypassCache option
        const bypassRecord = await readSharedStateFileRecord("file1.json", {
          bypassCache: true,
        });
        assert.strictEqual(bypassRecord.exists, true);
        assert.strictEqual(bypassRecord.content, '{"a":1}');

        // Read non-existent file
        const missingContent = await readSharedStateFile("missing.json");
        assert.strictEqual(missingContent, null);

        const missingRecord = await readSharedStateFileRecord("missing.json");
        assert.strictEqual(missingRecord.exists, false);
        assert.strictEqual(missingRecord.content, null);

        // List filenames
        const filenames = await listSharedStateFilenames();
        assert.deepStrictEqual(filenames, ["file1.json", "file2.json"]);

        // Patch file
        await patchSharedStateFile("file1.json", '{"a":10}');
        assert.strictEqual(store.getFile("file1.json"), '{"a":10}');
        assert.deepStrictEqual(store.patchBodies, ['{"a":10}']);

        const updatedContent = await readSharedStateFile("file1.json");
        assert.strictEqual(updatedContent, '{"a":10}');

        // Preload files returns immediately when testStore is active
        await preloadSharedStateFiles(["file1.json", "file2.json", "missing.json"]);
      } finally {
        store.dispose();
      }
    });

    it("restores store and invalidates cache when disposed", async () => {
      const store1 = installSharedStateMemoryStoreForTests({
        "file1.json": "initial",
      });

      assert.strictEqual(await readSharedStateFile("file1.json"), "initial");

      const store2 = installSharedStateMemoryStoreForTests({
        "file1.json": "overridden",
      });

      assert.strictEqual(await readSharedStateFile("file1.json"), "overridden");

      store2.dispose();
      assert.strictEqual(await readSharedStateFile("file1.json"), "initial");

      store1.dispose();
    });
  });

  describe("Postgres / SQL database behavior (mocked DATABASE_URL connection error)", () => {
    it("handles database error on preloadSharedStateFiles when DATABASE_URL is invalid", async () => {
      const originalUrl = process.env.DATABASE_URL;
      process.env.DATABASE_URL = "postgres://invalid:invalid@127.0.0.1:5432/invalid";
      invalidateSharedStateCache();

      try {
        await assert.rejects(
          async () => {
            await preloadSharedStateFiles(["movielist.json"]);
          },
        );
      } finally {
        if (originalUrl === undefined) {
          delete process.env.DATABASE_URL;
        } else {
          process.env.DATABASE_URL = originalUrl;
        }
        invalidateSharedStateCache();
      }
    });
  });
});
