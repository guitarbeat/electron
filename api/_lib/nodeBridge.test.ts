import assert from "node:assert/strict";
import test from "node:test";
import { toWebRequest } from "./nodeBridge.js";

test("toWebRequest preserves an unencrypted local request protocol", async () => {
  const request = await toWebRequest({
    method: "POST",
    url: "/api/session/profile",
    headers: {
      host: "127.0.0.1:3000",
      origin: "http://127.0.0.1:3000",
    },
    socket: { encrypted: false },
  });

  assert.equal(request.url, "http://127.0.0.1:3000/api/session/profile");
  assert.equal(request.headers.get("origin"), "http://127.0.0.1:3000");
});

test("toWebRequest trusts the deployment proxy protocol when supplied", async () => {
  const request = await toWebRequest({
    method: "GET",
    url: "/api/session",
    headers: {
      host: "internal:3000",
      "x-forwarded-host": "electron.alw.lol",
      "x-forwarded-proto": "https",
    },
    socket: { encrypted: false },
  });

  assert.equal(request.url, "https://electron.alw.lol/api/session");
});
