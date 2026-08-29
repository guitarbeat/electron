import { describe, it } from "node:test";
import assert from "node:assert";
import { withWebHandler } from "./webHandler.js";
import type { NodeLikeRequest, NodeLikeResponse } from "./nodeBridge.js";

describe("withWebHandler", () => {
  it("should return a 500 Response when handler throws an error in Web Request mode", async () => {
    const failingHandler = withWebHandler(async () => {
      throw new Error("Test handler error");
    });

    const request = new Request("https://example.com/api/test", {
      method: "GET",
    });

    const response = await failingHandler(request);

    assert.ok(response instanceof Response);
    assert.strictEqual(response.status, 500);

    const body = (await response.json()) as { error: string };
    assert.strictEqual(body.error, "Internal Server Error");
  });

  it("should write 500 status and error response to res when handler throws an error in Node-like Request/Response mode", async () => {
    const failingHandler = withWebHandler(async () => {
      throw new Error("Test handler node error");
    });

    const req: NodeLikeRequest = {
      method: "POST",
      url: "/api/test",
      headers: { host: "example.com" },
    };

    let statusCode = 0;
    const headers: Record<string, string | string[]> = {};
    let writtenChunk: string | Uint8Array | Buffer | null = null;

    const res: NodeLikeResponse = {
      get statusCode() {
        return statusCode;
      },
      set statusCode(code: number) {
        statusCode = code;
      },
      setHeader(name: string, value: string | string[]) {
        headers[name.toLowerCase()] = value;
      },
      end(chunk?: Uint8Array | Buffer | string | null) {
        if (chunk !== undefined) {
          writtenChunk = chunk;
        }
      },
    };

    await failingHandler(req, res);

    assert.strictEqual(statusCode, 500);
    assert.ok(writtenChunk !== null);

    const bodyString = Buffer.isBuffer(writtenChunk)
      ? writtenChunk.toString("utf8")
      : String(writtenChunk);
    const body = JSON.parse(bodyString) as { error: string };
    assert.strictEqual(body.error, "Internal Server Error");
  });

  it("should handle happy path in Web Request mode", async () => {
    const happyHandler = withWebHandler(async (req) => {
      return new Response(JSON.stringify({ ok: true, url: req.url }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const request = new Request("https://example.com/api/success", {
      method: "GET",
    });

    const response = await happyHandler(request);

    assert.ok(response instanceof Response);
    assert.strictEqual(response.status, 200);

    const body = (await response.json()) as { ok: boolean; url: string };
    assert.strictEqual(body.ok, true);
    assert.strictEqual(body.url, "https://example.com/api/success");
  });

  it("should handle happy path in Node-like Request/Response mode", async () => {
    const happyHandler = withWebHandler(async () => {
      return new Response(JSON.stringify({ success: true }), {
        status: 201,
        headers: { "X-Custom-Header": "test-value" },
      });
    });

    const req: NodeLikeRequest = {
      method: "GET",
      url: "/api/success",
      headers: { host: "example.com" },
    };

    let statusCode = 0;
    const headers: Record<string, string | string[]> = {};
    let writtenChunk: string | Uint8Array | Buffer | null = null;

    const res: NodeLikeResponse = {
      get statusCode() {
        return statusCode;
      },
      set statusCode(code: number) {
        statusCode = code;
      },
      setHeader(name: string, value: string | string[]) {
        headers[name.toLowerCase()] = value;
      },
      end(chunk?: Uint8Array | Buffer | string | null) {
        if (chunk !== undefined) {
          writtenChunk = chunk;
        }
      },
    };

    await happyHandler(req, res);

    assert.strictEqual(statusCode, 201);
    assert.strictEqual(headers["x-custom-header"], "test-value");
    assert.ok(writtenChunk !== null);

    const bodyString = Buffer.isBuffer(writtenChunk)
      ? writtenChunk.toString("utf8")
      : String(writtenChunk);
    const body = JSON.parse(bodyString) as { success: boolean };
    assert.strictEqual(body.success, true);
  });
});
