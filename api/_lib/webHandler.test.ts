import { describe, it } from "node:test";
import assert from "node:assert";
import { withWebHandler } from "./webHandler.js";
import type { NodeLikeRequest, NodeLikeResponse } from "./nodeBridge.js";

describe("withWebHandler", () => {
  it("should return Response on happy path for Node-like Request without res", async () => {
    const happyHandler = withWebHandler(async (req) => {
      return new Response(JSON.stringify({ ok: true, url: req.url }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const req: NodeLikeRequest = {
      method: "GET",
      url: "/api/success",
      headers: { host: "example.com" },
    };

    const response = await happyHandler(req);

    assert.ok(response instanceof Response);
    assert.strictEqual(response.status, 200);

    const body = (await response.json()) as { ok: boolean; url: string };
    assert.strictEqual(body.ok, true);
    assert.strictEqual(body.url, "https://example.com/api/success");
  });

  it("should write response to res on happy path for Web Request with res", async () => {
    const happyHandler = withWebHandler(async () => {
      return new Response(JSON.stringify({ web: true }), {
        status: 200,
        headers: { "X-Test": "web-res" },
      });
    });

    const request = new Request("https://example.com/api/success", {
      method: "GET",
    });

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

    // @ts-expect-error - passing res with Request
    await happyHandler(request, res);

    assert.strictEqual(statusCode, 200);
    assert.strictEqual(headers["x-test"], "web-res");
    assert.ok(writtenChunk !== null);

    const bodyString = Buffer.isBuffer(writtenChunk)
      ? writtenChunk.toString("utf8")
      : String(writtenChunk);
    const body = JSON.parse(bodyString) as { web: boolean };
    assert.strictEqual(body.web, true);
  });

  it("should return 500 error response when toWebRequest body parsing fails in Node-like Request mode", async () => {
    const handler = withWebHandler(async () => {
      return new Response("OK");
    });

    let errorHandler: ((err: Error) => void) | undefined;

    const req: NodeLikeRequest = {
      method: "POST",
      url: "/api/test",
      headers: { host: "example.com" },
      on(event, listener) {
        if (event === "error") {
          errorHandler = listener as (err: Error) => void;
        }
        if (event === "data" || event === "end") {
          // Trigger error asynchronously when stream listeners are attached
          process.nextTick(() => {
            if (errorHandler) {
              errorHandler(new Error("Stream aborted"));
            }
          });
        }
      },
    };

    const response = await handler(req);

    assert.ok(response instanceof Response);
    assert.strictEqual(response.status, 500);

    const body = (await response.json()) as { error: string };
    assert.strictEqual(body.error, "Internal Server Error");
  });

  it("should write 500 status and error response to res when handler throws an error in Web Request mode with res", async () => {
    const failingHandler = withWebHandler(async () => {
      throw new Error("Test handler web error with res");
    });

    const request = new Request("https://example.com/api/test", {
      method: "GET",
    });

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

    // @ts-expect-error - passing res with Request
    await failingHandler(request, res);

    assert.strictEqual(statusCode, 500);
    assert.ok(writtenChunk !== null);

    const bodyString = Buffer.isBuffer(writtenChunk)
      ? writtenChunk.toString("utf8")
      : String(writtenChunk);
    const body = JSON.parse(bodyString) as { error: string };
    assert.strictEqual(body.error, "Internal Server Error");
  });

  it("should return a 500 Response when handler throws an error in Node-like Request mode without res", async () => {
    const failingHandler = withWebHandler(async () => {
      throw new Error("Test handler error without res");
    });

    const req: NodeLikeRequest = {
      method: "POST",
      url: "/api/test",
      headers: { host: "example.com" },
    };

    const response = await failingHandler(req);

    assert.ok(response instanceof Response);
    assert.strictEqual(response.status, 500);

    const body = (await response.json()) as { error: string };
    assert.strictEqual(body.error, "Internal Server Error");
  });

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
  it("should return a 500 Response when handler throws a non-Error value in Web Request mode", async () => {
    const failingHandler = withWebHandler(async () => {
      throw "String error message";
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

  it("should return a 500 Response when handler throws synchronously in Web Request mode", async () => {
    const failingHandler = withWebHandler(() => {
      throw new Error("Sync handler error");
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
});
