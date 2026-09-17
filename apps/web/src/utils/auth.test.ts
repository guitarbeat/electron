import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  parseTokenPayload,
  isTokenExpired,
  validateToken,
  isTokenValid,
  saveAuthSession,
  getStoredAuthSession,
  getStoredAuthSessionSync,
  clearStoredAuth,
  reauthenticate,
  __resetAuthStoreForTesting,
  type ProfileTokenPayload,
} from "./auth.js";
import type { SessionState } from "../services/state/index.js";

const createMockToken = (
  payload: Partial<ProfileTokenPayload> & { exp?: number; type?: string },
  signature = "valid-mock-sig",
): string => {
  const finalPayload: ProfileTokenPayload = {
    type: payload.type ?? "profile",
    user: payload.user ?? "Aaron",
    users: payload.users ?? ["Aaron"],
    exp: payload.exp ?? Math.floor(Date.now() / 1000) + 3600,
  };
  const json = JSON.stringify(finalPayload);
  const base64 = Buffer.from(json, "utf8").toString("base64url");
  return `${base64}.${signature}`;
};

describe("auth utility (token validation and persistence)", () => {
  beforeEach(() => {
    __resetAuthStoreForTesting();
  });

  describe("Token parsing & validation", () => {
    it("parses valid token payload properly", () => {
      const token = createMockToken({ user: "Electra", users: ["Aaron", "Electra"] });
      const payload = parseTokenPayload(token);

      assert.ok(payload);
      assert.equal(payload.type, "profile");
      assert.equal(payload.user, "Electra");
      assert.deepEqual(payload.users, ["Aaron", "Electra"]);
      assert.ok(payload.exp > 0);
    });

    it("handles null, empty, or malformed tokens safely", () => {
      assert.equal(parseTokenPayload(null), null);
      assert.equal(parseTokenPayload(undefined), null);
      assert.equal(parseTokenPayload(""), null);
      assert.equal(parseTokenPayload("invalid-no-dot"), null);
      assert.equal(parseTokenPayload("bad-base64.signature"), null);
    });

    it("identifies expired tokens correctly", () => {
      const pastExp = Math.floor(Date.now() / 1000) - 60;
      const expiredToken = createMockToken({ exp: pastExp });

      assert.equal(isTokenExpired(expiredToken), true);
      assert.equal(isTokenValid(expiredToken), false);

      const validation = validateToken(expiredToken);
      assert.equal(validation.isValid, false);
      assert.equal(validation.isExpired, true);
    });

    it("identifies valid, fresh tokens correctly", () => {
      const futureExp = Math.floor(Date.now() / 1000) + 7200;
      const freshToken = createMockToken({ exp: futureExp });

      assert.equal(isTokenExpired(freshToken), false);
      assert.equal(isTokenValid(freshToken), true);

      const validation = validateToken(freshToken);
      assert.equal(validation.isValid, true);
      assert.equal(validation.isExpired, false);
      assert.ok(validation.timeRemainingMs > 0);
      assert.ok(validation.expiresAt instanceof Date);
    });

    it("accounts for expiration buffer threshold", () => {
      // Token expires in 15 seconds, default buffer is 30 seconds
      const soonExp = Math.floor(Date.now() / 1000) + 15;
      const expiringSoonToken = createMockToken({ exp: soonExp });

      assert.equal(isTokenExpired(expiringSoonToken, 30), true);
      assert.equal(isTokenExpired(expiringSoonToken, 5), false);
    });

    it("rejects token with unexpected type", () => {
      const pinAttemptToken = createMockToken({ type: "pin_attempt" });
      const validation = validateToken(pinAttemptToken);

      assert.equal(validation.isValid, false);
      assert.ok(validation.error?.includes("Unexpected token type"));
    });
  });

  describe("Persistent session storage", () => {
    const mockSession: SessionState = {
      hasAccess: true,
      currentUser: "Aaron",
      activeUsers: ["Aaron"],
      pinProtectedUsers: [],
      usersMissingPins: [],
    };

    it("saves and restores session synchronously and asynchronously", async () => {
      const token = createMockToken({ user: "Aaron" });
      await saveAuthSession(mockSession, token);

      const syncResult = getStoredAuthSessionSync();
      assert.ok(syncResult);
      assert.equal(syncResult.token, token);
      assert.equal(syncResult.session?.currentUser, "Aaron");
      assert.equal(syncResult.session?.hasAccess, true);

      const asyncResult = await getStoredAuthSession();
      assert.ok(asyncResult);
      assert.equal(asyncResult.token, token);
      assert.equal(asyncResult.session?.currentUser, "Aaron");
    });

    it("clears stored authentication properly", async () => {
      const token = createMockToken({ user: "Aaron" });
      await saveAuthSession(mockSession, token);

      assert.ok(getStoredAuthSessionSync());

      await clearStoredAuth();

      assert.equal(getStoredAuthSessionSync(), null);
      assert.equal(await getStoredAuthSession(), null);
    });
  });

  describe("Re-authentication flow", () => {
    it("successfully re-authenticates against 200 session endpoint", async () => {
      const token = createMockToken({ user: "Aaron" });
      const serverSession: SessionState = {
        hasAccess: true,
        currentUser: "Aaron",
        activeUsers: ["Aaron"],
        pinProtectedUsers: [],
        usersMissingPins: [],
        token,
      };

      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = (async () => {
          return new Response(JSON.stringify(serverSession), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }) as typeof fetch;

        const result = await reauthenticate({ token });
        assert.equal(result.success, true);
        assert.equal(result.session?.currentUser, "Aaron");
        assert.equal(result.token, token);

        // Verification that it was saved to storage
        const stored = await getStoredAuthSession();
        assert.equal(stored?.session?.currentUser, "Aaron");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("clears storage when server returns 401 Unauthorized", async () => {
      const token = createMockToken({ user: "Aaron" });
      const initialSession: SessionState = {
        hasAccess: true,
        currentUser: "Aaron",
        activeUsers: ["Aaron"],
        pinProtectedUsers: [],
        usersMissingPins: [],
      };
      await saveAuthSession(initialSession, token);

      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = (async () => {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }) as typeof fetch;

        const result = await reauthenticate({ token });
        assert.equal(result.success, false);
        assert.equal(result.session, null);
        assert.equal(result.token, null);

        // Storage was cleared
        assert.equal(await getStoredAuthSession(), null);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("retains stored session during transient network failures", async () => {
      const token = createMockToken({ user: "Electra" });
      const initialSession: SessionState = {
        hasAccess: true,
        currentUser: "Electra",
        activeUsers: ["Electra"],
        pinProtectedUsers: [],
        usersMissingPins: [],
      };
      await saveAuthSession(initialSession, token);

      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = (async () => {
          throw new Error("Network unreachable");
        }) as typeof fetch;

        const result = await reauthenticate({ token });
        assert.equal(result.success, false);
        // Does NOT clear session on network drops
        assert.equal(result.session?.currentUser, "Electra");
        assert.equal(result.token, token);

        // Retained in storage
        const stored = await getStoredAuthSession();
        assert.equal(stored?.session?.currentUser, "Electra");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});
