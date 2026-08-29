import { describe, it } from "node:test";
import assert from "node:assert";
import { hashPin, verifyStoredPin } from "./session.js";

describe("verifyStoredPin and hashPin", () => {
  it("should generate a valid hash string format with hashPin", () => {
    const pin = "1234";
    const hash = hashPin(pin);
    const parts = hash.split(":");
    assert.strictEqual(parts.length, 4);
    assert.strictEqual(parts[0], "pbkdf2");
    assert.strictEqual(parts[1], "100000");
  });

  it("should verify a correct pin against a hash created by hashPin", () => {
    const pin = "4321";
    const hash = hashPin(pin);
    assert.strictEqual(verifyStoredPin(pin, hash), true);
  });

  it("should fail verification for an incorrect pin", () => {
    const pin = "1234";
    const hash = hashPin(pin);
    assert.strictEqual(verifyStoredPin("9999", hash), false);
  });

  describe("verifyStoredPin edge cases", () => {
    it("should return false when storedHash does not split into 4 parts", () => {
      assert.strictEqual(verifyStoredPin("1234", ""), false);
      assert.strictEqual(verifyStoredPin("1234", "pbkdf2"), false);
      assert.strictEqual(verifyStoredPin("1234", "pbkdf2:100000"), false);
      assert.strictEqual(verifyStoredPin("1234", "pbkdf2:100000:salt"), false);
      assert.strictEqual(
        verifyStoredPin("1234", "pbkdf2:100000:salt:hash:extra"),
        false,
      );
    });

    it("should return false when algorithm prefix is not 'pbkdf2'", () => {
      assert.strictEqual(
        verifyStoredPin("1234", "sha256:100000:abcd:ef01"),
        false,
      );
      assert.strictEqual(
        verifyStoredPin("1234", "bcrypt:100000:abcd:ef01"),
        false,
      );
      assert.strictEqual(
        verifyStoredPin("1234", "invalid:100000:abcd:ef01"),
        false,
      );
    });
  });
});
