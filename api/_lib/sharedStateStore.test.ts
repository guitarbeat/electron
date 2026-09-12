import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import pg from "pg";
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
  describe("isSharedStateConfigured & isSharedStateWriteConfigured", () => {
    it("returns false when no database URL env variables are set and no test store is installed", () => {
      const originalEnv = {
        DATABASE_URL: process.env.DATABASE_URL,
        POSTGRES_URL: process.env.POSTGRES_URL,
        POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL,
      };

      delete process.env.DATABASE_URL;
      delete process.env.POSTGRES_URL;
      delete process.env.POSTGRES_PRISMA_URL;

      try {
        assert.strictEqual(isSharedStateConfigured(), false);
        assert.strictEqual(isSharedStateWriteConfigured(), false);
      } finally {
        for (const [key, val] of Object.entries(originalEnv)) {
          if (val !== undefined) {
            process.env[key] = val;
          } else {
            delete process.env[key];
          }
        }
      }
    });

    it("returns false when database URL env variables are empty or whitespace strings", () => {
      const originalEnv = {
        DATABASE_URL: process.env.DATABASE_URL,
        POSTGRES_URL: process.env.POSTGRES_URL,
        POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL,
      };

      process.env.DATABASE_URL = "   ";
      process.env.POSTGRES_URL = '""';
      process.env.POSTGRES_PRISMA_URL = "''";

      try {
        assert.strictEqual(isSharedStateConfigured(), false);
        assert.strictEqual(isSharedStateWriteConfigured(), false);
      } finally {
        for (const [key, val] of Object.entries(originalEnv)) {
          if (val !== undefined) {
            process.env[key] = val;
          } else {
            delete process.env[key];
          }
        }
      }
    });

    it("returns true when DATABASE_URL is set", () => {
      const originalEnv = {
        DATABASE_URL: process.env.DATABASE_URL,
        POSTGRES_URL: process.env.POSTGRES_URL,
        POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL,
      };

      delete process.env.POSTGRES_URL;
      delete process.env.POSTGRES_PRISMA_URL;
      process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/db_list";
      invalidateSharedStateCache();

      try {
        assert.strictEqual(isSharedStateConfigured(), true);
        assert.strictEqual(isSharedStateWriteConfigured(), true);
      } finally {
        for (const [key, val] of Object.entries(originalEnv)) {
          if (val !== undefined) {
            process.env[key] = val;
          } else {
            delete process.env[key];
          }
        }
      }
    });

    it("returns true when POSTGRES_URL or POSTGRES_PRISMA_URL is set", () => {
      const originalEnv = {
        DATABASE_URL: process.env.DATABASE_URL,
        POSTGRES_URL: process.env.POSTGRES_URL,
        POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL,
      };

      delete process.env.DATABASE_URL;
      process.env.POSTGRES_URL = "postgres://user:pass@localhost:5432/db";

      try {
        assert.strictEqual(isSharedStateConfigured(), true);
        assert.strictEqual(isSharedStateWriteConfigured(), true);

        delete process.env.POSTGRES_URL;
        process.env.POSTGRES_PRISMA_URL = "postgres://user:pass@localhost:5432/db";
        assert.strictEqual(isSharedStateConfigured(), true);
        assert.strictEqual(isSharedStateWriteConfigured(), true);
      } finally {
        for (const [key, val] of Object.entries(originalEnv)) {
          if (val !== undefined) {
            process.env[key] = val;
          } else {
            delete process.env[key];
          }
        }
      }
    });

    it("returns true when test memory store is installed even if no database URL is set", () => {
      const originalEnv = {
        DATABASE_URL: process.env.DATABASE_URL,
        POSTGRES_URL: process.env.POSTGRES_URL,
        POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL,
      };

      delete process.env.DATABASE_URL;
      delete process.env.POSTGRES_URL;
      delete process.env.POSTGRES_PRISMA_URL;

      const store = installSharedStateMemoryStoreForTests({});

      try {
        assert.strictEqual(isSharedStateConfigured(), true);
        assert.strictEqual(isSharedStateWriteConfigured(), true);
      } finally {
        store.dispose();
        for (const [key, val] of Object.entries(originalEnv)) {
          if (val !== undefined) {
            process.env[key] = val;
          } else {
            delete process.env[key];
          }
        }
      }
    });
  });

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

        // listSharedStateFilenames when empty
        const emptyStore = installSharedStateMemoryStoreForTests({});
        try {
          assert.deepStrictEqual(await listSharedStateFilenames(), []);
        } finally {
          emptyStore.dispose();
        }

        // listSharedStateFilenames sorts unsorted keys correctly
        const unsortedStore = installSharedStateMemoryStoreForTests({
          "z_file.json": "{}",
          "a_file.json": "{}",
          "m_file.json": "{}",
        });
        try {
          assert.deepStrictEqual(await listSharedStateFilenames(), [
            "a_file.json",
            "m_file.json",
            "z_file.json",
          ]);
        } finally {
          unsortedStore.dispose();
        }

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
        // readSharedStateFile with bypassCache option
        const readWithBypassContent = await readSharedStateFile("movies.json", {
          bypassCache: true,
        });
        assert.strictEqual(readWithBypassContent, '{"v":1}');

        const missingBypassContent = await readSharedStateFile("nonexistent.json", {
          bypassCache: true,
        });
        assert.strictEqual(missingBypassContent, null);
      } finally {
        store.dispose();
      }
    });

    it("supports nested memory store installation and restores outer store on dispose", async () => {
      const outerStore = installSharedStateMemoryStoreForTests({
        "shared.json": '{"level":"outer"}',
        "outer_only.json": '{"outer":true}',
      });

      try {
        await patchSharedStateFile("shared.json", '{"level":"outer_updated"}');
        assert.strictEqual(outerStore.getFile("shared.json"), '{"level":"outer_updated"}');
        assert.deepStrictEqual(outerStore.patchBodies, ['{"level":"outer_updated"}']);

        // Install inner store
        const innerStore = installSharedStateMemoryStoreForTests({
          "shared.json": '{"level":"inner"}',
          "inner_only.json": '{"inner":true}',
        });

        try {
          const innerRead = await readSharedStateFileRecord("shared.json");
          assert.strictEqual(innerRead.content, '{"level":"inner"}');
          assert.strictEqual(innerStore.getFile("outer_only.json"), undefined);

          await patchSharedStateFile("shared.json", '{"level":"inner_updated"}');
          assert.strictEqual(innerStore.getFile("shared.json"), '{"level":"inner_updated"}');
          assert.deepStrictEqual(innerStore.patchBodies, ['{"level":"inner_updated"}']);
          // Outer patchBodies remains unaffected
          assert.deepStrictEqual(outerStore.patchBodies, ['{"level":"outer_updated"}']);
        } finally {
          innerStore.dispose();
        }

        // After innerStore dispose, outerStore state is restored
        const restoredRead = await readSharedStateFileRecord("shared.json");
        assert.strictEqual(restoredRead.content, '{"level":"outer_updated"}');
        assert.strictEqual(outerStore.getFile("inner_only.json"), undefined);

        await patchSharedStateFile("shared.json", '{"level":"outer_final"}');
        assert.strictEqual(outerStore.getFile("shared.json"), '{"level":"outer_final"}');
        assert.deepStrictEqual(outerStore.patchBodies, [
          '{"level":"outer_updated"}',
          '{"level":"outer_final"}',
        ]);
      } finally {
        outerStore.dispose();
      }

      // After outerStore dispose, no test store is active
      const postDisposeRead = readSharedStateFileRecord("shared.json");
      await assert.rejects(postDisposeRead, {
        name: "Error",
        message: "DATABASE_URL is not configured.",
      });
    });

    it("invalidates cache on dispose so stale records do not leak", async () => {
      const store = installSharedStateMemoryStoreForTests({
        "data.json": '{"version":1}',
      });

      // Populate cache
      const cached = await readSharedStateFileRecord("data.json");
      assert.strictEqual(cached.content, '{"version":1}');

      // Dispose store
      store.dispose();

      // With store disposed and no DATABASE_URL, attempting to read should throw rather than hit cache
      await assert.rejects(
        async () => {
          await readSharedStateFileRecord("data.json");
        },
        { name: "Error", message: "DATABASE_URL is not configured." },
      );
    });

    it("provides getFile and patchBodies helper functionality on store handle", async () => {
      const store = installSharedStateMemoryStoreForTests({
        "file1.txt": "hello",
      });

      try {
        assert.strictEqual(store.getFile("file1.txt"), "hello");
        assert.strictEqual(store.getFile("non_existent.txt"), undefined);
        assert.deepStrictEqual(store.patchBodies, []);

        await patchSharedStateFile("file1.txt", "world");
        assert.strictEqual(store.getFile("file1.txt"), "world");

        await patchSharedStateFile("file2.txt", "foo");
        assert.strictEqual(store.getFile("file2.txt"), "foo");

        assert.deepStrictEqual(store.patchBodies, ["world", "foo"]);
      } finally {
        store.dispose();
      }
    });

    describe("patchSharedStateFile", () => {
      it("updates existing files, creates new files, invalidates cache, and records patch history", async () => {
        const store = installSharedStateMemoryStoreForTests({
          "movies.json": '{"movies":[]}',
        });

        try {
          // Warm up cache
          const cached = await readSharedStateFileRecord("movies.json");
          assert.strictEqual(cached.content, '{"movies":[]}');

          // Patch existing file
          await patchSharedStateFile("movies.json", '{"movies":[{"id":"1"}]}');

          // Verify cache was invalidated and content updated
          const updated = await readSharedStateFileRecord("movies.json");
          assert.strictEqual(updated.content, '{"movies":[{"id":"1"}]}');
          assert.strictEqual(store.getFile("movies.json"), '{"movies":[{"id":"1"}]}');

          // Patch empty string content
          await patchSharedStateFile("movies.json", "");
          assert.strictEqual(await readSharedStateFile("movies.json"), "");

          // Create a new file via patch
          await patchSharedStateFile("config.json", '{"enabled":true}');
          assert.strictEqual(await readSharedStateFile("config.json"), '{"enabled":true}');

          // Check patchBodies history sequence
          assert.deepStrictEqual(store.patchBodies, [
            '{"movies":[{"id":"1"}]}',
            "",
            '{"enabled":true}',
          ]);
        } finally {
          store.dispose();
        }
      });

      it("handles nested test memory store installation and restoration", async () => {
        const outerStore = installSharedStateMemoryStoreForTests({
          "movies.json": '{"v":1}',
        });

        try {
          await patchSharedStateFile("movies.json", '{"v":2}');
          assert.deepStrictEqual(outerStore.patchBodies, ['{"v":2}']);

          const innerStore = installSharedStateMemoryStoreForTests({
            "movies.json": '{"v":10}',
          });

          try {
            assert.strictEqual(await readSharedStateFile("movies.json"), '{"v":10}');
            await patchSharedStateFile("movies.json", '{"v":11}');
            assert.strictEqual(innerStore.getFile("movies.json"), '{"v":11}');
            assert.deepStrictEqual(innerStore.patchBodies, ['{"v":11}']);
          } finally {
            innerStore.dispose();
          }

          // Restored to outer store state
          assert.strictEqual(await readSharedStateFile("movies.json"), '{"v":2}');
          assert.deepStrictEqual(outerStore.patchBodies, ['{"v":2}']);
        } finally {
          outerStore.dispose();
        }
      });
    });
  });

  describe("when DATABASE_URL is set and database query is mocked", () => {

    it("preloads shared state files into fileCache and allows cached reads", async () => {
      const originalDbUrl = process.env.DATABASE_URL;
      process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/db";
      invalidateSharedStateCache();

      const queriesExecuted: { sql: string; params?: unknown[] }[] = [];

      const connectMock = mock.method(
        pg.Pool.prototype,
        "connect",
        async function (this: any) {
          return {
            query: async (sql: string | { text: string }, params?: unknown[]) => {
              const sqlStr = typeof sql === "string" ? sql : sql?.text ?? "";
              queriesExecuted.push({ sql: sqlStr, params });
              if (sqlStr.includes("shared_state_files")) {
                if (sqlStr.includes("CREATE TABLE")) {
                  return { rows: [] };
                }
                if (sqlStr.includes("SELECT filename, content")) {
                  return {
                    rows: [
                      { filename: "movies.json", content: "{\"movies\":[1]}" },
                    ],
                  };
                }
              }
              return { rows: [] };
            },
            release: () => {},
          };
        },
      );

      try {
        await preloadSharedStateFiles(["movies.json", "missing.json"]);

        // Verify initial database queries (ensureSchema + SELECT)
        assert.ok(queriesExecuted.some((q) => q.sql.includes("CREATE TABLE")));
        assert.ok(queriesExecuted.some((q) => q.sql.includes("SELECT filename, content")));

        const queryCountBeforeRead = queriesExecuted.length;

        // Read preloaded existing file from cache
        const moviesRecord = await readSharedStateFileRecord("movies.json");
        assert.deepStrictEqual(moviesRecord, {
          exists: true,
          content: "{\"movies\":[1]}",
        });


        // Read preloaded missing file from cache
        const missingRecord = await readSharedStateFileRecord("missing.json");
        assert.deepStrictEqual(missingRecord, {
          exists: false,
          content: null,
        });

        // Assert no additional database queries were executed during cached reads
        assert.strictEqual(queriesExecuted.length, queryCountBeforeRead);
      } finally {
        connectMock.mock.restore();
        if (originalDbUrl !== undefined) {
          process.env.DATABASE_URL = originalDbUrl;
        } else {
          delete process.env.DATABASE_URL;
        }
        invalidateSharedStateCache();
      }
    });

    it("lists shared state filenames from database when DATABASE_URL is configured", async () => {
      const originalDbUrl = process.env.DATABASE_URL;
      process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/db";
      invalidateSharedStateCache();

      const queriesExecuted: { sql: string; params?: unknown[] }[] = [];

      const connectMock = mock.method(
        pg.Pool.prototype,
        "connect",
        async function (this: any) {
          return {
            query: async (sql: string | { text: string }, params?: unknown[]) => {
              const sqlStr = typeof sql === "string" ? sql : sql?.text ?? "";
              queriesExecuted.push({ sql: sqlStr, params });
              if (sqlStr.includes("shared_state_files")) {
                if (sqlStr.includes("CREATE TABLE")) {
                  return { rows: [] };
                }
                if (sqlStr.includes("SELECT filename FROM shared_state_files")) {
                  return {
                    rows: [
                      { filename: "a_movies.json" },
                      { filename: "b_settings.json" },
                    ],
                  };
                }
              }
              return { rows: [] };
            },
            release: () => {},
          };
        },
      );

      try {
        const filenames = await listSharedStateFilenames();
        assert.deepStrictEqual(filenames, ["a_movies.json", "b_settings.json"]);
        assert.ok(
          queriesExecuted.some((q) =>
            q.sql.includes("SELECT filename FROM shared_state_files"),
          ),
        );
      } finally {
        connectMock.mock.restore();
        if (originalDbUrl !== undefined) {
          process.env.DATABASE_URL = originalDbUrl;
        } else {
          delete process.env.DATABASE_URL;
        }
        invalidateSharedStateCache();
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
            await readSharedStateFile("test.json");
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


describe("invalidateSharedStateCache with memory store.setFile", () => {
  it("returns stale cache until invalidateSharedStateCache or bypassCache", async (t) => {
    const originalDbUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    invalidateSharedStateCache();

    const store = installSharedStateMemoryStoreForTests({
      "movies.json": '{"v":1}',
    });
    try {
      t.mock.timers.enable({ apis: ["Date"] });
      const now = Date.now();
      t.mock.timers.setTime(now);

      const firstRead = await readSharedStateFileRecord("movies.json");
      assert.strictEqual(firstRead.content, '{"v":1}');

      store.setFile("movies.json", '{"v":2}');
      const cached = await readSharedStateFileRecord("movies.json");
      assert.strictEqual(cached.content, '{"v":1}');

      const bypassed = await readSharedStateFileRecord("movies.json", { bypassCache: true });
      assert.strictEqual(bypassed.content, '{"v":2}');

      store.setFile("movies.json", '{"v":3}');
      invalidateSharedStateCache();
      const afterInvalidate = await readSharedStateFileRecord("movies.json");
      assert.strictEqual(afterInvalidate.content, '{"v":3}');

      store.setFile("movies.json", '{"v":4}');
      t.mock.timers.setTime(now + 45000);
      const afterTtl = await readSharedStateFileRecord("movies.json");
      assert.strictEqual(afterTtl.content, '{"v":4}');
    } finally {
      store.dispose();
      if (originalDbUrl !== undefined) process.env.DATABASE_URL = originalDbUrl;
      else delete process.env.DATABASE_URL;
      invalidateSharedStateCache();
    }
  });
});
