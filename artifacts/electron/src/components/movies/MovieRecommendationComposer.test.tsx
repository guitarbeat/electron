import React from 'react';
import { renderToString } from 'react-dom/server';
import test from 'node:test';
import assert from 'node:assert/strict';

import MovieRecommendationComposer from './MovieRecommendationComposer';
import { MAX_RECOMMENDATION_REASON_LENGTH } from './lib/movieSections';
import type { User } from '@/shared/types';

test('MovieRecommendationComposer', async (t) => {
  await t.test('renders correctly for a logged in user', () => {
    const html = renderToString(
      <MovieRecommendationComposer
        currentUser={"Aaron" as User}
        movieTitle="Inception"
        guestName=""
        reason=""
        error={null}
        isSubmitting={false}
        onGuestNameChange={() => {}}
        onReasonChange={() => {}}
        onSubmit={() => {}}
        onCancel={() => {}}
      />
    );

    assert.match(html, /Send this to Suggestions as Aaron/);
    assert.doesNotMatch(html, /Your Name \(Optional\)/);
    assert.match(html, /Inception/);
  });

  await t.test('renders correctly for a guest user', () => {
    const html = renderToString(
      <MovieRecommendationComposer
        currentUser={null}
        movieTitle="The Matrix"
        guestName=""
        reason=""
        error={null}
        isSubmitting={false}
        onGuestNameChange={() => {}}
        onReasonChange={() => {}}
        onSubmit={() => {}}
        onCancel={() => {}}
      />
    );

    assert.match(html, /Guests can send titles to Suggestions too/);
    assert.match(html, /Your Name \(Optional\)/);
    assert.match(html, /The Matrix/);
  });

  await t.test('displays error message when provided', () => {
    const html = renderToString(
      <MovieRecommendationComposer
        currentUser={null}
        movieTitle="Avatar"
        guestName=""
        reason=""
        error="Failed to send recommendation"
        isSubmitting={false}
        onGuestNameChange={() => {}}
        onReasonChange={() => {}}
        onSubmit={() => {}}
        onCancel={() => {}}
      />
    );

    assert.match(html, /Failed to send recommendation/);
    assert.match(html, /role="alert"/);
  });

  await t.test('displays loading state while submitting', () => {
    const html = renderToString(
      <MovieRecommendationComposer
        currentUser={"Aaron" as User}
        movieTitle="Interstellar"
        guestName=""
        reason=""
        error={null}
        isSubmitting={true}
        onGuestNameChange={() => {}}
        onReasonChange={() => {}}
        onSubmit={() => {}}
        onCancel={() => {}}
      />
    );

    // Check that cancel button is disabled when submitting
    assert.match(html, /disabled=""[^>]*><span class="ui-button__content">Cancel<\/span>/);
  });

  await t.test('calculates remaining characters correctly', () => {
    const reasonText = "This is a great movie!";
    const html = renderToString(
      <MovieRecommendationComposer
        currentUser={"Aaron" as User}
        movieTitle="Interstellar"
        guestName=""
        reason={reasonText}
        error={null}
        isSubmitting={false}
        onGuestNameChange={() => {}}
        onReasonChange={() => {}}
        onSubmit={() => {}}
        onCancel={() => {}}
      />
    );

    const remaining = MAX_RECOMMENDATION_REASON_LENGTH - reasonText.length;
    // Account for React's <!-- --> comment injection between string and number
    assert.match(html, new RegExp(`${remaining}(?:<!-- -->)? characters left`));
  });
});
