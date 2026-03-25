import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SYNC_WARNING_CLIENT_NETWORK,
  SYNC_WARNING_OUTBOX,
} from '@/services/stateClient';
import { getSyncBannerContent } from './syncBannerContent.ts';

test('getSyncBannerContent', async (t) => {
  await t.test('returns local-only messaging for degraded sync', () => {
    const content = getSyncBannerContent({ isBlocked: false });

    assert.equal(content.badge, 'Sync paused');
    assert.equal(content.title, 'Sync paused');
    assert.equal(content.tone, 'assertive');
    assert.ok(content.whatItMeans.length > 0);
    assert.ok(content.whatToDo.length > 0);
    assert.ok(content.debugHints.length > 0);
    assert.ok(content.debugHints.some((h) => /shared state could not be synchronized/i.test(h)));
  });

  await t.test('returns action-needed messaging for blocked sync', () => {
    const content = getSyncBannerContent({ isBlocked: true });

    assert.equal(content.badge, 'Action needed');
    assert.equal(content.title, 'Sync conflict');
    assert.equal(content.tone, 'assertive');
    assert.ok(content.debugHints[0]?.includes('remote sync conflict'));
  });

  await t.test('prefers friendly content for caller-provided label', () => {
    const content = getSyncBannerContent({
      isBlocked: false,
      label: 'Places changes are being kept locally until shared sync recovers.',
    });

    assert.ok(content.whatItMeans.length > 0);
    assert.ok(content.whatToDo.length > 0);
    assert.ok(content.debugHints.length > 0);
  });

  await t.test('classifies outbox warnings', () => {
    const content = getSyncBannerContent({ isBlocked: false, label: SYNC_WARNING_OUTBOX });

    assert.ok(content.debugHints.some((h) => /queued/i.test(h)));
    assert.ok(content.whatToDo.length > 0);
  });

  await t.test('classifies client network warnings', () => {
    const content = getSyncBannerContent({ isBlocked: false, label: SYNC_WARNING_CLIENT_NETWORK });

    assert.ok(content.debugHints.some((h) => /\/api\/state/i.test(h)));
    assert.ok(content.whatToDo.length > 0);
  });

  await t.test('classifies GitHub API warnings', () => {
    const content = getSyncBannerContent({
      isBlocked: false,
      label: 'GitHub rejected the Gist read (401/403). Check GITHUB_TOKEN has access to this Gist (required for private Gists).',
    });

    assert.ok(content.debugHints.some((h) => /GitHub API/i.test(h)));
    assert.ok(/token|permission/i.test(content.whatToDo));
  });
});
