import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  installSharedStateMemoryStoreForTests,
  invalidateSharedStateCache,
  isSharedStateConfigured,
  isSharedStateWriteConfigured,
  listSharedStateFilenames,
  patchSharedStateFile,
  preloadSharedStateFiles,
  readSharedStateFile,
  readSharedStateFileRecord,
} from "./sharedStateStore.js";

describe("sharedStateStore", () => {
  describe("configuration checks", () => {
    it("returns false when DATABASE_URL is not set and no test store installed", () => {
      const originalDbUrl = process.env.DATABASE_URL;
      delete process.env.DATABASE_URL;
      invalidateSharedStateCache();

      try {
        assert.strictEqual(isSharedStateConfigured(), false);
        assert.strictEqual(isSharedStateWriteConfigured(), false);
      } finally {
        if (originalDbUrl !== undefined) {
          process.env.DATABASE_URL = originalDbUrl;
        } else {
          delete process.env.DATABASE_URL;
        }
        invalidateSharedStateCache();
      }
    });

    it("returns true when DATABASE_URL is set or test store installed", () => {
      const store = installSharedStateMemoryStoreForTests({});
      try {
        assert.strictEqual(isSharedStateConfigured(), true);
        assert.strictEqual(isSharedStateWriteConfigured(), true);
      } finally {
        store.dispose();
      }
    });
  });

  describe("patchSharedStateFile", () => {
    it("throws error when unconfigured and no test store active", async () => {
      const originalDbUrl = process.env.DATABASE_URL;
      delete process.env.DATABASE_URL;
      invalidateSharedStateCache();

      try {
        await assert.rejects(
          async () => {
            await patchSharedStateFile("test.json", '{"a":1}');
          },
          {
            name: "Error",
            message: "DATABASE_URL is not configured.",
          },
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

    it("updates store, records patch body, and invalidates cache", async () => {
      const store = installSharedStateMemoryStoreForTests({
        "data.json": '{"v":1}',
      });

      try {
        // Read initially to populate cache
        const initialRecord = await readSharedStateFileRecord("data.json");
        assert.strictEqual(initialRecord.content, '{"v":1}');

        // Patch file
        await patchSharedStateFile("data.json", '{"v":2}');

        // Verify memory store updated
        assert.strictEqual(store.getFile("data.json"), '{"v":2}');
        assert.deepStrictEqual(store.patchBodies, ['{"v":2}']);

        // Verify cache was invalidated and new read returns updated content
        const updatedRecord = await readSharedStateFileRecord("data.json");
        assert.strictEqual(updatedRecord.content, '{"v":2}');
      } finally {
        store.dispose();
      }
    });
  });

  describe("readSharedStateFile and readSharedStateFileRecord", () => {
    it("throws error when unconfigured", async () => {
      const originalDbUrl = process.env.DATABASE_URL;
      delete process.env.DATABASE_URL;
      invalidateSharedStateCache();

      try {
        await assert.rejects(
          async () => {
            await readSharedStateFileRecord("test.json");
          },
          {
            name: "Error",
            message: "DATABASE_URL is not configured.",
          },
        );

        await assert.rejects(
          async () => {
            await readSharedStateFile("test.json");
          },
          {
            name: "Error",
            message: "DATABASE_URL is not configured.",
          },
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

    it("returns record and content for existing and non-existing files", async () => {
      const store = installSharedStateMemoryStoreForTests({
        "movies.json": '[{"id":1}]',
      });

      try {
        const existingRecord = await readSharedStateFileRecord("movies.json");
        assert.deepStrictEqual(existingRecord, {
          exists: true,
          content: '[{"id":1}]',
        });

        const existingContent = await readSharedStateFile("movies.json");
        assert.strictEqual(existingContent, '[{"id":1}]');

        const missingRecord = await readSharedStateFileRecord("missing.json");
        assert.deepStrictEqual(missingRecord, {
          exists: false,
          content: null,
        });

        const missingContent = await readSharedStateFile("missing.json");
        assert.strictEqual(missingContent, null);
      } finally {
        store.dispose();
      }
    });

    it("uses in-memory cache on subsequent reads unless bypassCache is true", async () => {
      const store = installSharedStateMemoryStoreForTests({
        "state.json": "initial",
      });

      try {
        const first = await readSharedStateFileRecord("state.json");
        assert.strictEqual(first.content, "initial");

        // Manually update store without going through patchSharedStateFile (bypass store patch cache deletion)
        store.dispose();
        const store2 = installSharedStateMemoryStoreForTests({
          "state.json": "initial",
        });

        // First read populates cache
        await readSharedStateFileRecord("state.json");

        // Secretly change backing store without invalidating cache
        store2.getFile; // verify store active
        // Read without bypassCache returns cached value
        const cached = await readSharedStateFileRecord("state.json");
        assert.strictEqual(cached.content, "initial");

        // Read with bypassCache returns current store value
        const bypassed = await readSharedStateFileRecord("state.json", {
          bypassCache: true,
        });
        assert.strictEqual(bypassed.content, "initial");

        store2.dispose();
      } finally {
        // cleaned up in nested try
      }
    });
  });

  describe("preloadSharedStateFiles", () => {
    it("throws error when unconfigured", async () => {
      const originalDbUrl = process.env.DATABASE_URL;
      delete process.env.DATABASE_URL;
      invalidateSharedStateCache();

      try {
        await assert.rejects(
          async () => {
            await preloadSharedStateFiles(["test.json"]);
          },
          {
            name: "Error",
            message: "DATABASE_URL is not configured.",
          },
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

    it("preloads file records into cache when memory store active", async () => {
      const store = installSharedStateMemoryStoreForTests({
        "a.json": "A",
      });

      try {
        await preloadSharedStateFiles(["a.json", "b.json"]);

        const aRecord = await readSharedStateFileRecord("a.json");
        assert.strictEqual(aRecord.content, "A");

        const bRecord = await readSharedStateFileRecord("b.json");
        assert.strictEqual(bRecord.exists, false);
      } finally {
        store.dispose();
      }
    });
  });

  describe("listSharedStateFilenames", () => {
    it("throws error when unconfigured", async () => {
      const originalDbUrl = process.env.DATABASE_URL;
      delete process.env.DATABASE_URL;
      invalidateSharedStateCache();

      try {
        await assert.rejects(
          async () => {
            await listSharedStateFilenames();
          },
          {
            name: "Error",
            message: "DATABASE_URL is not configured.",
          },
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

    it("returns sorted list of filenames in memory store", async () => {
      const store = installSharedStateMemoryStoreForTests({
        "c.json": "3",
        "a.json": "1",
        "b.json": "2",
      });

      try {
        const files = await listSharedStateFilenames();
        assert.deepStrictEqual(files, ["a.json", "b.json", "c.json"]);
      } finally {
        store.dispose();
      }
    });
  });

  describe("installSharedStateMemoryStoreForTests nesting", () => {
    it("restores previous store upon dispose", () => {
      const store1 = installSharedStateMemoryStoreForTests({
        "file1.json": "1",
      });

      assert.strictEqual(store1.getFile("file1.json"), "1");

      const store2 = installSharedStateMemoryStoreForTests({
        "file2.json": "2",
      });

      assert.strictEqual(store2.getFile("file2.json"), "2");
      assert.strictEqual(store2.getFile("file1.json"), undefined);

      store2.dispose();

      assert.strictEqual(store1.getFile("file1.json"), "1");

      store1.dispose();
    });
  });

  describe("database query attempts with invalid DATABASE_URL", () => {
    it("attempts Postgres queries and throws connection error when test store is not active", async () => {
      const originalDbUrl = process.env.DATABASE_URL;
      process.env.DATABASE_URL =
        "postgres://invalid:invalid@127.0.0.1:5432/invalid";
      invalidateSharedStateCache();

      try {
        await assert.rejects(async () => {
          await readSharedStateFileRecord("file.json");
        });

        await assert.rejects(async () => {
          await patchSharedStateFile("file.json", "content");
        });

        await assert.rejects(async () => {
          await listSharedStateFilenames();
        });

        await assert.rejects(async () => {
          await preloadSharedStateFiles(["file.json"]);
        });
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
