import { describe, it } from "node:test";
import assert from "node:assert";
import agentHandler, { requestIp } from "./agent.js";
import { installSharedStateMemoryStoreForTests } from "./_lib/sharedStateStore.js";

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


describe("publicCatalog caching and response", () => {
  it("returns 200 catalog response and uses cache when version matches", async () => {
    const memoryStore = installSharedStateMemoryStoreForTests({
      "movielist.json": JSON.stringify([
        { id: "m2", title: "Zebra Movie", addedBy: "Aaron", createdAt: "2025-01-01T00:00:00Z", category: "Must Watch" },
        { id: "m1", title: "Alpha Movie", addedBy: "Aaron", createdAt: "2025-01-01T00:00:00Z", category: "Must Watch" },
      ]),
    });

    try {
      const req1 = new Request("http://localhost/api/agent/v1/catalog/movies");
      const res1 = await agentHandler(req1);
      assert.strictEqual(res1.status, 200);
      const json1 = (await res1.json()) as { data: Array<{ id: string; title: string }> };
      assert.strictEqual(json1.data.length, 2);
      assert.strictEqual(json1.data[0].title, "Alpha Movie");
      assert.strictEqual(json1.data[1].title, "Zebra Movie");

      // Request again to hit cache
      const req2 = new Request("http://localhost/api/agent/v1/catalog/movies");
      const res2 = await agentHandler(req2);
      assert.strictEqual(res2.status, 200);
      const json2 = (await res2.json()) as { data: Array<{ id: string; title: string }> };
      assert.deepStrictEqual(json1, json2);
    } finally {
      memoryStore.dispose();
    }
  });

  it("returns 404 for unknown catalog resource", async () => {
    const req = new Request("http://localhost/api/agent/v1/catalog/unknown");
    const res = await agentHandler(req);
    assert.strictEqual(res.status, 404);
  });
});
