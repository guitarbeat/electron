import { describe, it } from "node:test";
import assert from "node:assert";
import { createHmac } from "node:crypto";
import {
  hashPin,
  verifyStoredPin,
  buildProfileCookie,
  buildClearProfileCookie,
  buildPinAttemptCookie,
  buildClearPinAttemptCookie,
  getSessionState,
  getPinAttemptState,
  requireAccessUser,
  requireProfileUser,
  hasAccessSession,
} from "./session.js";

const base64urlEncode = (str: string): string =>
  Buffer.from(str, "utf8").toString("base64url");

const getSecret = (): string =>
  process.env.SESSION_SIGNING_SECRET ||
  process.env.SESSION_SECRET ||
  "test-session-signing-secret";

const signValue = (value: string, secret = getSecret()): string =>
  createHmac("sha256", secret).update(value).digest("base64url");

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

describe("profile session signing and token verification", () => {
  it("should create valid profile cookie and verify profile session state", () => {
    const req = new Request("http://localhost/api/test");
    const cookieHeader = buildProfileCookie(req, "Aaron");
    assert.match(cookieHeader, /^movie_watch_profile=/);

    const cookieValue = cookieHeader.split(";")[0];
    const authedReq = new Request("http://localhost/api/test", {
      headers: { cookie: cookieValue },
    });

    const sessionState = getSessionState(authedReq);
    assert.strictEqual(sessionState.hasAccess, true);
    assert.strictEqual(sessionState.currentUser, "Aaron");
    assert.strictEqual(requireAccessUser(authedReq), "Aaron");
    assert.strictEqual(requireProfileUser(authedReq), "Aaron");
  });

  it("should return null currentUser when cookie is missing or empty", () => {
    const reqNoCookie = new Request("http://localhost/api/test");
    assert.strictEqual(getSessionState(reqNoCookie).currentUser, null);
    assert.strictEqual(requireAccessUser(reqNoCookie), null);
    assert.strictEqual(requireProfileUser(reqNoCookie), null);

    const reqEmptyCookie = new Request("http://localhost/api/test", {
      headers: { cookie: "movie_watch_profile=" },
    });
    assert.strictEqual(getSessionState(reqEmptyCookie).currentUser, null);
  });

  it("should return true for hasAccessSession", () => {
    assert.strictEqual(hasAccessSession(), true);
    assert.strictEqual(hasAccessSession(new Request("http://localhost")), true);
  });
});

describe("pin attempt session signing and token verification", () => {
  it("should create valid pin attempt cookie and verify state", () => {
    const req = new Request("http://localhost/api/test");
    const lockTime = Math.floor(Date.now() / 1000) + 600;
    const cookieHeader = buildPinAttemptCookie(req, {
      user: "Electra",
      failures: 2,
      lockUntil: lockTime,
    });
    assert.match(cookieHeader, /^movie_watch_pin_attempt=/);

    const cookieValue = cookieHeader.split(";")[0];
    const reqWithCookie = new Request("http://localhost/api/test", {
      headers: { cookie: cookieValue },
    });

    const pinState = getPinAttemptState(reqWithCookie);
    assert.deepStrictEqual(pinState, {
      user: "Electra",
      failures: 2,
      lockUntil: lockTime,
    });
  });

  it("should handle null lockUntil in pin attempt payload", () => {
    const req = new Request("http://localhost/api/test");
    const cookieHeader = buildPinAttemptCookie(req, {
      user: "Aaron",
      failures: 1,
      lockUntil: null,
    });
    const cookieValue = cookieHeader.split(";")[0];
    const reqWithCookie = new Request("http://localhost/api/test", {
      headers: { cookie: cookieValue },
    });

    const pinState = getPinAttemptState(reqWithCookie);
    assert.deepStrictEqual(pinState, {
      user: "Aaron",
      failures: 1,
      lockUntil: null,
    });
  });

  it("should return null when pin attempt cookie is missing", () => {
    const req = new Request("http://localhost/api/test");
    assert.strictEqual(getPinAttemptState(req), null);
  });
});

describe("token verification edge cases and error handling", () => {
  it("should reject token with missing or multiple dots", () => {
    const reqNoDot = new Request("http://localhost/api/test", {
      headers: { cookie: "movie_watch_profile=nodottoken" },
    });
    assert.strictEqual(getSessionState(reqNoDot).currentUser, null);
  });

  it("should reject token with tampered signature", () => {
    const req = new Request("http://localhost/api/test");
    const cookieHeader = buildProfileCookie(req, "Aaron");
    const [nameVal] = cookieHeader.split(";");
    const [name, token] = nameVal.split("=");
    const [payload, sig] = token.split(".");

    // Alter signature characters
    const tamperedSig = sig.endsWith("a") ? sig.slice(0, -1) + "b" : sig.slice(0, -1) + "a";
    const reqTampered = new Request("http://localhost/api/test", {
      headers: { cookie: `${name}=${payload}.${tamperedSig}` },
    });

    assert.strictEqual(getSessionState(reqTampered).currentUser, null);
  });

  it("should reject token with signature length mismatch", () => {
    const req = new Request("http://localhost/api/test");
    const cookieHeader = buildProfileCookie(req, "Aaron");
    const [nameVal] = cookieHeader.split(";");
    const [name, token] = nameVal.split("=");
    const [payload] = token.split(".");

    const reqShortSig = new Request("http://localhost/api/test", {
      headers: { cookie: `${name}=${payload}.shortsig` },
    });

    assert.strictEqual(getSessionState(reqShortSig).currentUser, null);
  });

  it("should reject token with tampered payload", () => {
    const req = new Request("http://localhost/api/test");
    const cookieHeader = buildProfileCookie(req, "Aaron");
    const [nameVal] = cookieHeader.split(";");
    const [name, token] = nameVal.split("=");
    const [, sig] = token.split(".");

    // Create a new base64url payload with a different user
    const tamperedPayloadStr = base64urlEncode(
      JSON.stringify({
        type: "profile",
        user: "Electra",
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    );

    const reqTamperedPayload = new Request("http://localhost/api/test", {
      headers: { cookie: `${name}=${tamperedPayloadStr}.${sig}` },
    });

    assert.strictEqual(getSessionState(reqTamperedPayload).currentUser, null);
  });

  it("should reject expired tokens", () => {
    const expiredPayload = {
      type: "profile",
      user: "Aaron",
      exp: Math.floor(Date.now() / 1000) - 100,
    };
    const encodedPayload = base64urlEncode(JSON.stringify(expiredPayload));
    const sig = signValue(encodedPayload);
    const expiredToken = `${encodedPayload}.${sig}`;

    const req = new Request("http://localhost/api/test", {
      headers: { cookie: `movie_watch_profile=${expiredToken}` },
    });

    assert.strictEqual(getSessionState(req).currentUser, null);
  });

  it("should reject token when type does not match expectedType", () => {
    const pinPayload = {
      type: "pin_attempt",
      user: "Aaron",
      failures: 0,
      lockUntil: null,
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const encodedPayload = base64urlEncode(JSON.stringify(pinPayload));
    const sig = signValue(encodedPayload);
    const pinToken = `${encodedPayload}.${sig}`;

    // Try to pass a pin_attempt token as profile session
    const reqProfile = new Request("http://localhost/api/test", {
      headers: { cookie: `movie_watch_profile=${pinToken}` },
    });
    assert.strictEqual(getSessionState(reqProfile).currentUser, null);

    // Try to pass profile token as pin_attempt session
    const profilePayload = {
      type: "profile",
      user: "Aaron",
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const encodedProfilePayload = base64urlEncode(JSON.stringify(profilePayload));
    const profileSig = signValue(encodedProfilePayload);
    const profileToken = `${encodedProfilePayload}.${profileSig}`;

    const reqPin = new Request("http://localhost/api/test", {
      headers: { cookie: `movie_watch_pin_attempt=${profileToken}` },
    });
    assert.strictEqual(getPinAttemptState(reqPin), null);
  });

  it("should reject token with invalid payload schema or non-existent user", () => {
    const invalidUserPayload = {
      type: "profile",
      user: "UnknownUser",
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const enc1 = base64urlEncode(JSON.stringify(invalidUserPayload));
    const token1 = `${enc1}.${signValue(enc1)}`;
    const req1 = new Request("http://localhost/api/test", {
      headers: { cookie: `movie_watch_profile=${token1}` },
    });
    assert.strictEqual(getSessionState(req1).currentUser, null);

    const invalidPinPayload = {
      type: "pin_attempt",
      user: "Aaron",
      failures: -1, // negative failures invalid
      lockUntil: null,
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const enc2 = base64urlEncode(JSON.stringify(invalidPinPayload));
    const token2 = `${enc2}.${signValue(enc2)}`;
    const req2 = new Request("http://localhost/api/test", {
      headers: { cookie: `movie_watch_pin_attempt=${token2}` },
    });
    assert.strictEqual(getPinAttemptState(req2), null);

    const invalidLockUntilPayload = {
      type: "pin_attempt",
      user: "Aaron",
      failures: 2,
      lockUntil: -500, // non-positive lockUntil invalid
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const enc3 = base64urlEncode(JSON.stringify(invalidLockUntilPayload));
    const token3 = `${enc3}.${signValue(enc3)}`;
    const req3 = new Request("http://localhost/api/test", {
      headers: { cookie: `movie_watch_pin_attempt=${token3}` },
    });
    assert.strictEqual(getPinAttemptState(req3), null);
  });

  it("should reject non-JSON or malformed base64url payloads", () => {
    const malformedJsonEnc = base64urlEncode("not valid json");
    const sig1 = signValue(malformedJsonEnc);
    const req1 = new Request("http://localhost/api/test", {
      headers: { cookie: `movie_watch_profile=${malformedJsonEnc}.${sig1}` },
    });
    assert.strictEqual(getSessionState(req1).currentUser, null);
  });

  it("should reject tokens signed with a different secret", () => {
    const payload = {
      type: "profile",
      user: "Aaron",
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const enc = base64urlEncode(JSON.stringify(payload));
    const wrongSig = signValue(enc, "different-signing-secret");

    const req = new Request("http://localhost/api/test", {
      headers: { cookie: `movie_watch_profile=${enc}.${wrongSig}` },
    });

    assert.strictEqual(getSessionState(req).currentUser, null);
  });
});

describe("cookie generation details and clearing cookies", () => {
  it("should format cookie with correct security attributes and handle x-forwarded-proto", () => {
    const httpReq = new Request("http://localhost/api/test");
    const httpCookie = buildProfileCookie(httpReq, "Aaron");
    assert.match(httpCookie, /Path=\//);
    assert.match(httpCookie, /HttpOnly/);
    assert.match(httpCookie, /SameSite=Lax/);
    assert.match(httpCookie, /Max-Age=604800/);
    assert.strictEqual(httpCookie.includes("Secure"), false);

    const httpsReq = new Request("http://localhost/api/test", {
      headers: { "x-forwarded-proto": "https" },
    });
    const httpsCookie = buildProfileCookie(httpsReq, "Aaron");
    assert.match(httpsCookie, /Secure/);
  });

  it("should create correct clear cookie headers", () => {
    const req = new Request("http://localhost/api/test");

    const clearProfile = buildClearProfileCookie(req);
    assert.match(clearProfile, /^movie_watch_profile=/);
    assert.match(clearProfile, /Max-Age=0/);

    const clearPinAttempt = buildClearPinAttemptCookie(req);
    assert.match(clearPinAttempt, /^movie_watch_pin_attempt=/);
    assert.match(clearPinAttempt, /Max-Age=0/);
  });
});
