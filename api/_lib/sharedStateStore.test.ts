import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isSharedStateConfigured,
  isSharedStateWriteConfigured,
  installSharedStateMemoryStoreForTests,
  invalidateSharedStateCache,
  readSharedStateFile,
  readSharedStateFileRecord,
  preloadSharedStateFiles,
  listSharedStateFilenames,
  patchSharedStateFile,
} from "./sharedStateStore.js";

describe("sharedStateStore", () => {
  describe("isSharedStateConfigured and isSharedStateWriteConfigured", () => {
    it("returns false when DATABASE_URL is not set and memory store is not installed", () => {
      const origDbUrl = process.env.DATABASE_URL;
      const origPgUrl = process.env.POSTGRES_URL;
      const origPrismaUrl = process.env.POSTGRES_PRISMA_URL;

      delete process.env.DATABASE_URL;
      delete process.env.POSTGRES_URL;
      delete process.env.POSTGRES_PRISMA_URL;

      try {
        assert.equal(isSharedStateConfigured(), false);
        assert.equal(isSharedStateWriteConfigured(), false);
      } finally {
        if (origDbUrl !== undefined) process.env.DATABASE_URL = origDbUrl;
        if (origPgUrl !== undefined) process.env.POSTGRES_URL = origPgUrl;
        if (origPrismaUrl !== undefined) process.env.POSTGRES_PRISMA_URL = origPrismaUrl;
      }
    });

    it("returns true when DATABASE_URL environment variable is set", () => {
      const origDbUrl = process.env.DATABASE_URL;
      process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/testdb";

      try {
        assert.equal(isSharedStateConfigured(), true);
        assert.equal(isSharedStateWriteConfigured(), true);
      } finally {
        if (origDbUrl !== undefined) {
          process.env.DATABASE_URL = origDbUrl;
        } else {
          delete process.env.DATABASE_URL;
        }
      }
    });

    it("returns true when POSTGRES_URL or POSTGRES_PRISMA_URL environment variable is set", () => {
      const origDbUrl = process.env.DATABASE_URL;
      const origPgUrl = process.env.POSTGRES_URL;

      delete process.env.DATABASE_URL;
      process.env.POSTGRES_URL = "postgres://user:pass@localhost:5432/testdb";

      try {
        assert.equal(isSharedStateConfigured(), true);
        assert.equal(isSharedStateWriteConfigured(), true);
      } finally {
        if (origDbUrl !== undefined) {
          process.env.DATABASE_URL = origDbUrl;
        } else {
          delete process.env.DATABASE_URL;
        }
        if (origPgUrl !== undefined) {
          process.env.POSTGRES_URL = origPgUrl;
        } else {
          delete process.env.POSTGRES_URL;
        }
      }
    });

    it("returns true when memory test store is installed even if DATABASE_URL is not set", () => {
      const origDbUrl = process.env.DATABASE_URL;
      const origPgUrl = process.env.POSTGRES_URL;
      const origPrismaUrl = process.env.POSTGRES_PRISMA_URL;

      delete process.env.DATABASE_URL;
      delete process.env.POSTGRES_URL;
      delete process.env.POSTGRES_PRISMA_URL;

      const store = installSharedStateMemoryStoreForTests({});

      try {
        assert.equal(isSharedStateConfigured(), true);
        assert.equal(isSharedStateWriteConfigured(), true);
      } finally {
        store.dispose();
        if (origDbUrl !== undefined) process.env.DATABASE_URL = origDbUrl;
        if (origPgUrl !== undefined) process.env.POSTGRES_URL = origPgUrl;
        if (origPrismaUrl !== undefined) process.env.POSTGRES_PRISMA_URL = origPrismaUrl;
      }
    });
  });

  describe("installSharedStateMemoryStoreForTests and in-memory operations", () => {
    it("allows reading, patching, preloading, and listing files in memory", async () => {
      const store = installSharedStateMemoryStoreForTests({
        "movies.json": '{"movies":[]}',
      });

      try {
        // Initial state check
        assert.equal(store.getFile("movies.json"), '{"movies":[]}');
        assert.equal(store.getFile("nonexistent.json"), undefined);

        // readSharedStateFile and readSharedStateFileRecord
        const content = await readSharedStateFile("movies.json");
        assert.equal(content, '{"movies":[]}');

        const record = await readSharedStateFileRecord("movies.json");
        assert.deepEqual(record, { exists: true, content: '{"movies":[]}' });

        const missingRecord = await readSharedStateFileRecord("missing.json");
        assert.deepEqual(missingRecord, { exists: false, content: null });

        // listSharedStateFilenames
        const filenamesBefore = await listSharedStateFilenames();
        assert.deepEqual(filenamesBefore, ["movies.json"]);

        // patchSharedStateFile
        const updatedContent = '{"movies":[{"id":1}]}';
        await patchSharedStateFile("movies.json", updatedContent);
        assert.equal(store.getFile("movies.json"), updatedContent);
        assert.deepEqual(store.patchBodies, [updatedContent]);

        const updatedRead = await readSharedStateFile("movies.json");
        assert.equal(updatedRead, updatedContent);

        // listSharedStateFilenames after patch
        await patchSharedStateFile("a_file.json", "test");
        const filenamesAfter = await listSharedStateFilenames();
        assert.deepEqual(filenamesAfter, ["a_file.json", "movies.json"]);

        // preloadSharedStateFiles does not throw when memory store is installed
        await preloadSharedStateFiles(["movies.json", "missing.json"]);
      } finally {
        store.dispose();
      }
    });

    it("restores previous store and invalidates cache when disposed", () => {
      const store1 = installSharedStateMemoryStoreForTests({ "file1.json": "content1" });
      const store2 = installSharedStateMemoryStoreForTests({ "file2.json": "content2" });

      assert.equal(store2.getFile("file2.json"), "content2");
      assert.equal(store2.getFile("file1.json"), undefined);

      store2.dispose();

      assert.equal(store1.getFile("file1.json"), "content1");
      assert.equal(store1.getFile("file2.json"), undefined);

      store1.dispose();
    });
  });

  describe("error handling when database is not configured", () => {
    it("throws an error for operations when database is not configured and memory store is absent", async () => {
      const origDbUrl = process.env.DATABASE_URL;
      const origPgUrl = process.env.POSTGRES_URL;
      const origPrismaUrl = process.env.POSTGRES_PRISMA_URL;

      delete process.env.DATABASE_URL;
      delete process.env.POSTGRES_URL;
      delete process.env.POSTGRES_PRISMA_URL;

      invalidateSharedStateCache();

      try {
        await assert.rejects(
          async () => readSharedStateFileRecord("file.json"),
          { message: "DATABASE_URL is not configured." },
        );

        await assert.rejects(
          async () => preloadSharedStateFiles(["file.json"]),
          { message: "DATABASE_URL is not configured." },
        );

        await assert.rejects(
          async () => listSharedStateFilenames(),
          { message: "DATABASE_URL is not configured." },
        );

        await assert.rejects(
          async () => patchSharedStateFile("file.json", "content"),
          { message: "DATABASE_URL is not configured." },
        );
      } finally {
        if (origDbUrl !== undefined) process.env.DATABASE_URL = origDbUrl;
        if (origPgUrl !== undefined) process.env.POSTGRES_URL = origPgUrl;
        if (origPrismaUrl !== undefined) process.env.POSTGRES_PRISMA_URL = origPrismaUrl;
      }
    });
  });
});
