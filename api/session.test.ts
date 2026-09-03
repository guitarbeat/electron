import { describe, it } from "node:test";
import assert from "node:assert";
import sessionHandler from "./session.js";
import { buildProfileCookie } from "./_lib/session.js";

describe("sessionHandler", () => {
  it("should reject non-GET requests with 405 Method Not Allowed", async () => {
    for (const method of ["POST", "PUT", "DELETE", "PATCH"]) {
      const req = new Request("http://localhost/api/session", { method });
      const res = await sessionHandler(req);
      assert.strictEqual(res.status, 405);
      assert.strictEqual(res.headers.get("Allow"), "GET");
      const data = await res.json();
      assert.strictEqual(data.error, "Method not allowed.");
    }
  });

  it("should return unauthenticated session state for GET request without cookie", async () => {
    const req = new Request("http://localhost/api/session", { method: "GET" });
    const res = await sessionHandler(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.hasAccess, false);
    assert.strictEqual(data.currentUser, null);
    assert.deepStrictEqual(data.activeUsers, []);
    assert.ok(Array.isArray(data.pinProtectedUsers));
    assert.ok(Array.isArray(data.usersMissingPins));
  });

  it("should return authenticated session state for GET request with valid profile cookie", async () => {
    const req = new Request("http://localhost/api/session");
    const cookieHeader = buildProfileCookie(req, "Aaron", ["Aaron", "Electra"]);
    const cookieValue = cookieHeader.split(";")[0];

    const authedReq = new Request("http://localhost/api/session", {
      method: "GET",
      headers: { cookie: cookieValue },
    });

    const res = await sessionHandler(authedReq);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.hasAccess, true);
    assert.strictEqual(data.currentUser, "Aaron");
    assert.deepStrictEqual(data.activeUsers, ["Aaron", "Electra"]);
    assert.ok(Array.isArray(data.pinProtectedUsers));
    assert.ok(Array.isArray(data.usersMissingPins));
  });

  it("should return 500 status code with warning when error occurs during state retrieval", async () => {
    const baseReq = new Request("http://localhost/api/session", { method: "GET" });
    const failingReq = new Proxy(baseReq, {
      get(target, prop, receiver) {
        if (prop === "headers") {
          throw new Error("Internal request error");
        }
        return Reflect.get(target, prop, receiver);
      },
    });

    const res = await sessionHandler(failingReq);
    assert.strictEqual(res.status, 500);
    const data = await res.json();
    assert.strictEqual(data.hasAccess, false);
    assert.strictEqual(data.currentUser, null);
    assert.deepStrictEqual(data.pinProtectedUsers, []);
    assert.deepStrictEqual(data.usersMissingPins, []);
    assert.strictEqual(
      data.warning,
      "Session state is temporarily unavailable.",
    );
  });
});
