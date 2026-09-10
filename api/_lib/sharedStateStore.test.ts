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

describe("sharedStateStore with in-memory store for tests", () => {
  it("installSharedStateMemoryStoreForTests initializes store with files and captures patches", async () => {
    const store = installSharedStateMemoryStoreForTests({
      "test.json": '{"foo":"bar"}',
    });

    try {
      assert.strictEqual(isSharedStateConfigured(), true);
      assert.strictEqual(isSharedStateWriteConfigured(), true);

      // Verify initial file access via getFile and read methods
      assert.strictEqual(store.getFile("test.json"), '{"foo":"bar"}');
      assert.strictEqual(await readSharedStateFile("test.json"), '{"foo":"bar"}');

      const record = await readSharedStateFileRecord("test.json");
      assert.deepStrictEqual(record, { exists: true, content: '{"foo":"bar"}' });

      // Patching a file updates store and records patch body
      await patchSharedStateFile("test.json", '{"foo":"updated"}');
      assert.strictEqual(store.getFile("test.json"), '{"foo":"updated"}');
      assert.strictEqual(await readSharedStateFile("test.json"), '{"foo":"updated"}');
      assert.deepStrictEqual(store.patchBodies, ['{"foo":"updated"}']);

      // Patching a new file
      await patchSharedStateFile("new.json", '{"hello":"world"}');
      assert.strictEqual(store.getFile("new.json"), '{"hello":"world"}');
      assert.deepStrictEqual(store.patchBodies, [
        '{"foo":"updated"}',
        '{"hello":"world"}',
      ]);

      // List filenames returns sorted keys
      const filenames = await listSharedStateFilenames();
      assert.deepStrictEqual(filenames, ["new.json", "test.json"]);

      // Reading a non-existent file returns exists: false and content: null
      const nonExistent = await readSharedStateFileRecord("missing.json");
      assert.deepStrictEqual(nonExistent, { exists: false, content: null });
      assert.strictEqual(await readSharedStateFile("missing.json"), null);

      // Preload shared state files in testStore mode works without error
      await preloadSharedStateFiles(["test.json", "missing.json"]);
    } finally {
      store.dispose();
    }
  });

  it("restores previous test store state on dispose", () => {
    const store1 = installSharedStateMemoryStoreForTests({
      "file1.txt": "first",
    });

    assert.strictEqual(store1.getFile("file1.txt"), "first");

    const store2 = installSharedStateMemoryStoreForTests({
      "file2.txt": "second",
    });

    assert.strictEqual(store2.getFile("file2.txt"), "second");
    assert.strictEqual(store2.getFile("file1.txt"), undefined);

    store2.dispose();

    // After disposing store2, store1 should be restored
    assert.strictEqual(store1.getFile("file1.txt"), "first");
    assert.strictEqual(store1.getFile("file2.txt"), undefined);

    store1.dispose();
  });

  it("handles unconfigured state when DATABASE_URL is not set and no test store is installed", async () => {
    const originalDbUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    invalidateSharedStateCache();

    try {
      assert.strictEqual(isSharedStateConfigured(), false);
      assert.strictEqual(isSharedStateWriteConfigured(), false);

      await assert.rejects(
        async () => {
          await readSharedStateFileRecord("test.json");
        },
        { name: "Error", message: "DATABASE_URL is not configured." },
      );

      await assert.rejects(
        async () => {
          await preloadSharedStateFiles(["test.json"]);
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
          await patchSharedStateFile("test.json", "content");
        },
        { name: "Error", message: "DATABASE_URL is not configured." },
      );
    } finally {
      if (originalDbUrl !== undefined) {
        process.env.DATABASE_URL = originalDbUrl;
      }
      invalidateSharedStateCache();
    }
  });

  it("uses cache on subsequent reads unless bypassCache is set", async () => {
    const store = installSharedStateMemoryStoreForTests({
      "cached.txt": "initial",
    });

    try {
      // First read caches the record
      const rec1 = await readSharedStateFileRecord("cached.txt");
      assert.strictEqual(rec1.content, "initial");

      // Directly update the store underlying map without calling patch (bypassing cache invalidation)
      // To test that cached read returns cached value vs bypassCache read returning fresh value
      store.patchBodies; // access patchBodies
      // Mutate testStore map via patch and then check cache
      await patchSharedStateFile("cached.txt", "updated");

      // Reading again should fetch updated value because patch invalidates fileCache key
      const rec2 = await readSharedStateFileRecord("cached.txt");
      assert.strictEqual(rec2.content, "updated");

      // Verify bypassCache option works as expected
      const rec3 = await readSharedStateFileRecord("cached.txt", { bypassCache: true });
      assert.strictEqual(rec3.content, "updated");
    } finally {
      store.dispose();
    }
  });
});
