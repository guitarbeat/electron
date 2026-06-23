import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { isTypingInField } from "./keyboardShortcutGuards.ts";

describe("isTypingInField", () => {
  beforeEach(() => {
    // Setup minimal DOM mocks for node environment
    const globalObj = global as unknown as Record<string, unknown>;

    class MockElement {}

    class MockHTMLElement extends MockElement {
      get isContentEditable() {
        return false;
      }
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
    const globalObj = global as unknown as Record<string, unknown>;
    delete globalObj.HTMLElement;
    delete globalObj.HTMLInputElement;
    delete globalObj.HTMLTextAreaElement;
    delete globalObj.HTMLSelectElement;
  });

  it("returns true for HTMLInputElement", () => {
    const InputElement = (global as unknown as Record<string, new () => EventTarget>).HTMLInputElement;
    const el = new InputElement();
    assert.strictEqual(isTypingInField(el), true);
  });

  it("returns true for HTMLTextAreaElement", () => {
    const TextAreaElement = (global as unknown as Record<string, new () => EventTarget>).HTMLTextAreaElement;
    const el = new TextAreaElement();
    assert.strictEqual(isTypingInField(el), true);
  });

  it("returns true for HTMLSelectElement", () => {
    const SelectElement = (global as unknown as Record<string, new () => EventTarget>).HTMLSelectElement;
    const el = new SelectElement();
    assert.strictEqual(isTypingInField(el), true);
  });

  it("returns true for contenteditable HTMLElement", () => {
    const HTMLElementClass = (global as unknown as Record<string, new () => HTMLElement>).HTMLElement;
    const el = new HTMLElementClass();
    Object.defineProperty(el, 'isContentEditable', { value: true, configurable: true });
    assert.strictEqual(isTypingInField(el), true);
  });

  it("returns false for non-contenteditable HTMLElement", () => {
    const HTMLElementClass = (global as unknown as Record<string, new () => HTMLElement>).HTMLElement;
    const el = new HTMLElementClass();
    Object.defineProperty(el, 'isContentEditable', { value: false, configurable: true });
    assert.strictEqual(isTypingInField(el), false);
  });

  it("returns false for null", () => {
    assert.strictEqual(isTypingInField(null), false);
  });

  it("returns false for unrelated object", () => {
    const el = { someKey: "someValue" };
    assert.strictEqual(isTypingInField(el as unknown as EventTarget), false);
  });
});
