import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SHARED_SUGGESTION_BY_PARAM,
  SHARED_SUGGESTION_TITLE_PARAM,
  buildSharedSuggestionUrl,
  clearSharedSuggestionParams,
  parseSharedSuggestionIntent,
} from './sharedSuggestion.ts';

test('parseSharedSuggestionIntent', async (t) => {
  await t.test('reads a valid shared suggestion from the URL query string', () => {
    const intent = parseSharedSuggestionIntent(
      '?sharedMovie=Before%20Sunrise&sharedBy=Aaron'
    );

    assert.deepEqual(intent, {
      title: 'Before Sunrise',
      suggestedBy: 'Aaron',
    });
  });

  await t.test('falls back to a neutral suggester name when none is provided', () => {
    const intent = parseSharedSuggestionIntent('?sharedMovie=The%20Holiday');

    assert.deepEqual(intent, {
      title: 'The Holiday',
      suggestedBy: 'Someone',
    });
  });

  await t.test('returns null when no shared movie title is present', () => {
    assert.equal(parseSharedSuggestionIntent('?sharedBy=Electra'), null);
  });
});

test('buildSharedSuggestionUrl', async (t) => {
  await t.test('adds shared suggestion params while preserving the rest of the URL', () => {
    const nextUrl = buildSharedSuggestionUrl(
      'https://example.com/app?tab=queue#watchlist',
      {
        title: 'Past Lives',
        suggestedBy: 'Electra',
      }
    );

    const url = new URL(nextUrl);

    assert.equal(url.searchParams.get('tab'), 'queue');
    assert.equal(url.searchParams.get(SHARED_SUGGESTION_TITLE_PARAM), 'Past Lives');
    assert.equal(url.searchParams.get(SHARED_SUGGESTION_BY_PARAM), 'Electra');
    assert.equal(url.hash, '#watchlist');
  });
});

test('clearSharedSuggestionParams', async (t) => {
  await t.test('removes only the shared suggestion params', () => {
    const nextUrl = clearSharedSuggestionParams(
      'https://example.com/app?tab=queue&sharedMovie=Past%20Lives&sharedBy=Electra'
    );

    const url = new URL(nextUrl);

    assert.equal(url.searchParams.get('tab'), 'queue');
    assert.equal(url.searchParams.has(SHARED_SUGGESTION_TITLE_PARAM), false);
    assert.equal(url.searchParams.has(SHARED_SUGGESTION_BY_PARAM), false);
  });
});
