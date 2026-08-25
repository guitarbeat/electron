import assert from "node:assert/strict";
import test from "node:test";
import {
  isPosterInMemory,
  markPosterLoaded,
  markPosterFailed,
  isPosterFailed,
  getSynchronousPosterUrl,
} from "./posterImageCache";

test("tracks loaded and failed posters in memory", () => {
  const url = "https://m.media-amazon.com/images/M/poster1.jpg";
  assert.equal(isPosterInMemory(url), false);
  assert.equal(isPosterFailed(url), false);

  markPosterLoaded(url);
  assert.equal(isPosterInMemory(url), true);
  assert.equal(isPosterFailed(url), false);
  assert.equal(getSynchronousPosterUrl(url), url);

  const brokenUrl = "https://m.media-amazon.com/images/M/broken.jpg";
  markPosterFailed(brokenUrl);
  assert.equal(isPosterFailed(brokenUrl), true);
  assert.equal(isPosterInMemory(brokenUrl), false);
});
