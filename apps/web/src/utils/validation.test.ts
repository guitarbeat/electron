import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createValidator,
  ValidationPatterns,
  CommonRules,
  validatePlace,
  validateMemory,
  validateAndThrow,
  MAX_MESSAGE_LENGTH,
  MAX_AUTHOR_LENGTH,
  MAX_MOVIE_TITLE_LENGTH,
} from "./validation.js";

describe("validation utility", () => {
  describe("createValidator", () => {
    it("validates required fields", () => {
      const validator = createValidator({
        title: { required: true },
        description: { required: true, message: "Description is mandatory" },
      });

      const invalidResult = validator({ title: "", description: "   " });
      assert.equal(invalidResult.isValid, false);
      assert.equal(invalidResult.errors.title, "title is required");
      assert.equal(invalidResult.errors.description, "Description is mandatory");
      assert.deepEqual(invalidResult.fieldErrors, [
        "title is required",
        "Description is mandatory",
      ]);

      const validResult = validator({
        title: "Movie Night",
        description: "Watching Nosferatu",
      });
      assert.equal(validResult.isValid, true);
      assert.deepEqual(validResult.errors, {});
      assert.deepEqual(validResult.fieldErrors, []);
    });

    it("skips non-required empty fields", () => {
      const validator = createValidator({
        bio: { required: false, minLength: 10 },
      });

      const resultEmpty = validator({ bio: "" });
      assert.equal(resultEmpty.isValid, true);

      const resultWhitespace = validator({ bio: "   " });
      assert.equal(resultWhitespace.isValid, true);

      const resultNull = validator({ bio: null });
      assert.equal(resultNull.isValid, true);
    });

    it("handles non-string raw values safely", () => {
      const validator = createValidator({
        age: { required: true, minLength: 2 },
        active: { required: false, minLength: 4 },
        missing: { required: false, minLength: 3 },
        count: { required: true },
        flag: { required: true },
      });

      const resultNum = validator({ age: 25, active: true, missing: undefined, count: 10, flag: "true" });
      assert.equal(resultNum.isValid, true);

      const resultFalsyRequired = validator({ age: 25, count: 0, flag: false });
      assert.equal(resultFalsyRequired.isValid, false);
      assert.equal(resultFalsyRequired.errors.count, "count is required");
      assert.equal(resultFalsyRequired.errors.flag, "flag is required");

      const resultShortNum = validator({ age: 5, count: 10, flag: "true" });
      assert.equal(resultShortNum.isValid, false);
      assert.equal(resultShortNum.errors.age, "age must be at least 2 characters");
    });

    it("sanitizes control characters before measuring minLength and maxLength", () => {
      const validator = createValidator({
        code: { maxLength: 3 },
        secret: { minLength: 5 },
      });

      // "a\x00b\x01c\x02d" sanitized becomes "abcd" (len 4 -> > 3)
      const resultMax = validator({ code: "a\x00b\x01c\x02d" });
      assert.equal(resultMax.isValid, false);
      assert.equal(resultMax.errors.code, "code exceeds maximum length of 3 characters");

      // "  hello\x07  " sanitized becomes "hello" (len 5 -> >= 5)
      const resultMin = validator({ secret: "  hello\x07  " });
      assert.equal(resultMin.isValid, true);
    });

    it("validates maxLength", () => {
      const validator = createValidator({
        code: { maxLength: 3 },
        tag: { maxLength: 3, message: "Tag too long" },
      });

      const invalidResult = validator({ code: "abcd", tag: "1234" });
      assert.equal(invalidResult.isValid, false);
      assert.equal(invalidResult.errors.code, "code exceeds maximum length of 3 characters");
      assert.equal(invalidResult.errors.tag, "Tag too long");

      const validResult = validator({ code: "abc", tag: "12" });
      assert.equal(validResult.isValid, true);
    });

    it("validates minLength", () => {
      const validator = createValidator({
        pass: { minLength: 6 },
        pin: { minLength: 4, message: "PIN is too short" },
      });

      const invalidResult = validator({ pass: "12345", pin: "12" });
      assert.equal(invalidResult.isValid, false);
      assert.equal(invalidResult.errors.pass, "pass must be at least 6 characters");
      assert.equal(invalidResult.errors.pin, "PIN is too short");

      const validResult = validator({ pass: "123456", pin: "1234" });
      assert.equal(validResult.isValid, true);
    });

    it("validates pattern", () => {
      const validator = createValidator({
        code: { pattern: /^[A-Z]{3}$/ },
        zip: { pattern: /^\d{5}$/, message: "Invalid ZIP code" },
      });

      const invalidResult = validator({ code: "abc", zip: "123" });
      assert.equal(invalidResult.isValid, false);
      assert.equal(invalidResult.errors.code, "code format is invalid");
      assert.equal(invalidResult.errors.zip, "Invalid ZIP code");

      const validResult = validator({ code: "ABC", zip: "12345" });
      assert.equal(validResult.isValid, true);
    });

    it("supports custom validation rules", () => {
      const validator = createValidator({
        evenNumber: {
          custom: (val) => (Number(val) % 2 !== 0 ? "Must be an even number" : null),
        },
      });

      const invalidResult = validator({ evenNumber: "5" });
      assert.equal(invalidResult.isValid, false);
      assert.equal(invalidResult.errors.evenNumber, "Must be an even number");

      const validResult = validator({ evenNumber: "4" });
      assert.equal(validResult.isValid, true);
    });
  });

  describe("ValidationPatterns", () => {
    it("validates email pattern correctly", () => {
      assert.ok(ValidationPatterns.email.test("user@example.com"));
      assert.ok(ValidationPatterns.email.test("a.b+c@domain.co.uk"));
      assert.equal(ValidationPatterns.email.test("invalid-email"), false);
      assert.equal(ValidationPatterns.email.test("user@domain"), false);
    });

    it("validates url pattern correctly", () => {
      assert.ok(ValidationPatterns.url.test("http://example.com"));
      assert.ok(ValidationPatterns.url.test("https://sub.domain.org/path?q=1"));
      assert.equal(ValidationPatterns.url.test("ftp://example.com"), false);
      assert.equal(ValidationPatterns.url.test("just-text"), false);
    });

    it("validates alphanumeric pattern correctly", () => {
      assert.ok(ValidationPatterns.alphanumeric.test("User123"));
      assert.equal(ValidationPatterns.alphanumeric.test("user_name"), false);
      assert.equal(ValidationPatterns.alphanumeric.test("user!"), false);
    });

    it("validates numeric pattern correctly", () => {
      assert.ok(ValidationPatterns.numeric.test("12345"));
      assert.equal(ValidationPatterns.numeric.test("12a34"), false);
    });

    it("validates phone pattern correctly", () => {
      assert.ok(ValidationPatterns.phone.test("+1 (555) 019-2834"));
      assert.ok(ValidationPatterns.phone.test("1234567890"));
      assert.equal(ValidationPatterns.phone.test("phone#123"), false);
    });

    it("validates slug pattern correctly", () => {
      assert.ok(ValidationPatterns.slug.test("my-movie-title"));
      assert.ok(ValidationPatterns.slug.test("movie123"));
      assert.equal(ValidationPatterns.slug.test("My-Movie"), false);
      assert.equal(ValidationPatterns.slug.test("movie_title"), false);
    });
  });

  describe("CommonRules & Predefined Validators", () => {
    it("validates CommonRules configurations", () => {
      const requiredValidator = createValidator({ field: CommonRules.required });
      assert.equal(requiredValidator({ field: "" }).isValid, false);
      assert.equal(requiredValidator({ field: "value" }).isValid, true);

      const emailValidator = createValidator({ email: CommonRules.email });
      assert.equal(emailValidator({ email: "" }).isValid, false);
      assert.equal(emailValidator({ email: "invalid" }).isValid, false);
      assert.equal(
        emailValidator({ email: "invalid" }).errors.email,
        "Please enter a valid email address",
      );
      assert.equal(emailValidator({ email: "test@example.com" }).isValid, true);

      const urlValidator = createValidator({ url: CommonRules.url });
      assert.equal(urlValidator({ url: "" }).isValid, true); // not required
      assert.equal(urlValidator({ url: "ftp://test.com" }).isValid, false);
      assert.equal(
        urlValidator({ url: "ftp://test.com" }).errors.url,
        "Please enter a valid URL starting with http:// or https://",
      );
      assert.equal(urlValidator({ url: "https://test.com" }).isValid, true);

      const usernameValidator = createValidator({ username: CommonRules.username });
      assert.equal(usernameValidator({ username: "ab" }).isValid, false);
      assert.equal(usernameValidator({ username: "valid123" }).isValid, true);

      const passwordValidator = createValidator({ password: CommonRules.password });
      assert.equal(passwordValidator({ password: "short" }).isValid, false);
      assert.equal(passwordValidator({ password: "pass12345" }).isValid, true);

      const notesValidator = createValidator({ notes: CommonRules.notes });
      assert.equal(notesValidator({ notes: "" }).isValid, true);
      assert.equal(notesValidator({ notes: "a".repeat(501) }).isValid, false);
    });

    it("validates place using validatePlace", () => {
      const validPlace = validatePlace({
        name: "Cinema Paradiso",
        notes: "Great theater",
      });
      assert.equal(validPlace.isValid, true);

      const invalidPlace = validatePlace({
        name: "",
        notes: "a".repeat(501),
      });
      assert.equal(invalidPlace.isValid, false);
      assert.ok(invalidPlace.errors.name);
      assert.ok(invalidPlace.errors.notes);
    });

    it("validates memory using validateMemory", () => {
      const validMemory = validateMemory({
        note: "Movie night with @aaron and @ELECTRA!",
        movieTitle: "The Matrix",
        author: "Aaron",
      });
      assert.equal(validMemory.isValid, true);

      const invalidMentionsMemory = validateMemory({
        note: "Hey @john, @bob, and @aaron!",
        movieTitle: "Inception",
        author: "Electra",
      });
      assert.equal(invalidMentionsMemory.isValid, false);
      assert.equal(
        invalidMentionsMemory.errors.note,
        "Invalid mentions: @john, @bob. Only @aaron and @electra are allowed.",
      );

      const noMentionsMemory = validateMemory({
        note: "Just a movie night note without mentions",
        movieTitle: "Interstellar",
        author: "Electra",
      });
      assert.equal(noMentionsMemory.isValid, true);
    });

    it("checks limits for movieTitle, messageContent, messageAuthor", () => {
      const validator = createValidator({
        title: CommonRules.movieTitle,
        message: CommonRules.messageContent,
        author: CommonRules.messageAuthor,
      });

      const validResult = validator({
        title: "A".repeat(MAX_MOVIE_TITLE_LENGTH),
        message: "B".repeat(MAX_MESSAGE_LENGTH),
        author: "C".repeat(MAX_AUTHOR_LENGTH),
      });
      assert.equal(validResult.isValid, true);

      const invalidResult = validator({
        title: "A".repeat(MAX_MOVIE_TITLE_LENGTH + 1),
        message: "B".repeat(MAX_MESSAGE_LENGTH + 1),
        author: "C".repeat(MAX_AUTHOR_LENGTH + 1),
      });
      assert.equal(invalidResult.isValid, false);
      assert.ok(invalidResult.errors.title);
      assert.ok(invalidResult.errors.message);
      assert.ok(invalidResult.errors.author);
    });
  });

  describe("validateAndThrow", () => {
    const dummyValidator = createValidator({
      field: { required: true, message: "Field is required!" },
    });

    it("returns validation result when valid", () => {
      const result = validateAndThrow(dummyValidator, { field: "value" });
      assert.equal(result.isValid, true);
    });

    it("throws Error when invalid", () => {
      assert.throws(
        () => validateAndThrow(dummyValidator, { field: "" }),
        {
          name: "Error",
          message: "Field is required!",
        },
      );
    });

    it("throws fallback message when validator error map is empty despite isValid being false", () => {
      const customValidator = () => ({
        isValid: false,
        errors: {},
        fieldErrors: [],
      });

      assert.throws(
        () => validateAndThrow(customValidator, {}),
        {
          name: "Error",
          message: "Validation failed",
        },
      );
    });
  });
});
