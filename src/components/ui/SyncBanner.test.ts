import assert from 'node:assert/strict';
import test from 'node:test';
import { getSyncBannerContent } from './syncBannerContent.ts';

test('getSyncBannerContent', async (t) => {
  await t.test('returns local-only messaging for degraded sync', () => {
    const content = getSyncBannerContent({ isBlocked: false });

    assert.equal(content.badge, 'Error');
    assert.equal(content.title, 'Shared sync is unavailable');
    assert.equal(content.description, 'Changes are being kept locally until the shared state comes back.');
    assert.equal(content.tone, 'assertive');
    assert.ok(content.debugHints.length > 0);
  });

  await t.test('returns action-needed messaging for blocked sync', () => {
    const content = getSyncBannerContent({ isBlocked: true });

    assert.equal(content.badge, 'Action needed');
    assert.equal(content.title, 'Sync conflict detected');
    assert.equal(content.description, 'Remote changes conflicted with local changes. Refresh and retry.');
    assert.equal(content.tone, 'assertive');
    assert.ok(content.debugHints[0]?.includes('remote sync conflict'));
  });

  await t.test('prefers a caller-provided label', () => {
    const content = getSyncBannerContent({
      isBlocked: false,
      label: 'Places changes are being kept locally until shared sync recovers.',
    });

    assert.equal(content.description, 'Places changes are being kept locally until shared sync recovers.');
    assert.ok(content.debugHints.length > 0);
  });
});
