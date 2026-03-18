import { describe, it, mock, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { parsePinsContent } from "./pinHelpers.ts";

describe("parsePinsContent", () => {
  let consoleErrorMock: ReturnType<typeof mock.method>;

  beforeEach(() => {
    // Suppress console.error to keep test output clean for expected errors
    consoleErrorMock = mock.method(console, "error", () => {});
  });

  afterEach(() => {
    consoleErrorMock.mock.restore();
  });

  it("should return empty object for undefined input", () => {
    const result = parsePinsContent(undefined);
    assert.deepStrictEqual(result, {});
  });

  it("should return empty object for empty string input", () => {
    const result = parsePinsContent("");
    assert.deepStrictEqual(result, {});
  });

  it("should return empty object for invalid JSON string and log error", () => {
    const invalidJson = "this is not valid json";
    const result = parsePinsContent(invalidJson);

    assert.deepStrictEqual(result, {});
    assert.strictEqual(consoleErrorMock.mock.callCount(), 1);
  });

  it("should successfully parse valid UserPins JSON", () => {
    const validJson = JSON.stringify({
      Aaron: "hash1",
      Electra: "hash2",
    });

    const result = parsePinsContent(validJson);
    assert.deepStrictEqual(result, {
      Aaron: "hash1",
      Electra: "hash2",
    });
    assert.strictEqual(consoleErrorMock.mock.callCount(), 0);
  });

  it("should return normalized object when JSON is valid but not a UserPins record", () => {
    // When normalizeUserPins receives an array, it treats it as an object and attempts to access 'Aaron' and 'Electra' properties.
    // Since arrays don't have these properties, they are normalized to undefined.
    const validJsonArray = JSON.stringify(["Aaron", "hash1"]);

    const result = parsePinsContent(validJsonArray);
    assert.deepStrictEqual(result, { Aaron: undefined, Electra: undefined });
    assert.strictEqual(consoleErrorMock.mock.callCount(), 0);
  });

  it("should handle partial UserPins JSON", () => {
    const partialJson = JSON.stringify({
      Aaron: "hash1",
    });

    const result = parsePinsContent(partialJson);
    assert.deepStrictEqual(result, {
      Aaron: "hash1",
      Electra: undefined,
    });
    assert.strictEqual(consoleErrorMock.mock.callCount(), 0);
  });
});
