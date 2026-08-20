import assert from "node:assert/strict";
import test from "node:test";

import { invalidateSharedStateCache } from "../../../../api/_lib/sharedStateStore.ts";
import { hashPin, verifyStoredPin } from "../../../../api/_lib/session.ts";
import profileHandler, {
  computeNextPinAttemptState,
  profilePinRateLimitConfig,
} from "../../../../api/session/profile.ts";
import sessionHandler from "../../../../api/session.ts";
import { createSharedStateMemoryMock } from "./test/sharedStateMock.ts";

const withUnsetDatabase = async (run: () => Promise<void>) => {
  const previousUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  invalidateSharedStateCache();

  try {
    await run();
  } finally {
    if (typeof previousUrl === "string") {
      process.env.DATABASE_URL = previousUrl;
    } else {
      delete process.env.DATABASE_URL;
    }
    invalidateSharedStateCache();
  }
};

const withPinsStore = async (
  pins: Record<string, string>,
  run: () => Promise<void>,
) => {
  const mock = createSharedStateMemoryMock({
    "pins.json": JSON.stringify(pins),
  });

  try {
    await run();
  } finally {
    mock.dispose();
  }
};

test("session endpoint reports missing PIN coverage when the shared pin store is unavailable", async () => {
  await withUnsetDatabase(async () => {
    const originalWarn = console.warn;
    console.warn = () => {};

    try {
      const response = await sessionHandler(
        new Request("https://example.com/api/session"),
      );

      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        hasAccess: true,
        currentUser: null,
        pinProtectedUsers: [],
        usersMissingPins: ["Aaron", "Electra"],
      });
    } finally {
      console.warn = originalWarn;
    }
  });
});

test("profile endpoint allows selecting a user while reporting missing PIN coverage", async () => {
  await withUnsetDatabase(async () => {
    const originalWarn = console.warn;
    console.warn = () => {};

    try {
      const response = await profileHandler(
        new Request("https://example.com/api/session/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user: "Aaron" }),
        }),
      );

      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        hasAccess: true,
        currentUser: "Aaron",
        pinProtectedUsers: [],
        usersMissingPins: ["Aaron", "Electra"],
      });
    } finally {
      console.warn = originalWarn;
    }
  });
});

test("profile endpoint still requires a PIN for protected users", async () => {
  await withPinsStore(
    {
      Aaron: hashPin("1234"),
    },
    async () => {
      const missingPinResponse = await profileHandler(
        new Request("https://example.com/api/session/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user: "Aaron" }),
        }),
      );

      assert.equal(missingPinResponse.status, 401);
      assert.match(await missingPinResponse.text(), /Incorrect PIN/i);

      const validPinResponse = await profileHandler(
        new Request("https://example.com/api/session/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user: "Aaron", pin: "1234" }),
        }),
      );

      assert.equal(validPinResponse.status, 200);
      assert.deepEqual(await validPinResponse.json(), {
        hasAccess: true,
        currentUser: "Aaron",
        pinProtectedUsers: ["Aaron"],
        usersMissingPins: ["Electra"],
      });
    },
  );
});

test("session endpoint reports both users as missing PINs when pins.json is empty", async () => {
  await withPinsStore({}, async () => {
    const response = await sessionHandler(
      new Request("https://example.com/api/session"),
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      hasAccess: true,
      currentUser: null,
      pinProtectedUsers: [],
      usersMissingPins: ["Aaron", "Electra"],
    });
  });
});

test("PIN lockout state only starts after configured max failures", () => {
  const now = Date.now();
  let failures = 0;

  for (
    let attempt = 1;
    attempt < profilePinRateLimitConfig.maxAttempts;
    attempt += 1
  ) {
    const next = computeNextPinAttemptState(failures, now);
    assert.equal(next.failures, attempt);
    assert.equal(next.lockedUntil, null);
    failures = next.failures;
  }
});

test("PIN lockout state sets lock duration at max failures", () => {
  const now = Date.now();
  const next = computeNextPinAttemptState(
    profilePinRateLimitConfig.maxAttempts - 1,
    now,
  );

  assert.equal(next.failures, profilePinRateLimitConfig.maxAttempts);
  assert.equal(next.lockedUntil, now + profilePinRateLimitConfig.lockoutMs);
});

test("hashPin generates valid PBKDF2 hash format", () => {
  const pin = "1234";
  const hash1 = hashPin(pin);

  assert.equal(typeof hash1, "string");
  const parts = hash1.split(":");
  assert.equal(parts.length, 4);
  assert.equal(parts[0], "pbkdf2");
  assert.equal(parts[1], "100000");
  assert.match(parts[2], /^[0-9a-f]{32}$/); // 16 bytes hex
  assert.match(parts[3], /^[0-9a-f]{64}$/); // 32 bytes hex

  // Verify it uses a random salt (hashing the same pin should result in different hashes)
  const hash2 = hashPin(pin);
  assert.notEqual(hash1, hash2);
});

test("verifyStoredPin correctly verifies valid pins", () => {
  const pin = "5678";
  const hash = hashPin(pin);

  assert.equal(verifyStoredPin(pin, hash), true);
});

test("verifyStoredPin rejects incorrect pins", () => {
  const pin = "5678";
  const hash = hashPin(pin);

  assert.equal(verifyStoredPin("wrong", hash), false);
  assert.equal(verifyStoredPin("5679", hash), false);
});

test("verifyStoredPin rejects malformed hashes gracefully", () => {
  const pin = "1234";

  assert.equal(verifyStoredPin(pin, "invalid:format"), false);
  assert.equal(verifyStoredPin(pin, "notpbkdf2:100000:salt:hash"), false);
  assert.equal(verifyStoredPin(pin, "pbkdf2:100000:salt"), false);
});
