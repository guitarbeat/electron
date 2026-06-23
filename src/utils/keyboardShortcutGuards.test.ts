import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { isTypingInField } from "./keyboardShortcutGuards.ts";

describe("isTypingInField", () => {
  beforeEach(() => {
    // Setup minimal DOM mocks for node environment
    const globalObj = global as any;

    class MockElement {}

    class MockHTMLElement extends MockElement {
      isContentEditable = false;
    }

    class MockHTMLInputElement extends MockHTMLElement {}
    class MockHTMLTextAreaElement extends MockHTMLElement {}
    class MockHTMLSelectElement extends MockHTMLElement {}

    globalObj.HTMLElement = MockHTMLElement;
    globalObj.HTMLInputElement = MockHTMLInputElement;
    globalObj.HTMLTextAreaElement = MockHTMLTextAreaElement;
    globalObj.HTMLSelectElement = MockHTMLSelectElement;
  });

  afterEach(() => {
    // Teardown DOM mocks
    const globalObj = global as any;
    delete globalObj.HTMLElement;
    delete globalObj.HTMLInputElement;
    delete globalObj.HTMLTextAreaElement;
    delete globalObj.HTMLSelectElement;
  });

  it("returns true for HTMLInputElement", () => {
    const el = new (global as any).HTMLInputElement();
    assert.strictEqual(isTypingInField(el as any), true);
  });

  it("returns true for HTMLTextAreaElement", () => {
    const el = new (global as any).HTMLTextAreaElement();
    assert.strictEqual(isTypingInField(el as any), true);
  });

  it("returns true for HTMLSelectElement", () => {
    const el = new (global as any).HTMLSelectElement();
    assert.strictEqual(isTypingInField(el as any), true);
  });

  it("returns true for contenteditable HTMLElement", () => {
    const el = new (global as any).HTMLElement();
    el.isContentEditable = true;
    assert.strictEqual(isTypingInField(el as any), true);
  });

  it("returns false for non-contenteditable HTMLElement", () => {
    const el = new (global as any).HTMLElement();
    el.isContentEditable = false;
    assert.strictEqual(isTypingInField(el as any), false);
  });

  it("returns false for null", () => {
    assert.strictEqual(isTypingInField(null), false);
  });

  it("returns false for unrelated object", () => {
    const el = { someKey: "someValue" };
    assert.strictEqual(isTypingInField(el as any), false);
  });
});
