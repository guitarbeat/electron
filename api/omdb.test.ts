import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  isRateLimited,
  MAX_REQUESTS_PER_WINDOW,
  RATE_LIMIT_WINDOW_MS,
  MAX_RATE_LIMIT_ENTRIES,
  ipRequestCounts,
} from "./omdb.js";

describe("isRateLimited", () => {
  let originalDateNow: typeof Date.now;
  let mockNow: number;

  beforeEach(() => {
    ipRequestCounts.clear();
    originalDateNow = Date.now;
    mockNow = 1000000;
    Date.now = () => mockNow;
  });

  afterEach(() => {
    Date.now = originalDateNow;
    ipRequestCounts.clear();
  });

  it("allows initial requests up to MAX_REQUESTS_PER_WINDOW", () => {
    const ip = "1.2.3.4";

    for (let i = 0; i < MAX_REQUESTS_PER_WINDOW; i++) {
      assert.strictEqual(
        isRateLimited(ip),
        false,
        `Request ${i + 1} should not be rate limited`,
      );
    }

    assert.strictEqual(
      isRateLimited(ip),
      true,
      `Request ${MAX_REQUESTS_PER_WINDOW + 1} should be rate limited`,
    );
  });

  it("resets rate limit window after RATE_LIMIT_WINDOW_MS passes", () => {
    const ip = "1.2.3.4";

    for (let i = 0; i < MAX_REQUESTS_PER_WINDOW; i++) {
      isRateLimited(ip);
    }
    assert.strictEqual(isRateLimited(ip), true);

    // Advance time beyond window
    mockNow += RATE_LIMIT_WINDOW_MS + 1;

    // First request in new window should pass
    assert.strictEqual(isRateLimited(ip), false);
    assert.strictEqual(ipRequestCounts.get(ip)?.count, 1);
  });

  it("tracks different IP addresses independently", () => {
    const ip1 = "10.0.0.1";
    const ip2 = "10.0.0.2";

    for (let i = 0; i < MAX_REQUESTS_PER_WINDOW; i++) {
      isRateLimited(ip1);
    }

    assert.strictEqual(isRateLimited(ip1), true);
    assert.strictEqual(isRateLimited(ip2), false);
  });

  it("cleans up expired records when map reaches MAX_RATE_LIMIT_ENTRIES", () => {
    // Fill map up to max entries with expired entries
    const oldTime = mockNow - RATE_LIMIT_WINDOW_MS - 1000;
    for (let i = 0; i < MAX_RATE_LIMIT_ENTRIES; i++) {
      ipRequestCounts.set(`192.168.0.${i}`, {
        count: 5,
        resetTime: oldTime,
      });
    }

    assert.strictEqual(ipRequestCounts.size, MAX_RATE_LIMIT_ENTRIES);

    // Incoming request for a new IP triggers cleanup of expired records
    const newIp = "10.0.0.99";
    const result = isRateLimited(newIp);

    assert.strictEqual(result, false);
    // All expired records should have been removed, leaving only the new entry
    assert.strictEqual(ipRequestCounts.size, 1);
    assert.strictEqual(ipRequestCounts.has(newIp), true);
  });

  it("evicts oldest entries if map remains at MAX_RATE_LIMIT_ENTRIES with active records", () => {
    // Fill map with non-expired entries
    const futureTime = mockNow + RATE_LIMIT_WINDOW_MS;
    for (let i = 0; i < MAX_RATE_LIMIT_ENTRIES; i++) {
      ipRequestCounts.set(`172.16.0.${i}`, {
        count: 1,
        resetTime: futureTime,
      });
    }

    assert.strictEqual(ipRequestCounts.size, MAX_RATE_LIMIT_ENTRIES);

    // Incoming request for a new IP forces LRU eviction of the oldest entry
    const newIp = "10.1.1.1";
    const result = isRateLimited(newIp);

    assert.strictEqual(result, false);
    assert.strictEqual(ipRequestCounts.size, MAX_RATE_LIMIT_ENTRIES);
    assert.strictEqual(ipRequestCounts.has("172.16.0.0"), false); // Oldest key deleted
    assert.strictEqual(ipRequestCounts.has(newIp), true); // New key present
  });
});
