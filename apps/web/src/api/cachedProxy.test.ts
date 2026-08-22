import assert from "node:assert/strict";
import test from "node:test";
import { BoundedResponseCache } from "../../../../api/_lib/cachedProxy.ts";

test("BoundedResponseCache expires entries and keeps its configured bound", () => {
  let now = 100;
  const cache = new BoundedResponseCache<string>({
    ttlMs: 10,
    maxEntries: 2,
    now: () => now,
  });

  cache.set("one", "first");
  cache.set("two", "second");
  cache.set("three", "third");
  assert.equal(cache.get("one"), undefined);
  assert.equal(cache.get("three"), "third");

  now = 111;
  assert.equal(cache.get("three"), undefined);
});
