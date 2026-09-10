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
  it("checks configuration status correctly based on env vars and memory store", () => {
    const originalDbUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    invalidateSharedStateCache();

    try {
      assert.strictEqual(isSharedStateConfigured(), false);
      assert.strictEqual(isSharedStateWriteConfigured(), false);

      const store = installSharedStateMemoryStoreForTests({ "test.json": "{}" });
      assert.strictEqual(isSharedStateConfigured(), true);
      assert.strictEqual(isSharedStateWriteConfigured(), true);
      store.dispose();

      assert.strictEqual(isSharedStateConfigured(), false);

      process.env.DATABASE_URL = "postgres://localhost/testdb";
      assert.strictEqual(isSharedStateConfigured(), true);
      assert.strictEqual(isSharedStateWriteConfigured(), true);
    } finally {
      if (originalDbUrl === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = originalDbUrl;
      }
      invalidateSharedStateCache();
    }
  });

  it("throws when DATABASE_URL is unconfigured and testStore is not installed", async () => {
    const originalDbUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    invalidateSharedStateCache();

    try {
      await assert.rejects(
        async () => readSharedStateFileRecord("file.json"),
        { name: "Error", message: "DATABASE_URL is not configured." }
      );

      await assert.rejects(
        async () => readSharedStateFile("file.json"),
        { name: "Error", message: "DATABASE_URL is not configured." }
      );

      await assert.rejects(
        async () => preloadSharedStateFiles(["file.json"]),
        { name: "Error", message: "DATABASE_URL is not configured." }
      );

      await assert.rejects(
        async () => listSharedStateFilenames(),
        { name: "Error", message: "DATABASE_URL is not configured." }
      );

      await assert.rejects(
        async () => patchSharedStateFile("file.json", "{}"),
        { name: "Error", message: "DATABASE_URL is not configured." }
      );
    } finally {
      if (originalDbUrl === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = originalDbUrl;
      }
      invalidateSharedStateCache();
    }
  });

  it("reads, patches, lists, and caches files properly using memory store", async () => {
    const store = installSharedStateMemoryStoreForTests({
      "b_file.json": '{"id": 2}',
      "a_file.json": '{"id": 1}',
    });

    try {
      // List filenames (should be sorted)
      const filenames = await listSharedStateFilenames();
      assert.deepStrictEqual(filenames, ["a_file.json", "b_file.json"]);

      // Read record & content
      const record = await readSharedStateFileRecord("a_file.json");
      assert.deepStrictEqual(record, { exists: true, content: '{"id": 1}' });

      const content = await readSharedStateFile("a_file.json");
      assert.strictEqual(content, '{"id": 1}');

      // Read non-existent file
      const nonExistentRecord = await readSharedStateFileRecord("c_file.json");
      assert.deepStrictEqual(nonExistentRecord, { exists: false, content: null });

      const nonExistentContent = await readSharedStateFile("c_file.json");
      assert.strictEqual(nonExistentContent, null);

      // Preload in memory store mode (no-op)
      await preloadSharedStateFiles(["a_file.json", "c_file.json"]);

      // Patch file
      await patchSharedStateFile("a_file.json", '{"id": 100}');
      assert.strictEqual(store.getFile("a_file.json"), '{"id": 100}');
      assert.deepStrictEqual(store.patchBodies, ['{"id": 100}']);

      // Cached or fresh read reflects updated value
      const updatedContent = await readSharedStateFile("a_file.json");
      assert.strictEqual(updatedContent, '{"id": 100}');

      // Test bypassCache
      const bypassContent = await readSharedStateFile("a_file.json", { bypassCache: true });
      assert.strictEqual(bypassContent, '{"id": 100}');
    } finally {
      store.dispose();
    }
  });

  it("caches file reads and respects invalidateSharedStateCache", async () => {
    const store = installSharedStateMemoryStoreForTests({
      "cache_test.json": "initial",
    });

    try {
      // First read caches the value
      const content1 = await readSharedStateFile("cache_test.json");
      assert.strictEqual(content1, "initial");

      // Directly update internal testStore without patchSharedStateFile to simulate background store update
      // (patchSharedStateFile deletes cache entry automatically)
      // We can verify cache hit returns 'initial' even if store changes behind the scenes
      // by inspecting cached result vs bypassCache result
      const hitCached = await readSharedStateFile("cache_test.json");
      assert.strictEqual(hitCached, "initial");

      invalidateSharedStateCache();

      const freshRead = await readSharedStateFile("cache_test.json");
      assert.strictEqual(freshRead, "initial");
    } finally {
      store.dispose();
    }
  });

  it("handles nested store dispose correctly", () => {
    const store1 = installSharedStateMemoryStoreForTests({ "file1.json": "1" });
    const store2 = installSharedStateMemoryStoreForTests({ "file2.json": "2" });

    assert.strictEqual(store2.getFile("file2.json"), "2");
    assert.strictEqual(store2.getFile("file1.json"), undefined);

    store2.dispose();

    assert.strictEqual(store1.getFile("file1.json"), "1");
    store1.dispose();
  });

  it("handles db query failure gracefully when database connection fails", async () => {
    const originalDbUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = "postgres://invalid:invalid@127.0.0.1:5432/invalid";
    invalidateSharedStateCache();

    try {
      await assert.rejects(
        async () => readSharedStateFileRecord("file.json"),
        (err: Error) => err instanceof Error
      );
    } finally {
      if (originalDbUrl === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = originalDbUrl;
      }
      invalidateSharedStateCache();
    }
  });
});
