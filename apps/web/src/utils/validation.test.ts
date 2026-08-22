import { test } from "node:test";
import assert from "node:assert/strict";
import { createValidator, validateAndThrow } from "./validation.ts";

test("createValidator", async (t) => {
  await t.test("validates valid data successfully", () => {
    const validator = createValidator({
      name: { required: true, maxLength: 50 },
      age: {
        custom: (val) =>
          Number.isNaN(Number(val)) ? "Must be a number" : null,
      },
    });

    const result = validator({ name: "John Doe", age: "30" });
    assert.equal(result.isValid, true);
    assert.deepEqual(result.errors, {});
    assert.deepEqual(result.fieldErrors, []);
  });

  await t.test("enforces required rule", () => {
    const validator = createValidator({
      name: { required: true, message: "Name is mandatory" },
      optional: { required: false },
    });

    const result = validator({ optional: "present" });
    assert.equal(result.isValid, false);
    assert.deepEqual(result.errors, { name: "Name is mandatory" });
    assert.deepEqual(result.fieldErrors, ["Name is mandatory"]);
  });

  await t.test("enforces maxLength rule", () => {
    const validator = createValidator({
      code: { maxLength: 3 },
    });

    const result = validator({ code: "ABCD" });
    assert.equal(result.isValid, false);
    assert.deepEqual(result.errors, {
      code: "code exceeds maximum length of 3 characters",
    });
  });

  await t.test("enforces minLength rule", () => {
    const validator = createValidator({
      pin: { minLength: 4 },
    });

    const result = validator({ pin: "123" });
    assert.equal(result.isValid, false);
    assert.deepEqual(result.errors, {
      pin: "pin must be at least 4 characters",
    });
  });

  await t.test("enforces pattern rule", () => {
    const validator = createValidator({
      email: { pattern: /^[^@]+@[^@]+\.[^@]+$/ },
    });

    const result = validator({ email: "invalid-email" });
    assert.equal(result.isValid, false);
    assert.deepEqual(result.errors, { email: "email format is invalid" });
  });

  await t.test("enforces custom rule", () => {
    const validator = createValidator({
      username: {
        custom: (val) => (val === "admin" ? "Reserved username" : null),
      },
    });

    const result = validator({ username: "admin" });
    assert.equal(result.isValid, false);
    assert.deepEqual(result.errors, { username: "Reserved username" });
  });

  await t.test("trims whitespace before validation", () => {
    const validator = createValidator({
      name: { required: true },
      code: { maxLength: 3 },
    });

    const resultEmpty = validator({ name: "   " });
    assert.equal(resultEmpty.isValid, false);
    assert.equal(resultEmpty.errors.name, "name is required");

    const resultLength = validator({ name: "Valid", code: "  AB  " });
    assert.equal(resultLength.isValid, true);
  });

  await t.test("ignores missing non-required fields", () => {
    const validator = createValidator({
      bio: { maxLength: 10 }, // Not required
    });

    const result = validator({}); // Missing
    assert.equal(result.isValid, true);

    const resultEmpty = validator({ bio: "" }); // Empty
    assert.equal(resultEmpty.isValid, true);
  });

  await t.test("coerces non-string values to string", () => {
    const validator = createValidator({
      count: { minLength: 2 },
    });

    // Number 5 will be coerced to "5", which is 1 char (less than minLength 2)
    const result = validator({ count: 5 });
    assert.equal(result.isValid, false);
    assert.equal(result.errors.count, "count must be at least 2 characters");
  });

  await t.test("accumulates multiple errors across different fields", () => {
    const validator = createValidator({
      name: { required: true },
      age: { required: true },
    });

    const result = validator({});
    assert.equal(result.isValid, false);
    assert.equal(Object.keys(result.errors).length, 2);
    assert.equal(result.fieldErrors.length, 2);
  });
});

test("validateAndThrow", async (t) => {
  await t.test("returns result successfully when valid", () => {
    const validator = createValidator({
      name: { required: true },
    });

    const result = validateAndThrow(validator, { name: "John" });
    assert.equal(result.isValid, true);
    assert.deepEqual(result.errors, {});
  });

  await t.test("throws error when validation fails", () => {
    const validator = createValidator({
      name: { required: true, message: "Name is missing" },
    });

    assert.throws(
      () => validateAndThrow(validator, {}),
      (err) => err instanceof Error && err.message === "Name is missing",
    );
  });
});
