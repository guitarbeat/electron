import { describe, it } from "node:test";
import assert from "node:assert";
import { requestIp } from "./agent.js";

describe("requestIp", () => {
  it("extracts a single IP from x-forwarded-for header", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.195" },
    });
    assert.strictEqual(requestIp(req), "203.0.113.195");
  });

  it("extracts the right-most (proxy appended) IP when multiple IPs are present in x-forwarded-for", () => {
    const req = new Request("http://localhost", {
      headers: {
        "x-forwarded-for": "10.0.0.1, 192.168.1.1, 203.0.113.195",
      },
    });
    assert.strictEqual(requestIp(req), "203.0.113.195");
  });

  it("prevents client IP spoofing by ignoring client-prepended IPs in x-forwarded-for", () => {
    // Client sends '127.0.0.1' (spoofed), proxy appends '198.51.100.42'
    const req = new Request("http://localhost", {
      headers: {
        "x-forwarded-for": "127.0.0.1, 198.51.100.42",
      },
    });
    assert.strictEqual(requestIp(req), "198.51.100.42");
  });

  it("falls back to x-real-ip if x-forwarded-for is missing", () => {
    const req = new Request("http://localhost", {
      headers: { "x-real-ip": "198.51.100.1" },
    });
    assert.strictEqual(requestIp(req), "198.51.100.1");
  });

  it("falls back to x-real-ip if x-forwarded-for is empty or whitespace", () => {
    const req = new Request("http://localhost", {
      headers: {
        "x-forwarded-for": "   ",
        "x-real-ip": "198.51.100.1",
      },
    });
    assert.strictEqual(requestIp(req), "198.51.100.1");
  });

  it("returns 'unknown' if neither header is present", () => {
    const req = new Request("http://localhost");
    assert.strictEqual(requestIp(req), "unknown");
  });

  it("truncates the extracted IP if it exceeds 128 characters", () => {
    const longIp = "a".repeat(200);
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": longIp },
    });
    assert.strictEqual(requestIp(req).length, 128);
    assert.strictEqual(requestIp(req), "a".repeat(128));
  });
});
