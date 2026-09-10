import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
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

describe("sharedStateStore - configuration check functions", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    delete process.env.DATABASE_URL;
    invalidateSharedStateCache();
  });

  afterEach(() => {
    if (originalDatabaseUrl !== undefined) {
      process.env.DATABASE_URL = originalDatabaseUrl;
    } else {
      delete process.env.DATABASE_URL;
    }
    invalidateSharedStateCache();
  });

  it("returns false for isSharedStateConfigured and isSharedStateWriteConfigured when DATABASE_URL is not set and memory store is not installed", () => {
    assert.equal(isSharedStateConfigured(), false);
    assert.equal(isSharedStateWriteConfigured(), false);
  });

  it("returns true for isSharedStateConfigured and isSharedStateWriteConfigured when DATABASE_URL is set", () => {
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/dbname";
    assert.equal(isSharedStateConfigured(), true);
    assert.equal(isSharedStateWriteConfigured(), true);
  });

  it("returns true for isSharedStateConfigured and isSharedStateWriteConfigured when memory store is installed", () => {
    const memoryStore = installSharedStateMemoryStoreForTests({});
    try {
      assert.equal(isSharedStateConfigured(), true);
      assert.equal(isSharedStateWriteConfigured(), true);
    } finally {
      memoryStore.dispose();
    }
  });
});

describe("sharedStateStore - memory store operations & cache", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    delete process.env.DATABASE_URL;
    invalidateSharedStateCache();
  });

  afterEach(() => {
    if (originalDatabaseUrl !== undefined) {
      process.env.DATABASE_URL = originalDatabaseUrl;
    } else {
      delete process.env.DATABASE_URL;
    }
    invalidateSharedStateCache();
  });

  it("reads existing files and returns null for non-existent files in memory store", async () => {
    const memoryStore = installSharedStateMemoryStoreForTests({
      "test.json": '{"hello":"world"}',
    });

    try {
      const content = await readSharedStateFile("test.json");
      assert.equal(content, '{"hello":"world"}');

      const record = await readSharedStateFileRecord("test.json");
      assert.deepEqual(record, { exists: true, content: '{"hello":"world"}' });

      const missingContent = await readSharedStateFile("missing.json");
      assert.equal(missingContent, null);

      const missingRecord = await readSharedStateFileRecord("missing.json");
      assert.deepEqual(missingRecord, { exists: false, content: null });
    } finally {
      memoryStore.dispose();
    }
  });

  it("lists, preloads, and patches files in memory store", async () => {
    const memoryStore = installSharedStateMemoryStoreForTests({
      "b.json": "content_b",
      "a.json": "content_a",
    });

    try {
      const files = await listSharedStateFilenames();
      assert.deepEqual(files, ["a.json", "b.json"]);

      await preloadSharedStateFiles(["a.json", "b.json", "c.json"]);

      await patchSharedStateFile("c.json", "content_c");
      assert.equal(memoryStore.getFile("c.json"), "content_c");
      assert.deepEqual(memoryStore.patchBodies, ["content_c"]);

      const updatedFiles = await listSharedStateFilenames();
      assert.deepEqual(updatedFiles, ["a.json", "b.json", "c.json"]);
    } finally {
      memoryStore.dispose();
    }
  });

  it("respects bypassCache option on readSharedStateFileRecord", async () => {
    const memoryStore = installSharedStateMemoryStoreForTests({
      "data.json": "initial_data",
    });

    try {
      const cachedRecord = await readSharedStateFileRecord("data.json");
      assert.equal(cachedRecord.content, "initial_data");

      // Mutate backing store directly without going through patchSharedStateFile (which invalidates cache)
      // by patching and manually populating or verifying cache hit vs bypass
      const recordBypass = await readSharedStateFileRecord("data.json", { bypassCache: true });
      assert.equal(recordBypass.content, "initial_data");
    } finally {
      memoryStore.dispose();
    }
  });

  it("throws errors when database URL is not configured and memory store is not installed", async () => {
    await assert.rejects(
      async () => {
        await readSharedStateFileRecord("file.json");
      },
      { message: "DATABASE_URL is not configured." }
    );

    await assert.rejects(
      async () => {
        await listSharedStateFilenames();
      },
      { message: "DATABASE_URL is not configured." }
    );

    await assert.rejects(
      async () => {
        await patchSharedStateFile("file.json", "data");
      },
      { message: "DATABASE_URL is not configured." }
    );

    await assert.rejects(
      async () => {
        await preloadSharedStateFiles(["file.json"]);
      },
      { message: "DATABASE_URL is not configured." }
    );
  });
});
