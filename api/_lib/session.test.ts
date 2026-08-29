import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildProfileCookie, hasAccessSession } from "./session.js";

describe("hasAccessSession", () => {
  it("returns false when no request is provided", () => {
    assert.equal(hasAccessSession(), false);
  });

  it("returns false when request has no cookies or invalid cookies", () => {
    const req1 = new Request("http://localhost/api/state/suggestions");
    assert.equal(hasAccessSession(req1), false);

    const req2 = new Request("http://localhost/api/state/suggestions", {
      headers: { cookie: "movie_watch_profile=invalid-token" },
    });
    assert.equal(hasAccessSession(req2), false);
  });

  it("returns true when request has a valid profile cookie", () => {
    const dummyReq = new Request("http://localhost/api/session/profile");
    const cookieHeaderValue = buildProfileCookie(dummyReq, "Aaron");
    const tokenPart = cookieHeaderValue.split(";")[0];

    const req = new Request("http://localhost/api/state/suggestions", {
      headers: { cookie: tokenPart },
    });
    assert.equal(hasAccessSession(req), true);
  });
});
