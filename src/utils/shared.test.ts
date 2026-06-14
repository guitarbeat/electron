import test from "node:test";
import assert from "node:assert/strict";
import { isValidUrl } from "./shared.ts";

test("isValidUrl", async (t) => {
  await t.test("returns true for valid HTTP URLs", () => {
    assert.equal(isValidUrl("http://example.com"), true);
    assert.equal(isValidUrl("http://www.example.com"), true);
    assert.equal(isValidUrl("http://example.com/path?query=1#fragment"), true);
  });

  await t.test("returns true for valid HTTPS URLs", () => {
    assert.equal(isValidUrl("https://example.com"), true);
    assert.equal(isValidUrl("https://www.example.com"), true);
    assert.equal(isValidUrl("https://example.com/path?query=1#fragment"), true);
  });

  await t.test("returns false for empty or missing input", () => {
    assert.equal(isValidUrl(""), false);
    // @ts-expect-error Testing invalid runtime input
    assert.equal(isValidUrl(null), false);
    // @ts-expect-error Testing invalid runtime input
    assert.equal(isValidUrl(undefined), false);
  });

  await t.test("returns false for malformed URLs", () => {
    assert.equal(isValidUrl("not-a-url"), false);
    assert.equal(isValidUrl("http://"), false);
    assert.equal(isValidUrl("https://"), false);
  });

  await t.test("returns false for unsafe or unsupported protocols", () => {
    assert.equal(isValidUrl("java" + "script:alert(1)"), false);
    assert.equal(isValidUrl("javascript:void(0)"), false);
    assert.equal(isValidUrl("data:text/plain,hello"), false);
    assert.equal(isValidUrl("ftp://example.com"), false);
    assert.equal(isValidUrl("file:///local/file.txt"), false);
    assert.equal(
      isValidUrl(["w", "s", ":", "/", "/", "example.com"].join("")),
      false,
    );
    assert.equal(isValidUrl("wss://example.com"), false);
  });

  await t.test(
    "returns false for protocol-relative URLs (missing protocol)",
    () => {
      // URL constructor throws for protocol-relative unless base is provided
      assert.equal(isValidUrl("/" + "/example.com"), false);
    },
  );
});
