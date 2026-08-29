import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildClearPinAttemptCookie,
  buildClearProfileCookie,
  buildPinAttemptCookie,
  buildProfileCookie,
  getPinAttemptState,
  getSessionState,
  hasAccessSession,
  hashPin,
  requireAccessUser,
  requireProfileUser,
  verifyStoredPin,
} from "./session.js";

const createMockRequest = (
  cookieHeader?: string,
  options: { url?: string; headers?: Record<string, string> } = {},
): Request => {
  const headers = new Headers(options.headers || {});
  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }
  return new Request(options.url || "http://localhost/api/test", {
    headers,
  });
};

const extractCookieValue = (cookieHeader: string, cookieName: string): string => {
  const parts = cookieHeader.split("; ");
  const match = parts.find((p) => p.startsWith(`${cookieName}=`));
  return match ? match.slice(`${cookieName}=`.length) : "";
};

test("buildProfileCookie and getSessionState with valid user profile", () => {
  const req = createMockRequest();
  const cookieHeader = buildProfileCookie(req, "Aaron");

  assert.match(cookieHeader, /^movie_watch_profile=/);
  assert.match(cookieHeader, /Path=\//);
  assert.match(cookieHeader, /HttpOnly/);
  assert.match(cookieHeader, /SameSite=Lax/);
  assert.match(cookieHeader, /Max-Age=604800/);

  const reqWithCookie = createMockRequest(cookieHeader);
  const sessionState = getSessionState(reqWithCookie);

  assert.strictEqual(sessionState.hasAccess, true);
  assert.strictEqual(sessionState.currentUser, "Aaron");
  assert.strictEqual(requireProfileUser(reqWithCookie), "Aaron");
  assert.strictEqual(requireAccessUser(reqWithCookie), "Aaron");
});

test("buildProfileCookie includes Secure attribute when HTTPS is used", () => {
  const req = createMockRequest(undefined, {
    url: "https://localhost/api/test",
  });
  const cookieHeader = buildProfileCookie(req, "Electra");
  assert.match(cookieHeader, /Secure/);

  const reqForwarded = createMockRequest(undefined, {
    headers: { "x-forwarded-proto": "https" },
  });
  const cookieHeaderForwarded = buildProfileCookie(reqForwarded, "Electra");
  assert.match(cookieHeaderForwarded, /Secure/);
});

test("buildClearProfileCookie creates an expired cookie header", () => {
  const req = createMockRequest();
  const cookieHeader = buildClearProfileCookie(req);

  assert.match(cookieHeader, /^movie_watch_profile=;/);
  assert.match(cookieHeader, /Max-Age=0/);
});

test("getSessionState returns null currentUser when no cookie is present", () => {
  const req = createMockRequest();
  const state = getSessionState(req);

  assert.strictEqual(state.hasAccess, true);
  assert.strictEqual(state.currentUser, null);
  assert.strictEqual(requireProfileUser(req), null);
  assert.strictEqual(requireAccessUser(req), null);
});

test("getSessionState returns null currentUser for malformed or tampered token", () => {
  // Token missing dot separator
  const req1 = createMockRequest("movie_watch_profile=invalidtokenwithoutdot");
  assert.strictEqual(getSessionState(req1).currentUser, null);

  // Valid cookie structure, but payload/signature tampered
  const reqValid = createMockRequest();
  const validCookie = buildProfileCookie(reqValid, "Aaron");
  const cookieVal = extractCookieValue(validCookie, "movie_watch_profile");
  const [payload, sig] = cookieVal.split(".");

  // Modify payload
  const tamperedPayloadCookie = `movie_watch_profile=${payload}extra.${sig}`;
  assert.strictEqual(
    getSessionState(createMockRequest(tamperedPayloadCookie)).currentUser,
    null,
  );

  // Modify signature
  const tamperedSigCookie = `movie_watch_profile=${payload}.${sig.slice(0, -1)}X`;
  assert.strictEqual(
    getSessionState(createMockRequest(tamperedSigCookie)).currentUser,
    null,
  );
});

test("getSessionState returns null currentUser for expired token", async () => {
  // Create payload manually with past exp
  const expiredPayload = {
    type: "profile",
    user: "Aaron",
    exp: Math.floor(Date.now() / 1000) - 3600,
  };
  const encodedPayload = Buffer.from(JSON.stringify(expiredPayload)).toString(
    "base64url",
  );

  // Use session secret matching getSessionSigningSecret (in test environment, process.env.NODE_ENV === "test")
  const crypto = await import("node:crypto");
  const signature = crypto
    .createHmac("sha256", "test-session-signing-secret")
    .update(encodedPayload)
    .digest("base64url");

  const expiredCookie = `movie_watch_profile=${encodedPayload}.${signature}`;
  const req = createMockRequest(expiredCookie);

  assert.strictEqual(getSessionState(req).currentUser, null);
});

test("getSessionState returns null for invalid user or invalid JSON payload", async () => {
  const crypto = await import("node:crypto");
  const secret = "test-session-signing-secret";

  // Invalid user payload
  const invalidUserPayload = {
    type: "profile",
    user: "UnknownUser",
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  const encoded1 = Buffer.from(JSON.stringify(invalidUserPayload)).toString(
    "base64url",
  );
  const sig1 = crypto
    .createHmac("sha256", secret)
    .update(encoded1)
    .digest("base64url");
  assert.strictEqual(
    getSessionState(createMockRequest(`movie_watch_profile=${encoded1}.${sig1}`))
      .currentUser,
    null,
  );

  // Non-JSON encoded payload
  const nonJsonEncoded = Buffer.from("not-valid-json").toString("base64url");
  const sig2 = crypto
    .createHmac("sha256", secret)
    .update(nonJsonEncoded)
    .digest("base64url");
  assert.strictEqual(
    getSessionState(
      createMockRequest(`movie_watch_profile=${nonJsonEncoded}.${sig2}`),
    ).currentUser,
    null,
  );
});

test("buildPinAttemptCookie and getPinAttemptState with valid payload", () => {
  const req = createMockRequest();
  const cookieHeader = buildPinAttemptCookie(req, {
    user: "Electra",
    failures: 2,
    lockUntil: 1700000000,
  });

  assert.match(cookieHeader, /^movie_watch_pin_attempt=/);
  assert.match(cookieHeader, /Max-Age=600/);

  const reqWithCookie = createMockRequest(cookieHeader);
  const pinState = getPinAttemptState(reqWithCookie);

  assert.deepStrictEqual(pinState, {
    user: "Electra",
    failures: 2,
    lockUntil: 1700000000,
  });
});

test("buildClearPinAttemptCookie creates an expired pin attempt cookie", () => {
  const req = createMockRequest();
  const cookieHeader = buildClearPinAttemptCookie(req);

  assert.match(cookieHeader, /^movie_watch_pin_attempt=;/);
  assert.match(cookieHeader, /Max-Age=0/);
});

test("getPinAttemptState returns null for invalid payload structures", async () => {
  const crypto = await import("node:crypto");
  const secret = "test-session-signing-secret";

  // Invalid failures (negative number)
  const invalidFailuresPayload = {
    type: "pin_attempt",
    user: "Aaron",
    failures: -1,
    lockUntil: null,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  const encoded1 = Buffer.from(
    JSON.stringify(invalidFailuresPayload),
  ).toString("base64url");
  const sig1 = crypto
    .createHmac("sha256", secret)
    .update(encoded1)
    .digest("base64url");
  assert.strictEqual(
    getPinAttemptState(
      createMockRequest(`movie_watch_pin_attempt=${encoded1}.${sig1}`),
    ),
    null,
  );

  // Invalid lockUntil (negative number)
  const invalidLockUntilPayload = {
    type: "pin_attempt",
    user: "Aaron",
    failures: 1,
    lockUntil: -500,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  const encoded2 = Buffer.from(
    JSON.stringify(invalidLockUntilPayload),
  ).toString("base64url");
  const sig2 = crypto
    .createHmac("sha256", secret)
    .update(encoded2)
    .digest("base64url");
  assert.strictEqual(
    getPinAttemptState(
      createMockRequest(`movie_watch_pin_attempt=${encoded2}.${sig2}`),
    ),
    null,
  );
});

test("hasAccessSession returns true", () => {
  assert.strictEqual(hasAccessSession(), true);
  assert.strictEqual(hasAccessSession(createMockRequest()), true);
});

test("hashPin and verifyStoredPin", () => {
  const pin = "1234";
  const hash = hashPin(pin);

  assert.match(hash, /^pbkdf2:100000:[0-9a-f]+:[0-9a-f]+$/);
  assert.strictEqual(verifyStoredPin(pin, hash), true);
  assert.strictEqual(verifyStoredPin("9999", hash), false);
});

test("verifyStoredPin handles invalid hash string formats", () => {
  assert.strictEqual(verifyStoredPin("1234", "invalid-hash-string"), false);
  assert.strictEqual(
    verifyStoredPin("1234", "sha256:100000:salt:hashvalue"),
    false,
  );
  assert.strictEqual(verifyStoredPin("1234", "pbkdf2:100000:salt"), false);
});
