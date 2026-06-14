import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeInput } from "./shared.ts";

test("sanitizeInput", async (t) => {
  await t.test("returns empty string for empty/nullish inputs", () => {
    assert.equal(sanitizeInput(""), "");
    // @ts-expect-error Testing invalid runtime input
    assert.equal(sanitizeInput(null), "");
    // @ts-expect-error Testing invalid runtime input
    assert.equal(sanitizeInput(undefined), "");
  });

  await t.test("replaces XSS payload characters with HTML entities", () => {
    assert.equal(sanitizeInput("&"), "&amp;");
    assert.equal(sanitizeInput("<"), "&lt;");
    assert.equal(sanitizeInput(">"), "&gt;");
    assert.equal(sanitizeInput('"'), "&quot;");
    assert.equal(sanitizeInput("'"), "&#x27;");

    // Multiple characters
    assert.equal(
      sanitizeInput("<script>alert('XSS & \"injection\"')</script>"),
      "&lt;script&gt;alert(&#x27;XSS &amp; &quot;injection&quot;&#x27;)&lt;/script&gt;"
    );
  });

  await t.test("keeps normal strings unchanged", () => {
    assert.equal(
      sanitizeInput("hello world 123"),
      "hello world 123"
    );
  });
});
