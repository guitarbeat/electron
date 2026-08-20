import assert from "node:assert/strict";
import test from "node:test";
import { BoundedResponseCache, isAbsoluteUrl } from "../../../../api/_lib/cachedProxy.ts";

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


test("isAbsoluteUrl correctly identifies absolute URLs", () => {
  // Valid absolute URLs
  assert.equal(isAbsoluteUrl("http://example.com"), true);
  assert.equal(isAbsoluteUrl("https://example.com"), true);
  assert.equal(isAbsoluteUrl("ftp://example.com"), true);
  assert.equal(isAbsoluteUrl("custom-scheme://test"), true);

  // Invalid or relative URLs
  assert.equal(isAbsoluteUrl("example.com"), false);
  assert.equal(isAbsoluteUrl("/path/to/resource"), false);
  assert.equal(isAbsoluteUrl("http:example.com"), false);
  assert.equal(isAbsoluteUrl("://example.com"), false);
  assert.equal(isAbsoluteUrl("123scheme://example.com"), false);
  assert.equal(isAbsoluteUrl("some.schema://test"), true);
});
