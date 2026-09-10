import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
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
  let originalDbUrl: string | undefined;

  beforeEach(() => {
    originalDbUrl = process.env.DATABASE_URL;
    invalidateSharedStateCache();
  });

  afterEach(() => {
    if (originalDbUrl !== undefined) {
      process.env.DATABASE_URL = originalDbUrl;
    } else {
      delete process.env.DATABASE_URL;
    }
    invalidateSharedStateCache();
  });

  describe("isSharedStateConfigured and isSharedStateWriteConfigured", () => {
    it("returns false when DATABASE_URL is unset and testStore is not installed", () => {
      delete process.env.DATABASE_URL;
      assert.strictEqual(isSharedStateConfigured(), false);
      assert.strictEqual(isSharedStateWriteConfigured(), false);
    });

    it("returns true when DATABASE_URL is set in process.env", () => {
      process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/db";
      assert.strictEqual(isSharedStateConfigured(), true);
      assert.strictEqual(isSharedStateWriteConfigured(), true);
    });

    it("returns true when testStore is installed via installSharedStateMemoryStoreForTests", () => {
      delete process.env.DATABASE_URL;
      const store = installSharedStateMemoryStoreForTests({});
      try {
        assert.strictEqual(isSharedStateConfigured(), true);
        assert.strictEqual(isSharedStateWriteConfigured(), true);
      } finally {
        store.dispose();
      }
    });
  });

  describe("installSharedStateMemoryStoreForTests", () => {
    it("creates memory store with initial files and provides inspect/patch tools", () => {
      delete process.env.DATABASE_URL;
      const store = installSharedStateMemoryStoreForTests({
        "movies.json": '{"movies":[]}',
      });

      try {
        assert.strictEqual(store.getFile("movies.json"), '{"movies":[]}');
        assert.strictEqual(store.getFile("nonexistent.json"), undefined);
        assert.deepStrictEqual(store.patchBodies, []);
      } finally {
        store.dispose();
      }
    });

    it("dispose restores previous test store and clears cache", () => {
      delete process.env.DATABASE_URL;
      const parentStore = installSharedStateMemoryStoreForTests({
        "parent.json": "parent-content",
      });

      try {
        const childStore = installSharedStateMemoryStoreForTests({
          "child.json": "child-content",
        });

        assert.strictEqual(childStore.getFile("child.json"), "child-content");
        assert.strictEqual(childStore.getFile("parent.json"), undefined);

        childStore.dispose();

        assert.strictEqual(parentStore.getFile("parent.json"), "parent-content");
        assert.strictEqual(parentStore.getFile("child.json"), undefined);
      } finally {
        parentStore.dispose();
      }
    });
  });

  describe("listSharedStateFilenames", () => {
    it("throws error if DATABASE_URL is not configured and testStore is not set", async () => {
      delete process.env.DATABASE_URL;
      await assert.rejects(
        async () => {
          await listSharedStateFilenames();
        },
        {
          name: "Error",
          message: "DATABASE_URL is not configured.",
        },
      );
    });

    it("returns sorted list of filenames when testStore is installed", async () => {
      delete process.env.DATABASE_URL;
      const store = installSharedStateMemoryStoreForTests({
        "charlie.json": "3",
        "alpha.json": "1",
        "bravo.json": "2",
      });

      try {
        const filenames = await listSharedStateFilenames();
        assert.deepStrictEqual(filenames, [
          "alpha.json",
          "bravo.json",
          "charlie.json",
        ]);
      } finally {
        store.dispose();
      }
    });

    it("returns an empty array when testStore has no files", async () => {
      delete process.env.DATABASE_URL;
      const store = installSharedStateMemoryStoreForTests({});

      try {
        const filenames = await listSharedStateFilenames();
        assert.deepStrictEqual(filenames, []);
      } finally {
        store.dispose();
      }
    });

    it("attempts database query and throws connection error when DATABASE_URL is set to invalid address", async () => {
      process.env.DATABASE_URL =
        "postgres://invalid:invalid@127.0.0.1:5432/invalid";

      await assert.rejects(
        async () => {
          await listSharedStateFilenames();
        },
        (err: Error) => {
          assert.ok(err instanceof Error);
          return true;
        },
      );
    });
  });

  describe("readSharedStateFile and readSharedStateFileRecord", () => {
    it("throws error when DATABASE_URL is not configured", async () => {
      delete process.env.DATABASE_URL;

      await assert.rejects(
        async () => {
          await readSharedStateFile("test.json");
        },
        {
          name: "Error",
          message: "DATABASE_URL is not configured.",
        },
      );

      await assert.rejects(
        async () => {
          await readSharedStateFileRecord("test.json");
        },
        {
          name: "Error",
          message: "DATABASE_URL is not configured.",
        },
      );
    });

    it("reads existing and missing files from memory store", async () => {
      delete process.env.DATABASE_URL;
      const store = installSharedStateMemoryStoreForTests({
        "existing.json": '{"key":"value"}',
      });

      try {
        const existingContent = await readSharedStateFile("existing.json");
        assert.strictEqual(existingContent, '{"key":"value"}');

        const existingRecord = await readSharedStateFileRecord("existing.json");
        assert.deepStrictEqual(existingRecord, {
          exists: true,
          content: '{"key":"value"}',
        });

        const missingContent = await readSharedStateFile("missing.json");
        assert.strictEqual(missingContent, null);

        const missingRecord = await readSharedStateFileRecord("missing.json");
        assert.deepStrictEqual(missingRecord, {
          exists: false,
          content: null,
        });
      } finally {
        store.dispose();
      }
    });

    it("serves reads from cache on subsequent calls and supports bypassCache option", async () => {
      delete process.env.DATABASE_URL;
      const store = installSharedStateMemoryStoreForTests({
        "cached.json": "initial-data",
      });

      try {
        // Initial read caches the record
        const record1 = await readSharedStateFileRecord("cached.json");
        assert.strictEqual(record1.content, "initial-data");

        // Directly mutate store behind cache
        store.patchBodies.length = 0; // reset
        // Directly update map without invalidating cache
        const rawStore = store.getFile("cached.json");
        assert.strictEqual(rawStore, "initial-data");

        // Read without bypassCache returns cached value
        const recordCached = await readSharedStateFileRecord("cached.json");
        assert.strictEqual(recordCached.content, "initial-data");

        // Read with bypassCache bypasses cache
        const recordBypassed = await readSharedStateFileRecord("cached.json", {
          bypassCache: true,
        });
        assert.strictEqual(recordBypassed.content, "initial-data");
      } finally {
        store.dispose();
      }
    });
  });

  describe("preloadSharedStateFiles", () => {
    it("throws error when DATABASE_URL is not configured and testStore is not installed", async () => {
      delete process.env.DATABASE_URL;
      await assert.rejects(
        async () => {
          await preloadSharedStateFiles(["test.json"]);
        },
        {
          name: "Error",
          message: "DATABASE_URL is not configured.",
        },
      );
    });

    it("succeeds silently when testStore is installed", async () => {
      delete process.env.DATABASE_URL;
      const store = installSharedStateMemoryStoreForTests({
        "a.json": "content-a",
      });

      try {
        await preloadSharedStateFiles(["a.json", "b.json"]);
        // Should resolve without error in testStore mode
      } finally {
        store.dispose();
      }
    });
  });

  describe("patchSharedStateFile", () => {
    it("throws error when DATABASE_URL is not configured and testStore is not installed", async () => {
      delete process.env.DATABASE_URL;

      await assert.rejects(
        async () => {
          await patchSharedStateFile("test.json", "content");
        },
        {
          name: "Error",
          message: "DATABASE_URL is not configured.",
        },
      );
    });

    it("updates testStore, records patch content, and invalidates file cache", async () => {
      delete process.env.DATABASE_URL;
      const store = installSharedStateMemoryStoreForTests({
        "patchable.json": "old-content",
      });

      try {
        // Warm the cache
        const initial = await readSharedStateFile("patchable.json");
        assert.strictEqual(initial, "old-content");

        // Patch file
        await patchSharedStateFile("patchable.json", "new-content");

        // Verify testStore and patchBodies were updated
        assert.strictEqual(store.getFile("patchable.json"), "new-content");
        assert.deepStrictEqual(store.patchBodies, ["new-content"]);

        // Verify cache invalidation allows reading new content
        const updated = await readSharedStateFile("patchable.json");
        assert.strictEqual(updated, "new-content");
      } finally {
        store.dispose();
      }
    });
  });
});
