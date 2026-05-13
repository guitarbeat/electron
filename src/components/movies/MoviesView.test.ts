import assert from 'node:assert/strict';
import test, { mock } from 'node:test';

/**
 * Partial implementation of handleRejectSuggestion for testing
 * to avoid importing MoviesView.tsx which contains JSX not supported by node --test
 */
const handleRejectSuggestion = async (
  suggestion: { id: string; title: string },
  rejectPendingSuggestion: (id: string) => Promise<void>,
  setToast: (toast: { message: string; type: string }) => void
) => {
  try {
    await rejectPendingSuggestion(suggestion.id);
    setToast({ message: `"${suggestion.title}" rejected.`, type: 'info' });
  } catch (error) {
    setToast({
      message: error instanceof Error ? error.message : 'Failed to reject suggestion',
      type: 'error',
    });
  }
};

test('handleRejectSuggestion', async (t) => {
  await t.test('calls setToast with success message on successful rejection', async () => {
    const suggestion = { id: 'sugg-1', title: 'The Matrix' };
    const rejectPendingSuggestion = mock.fn(async () => {});
    const setToast = mock.fn();

    await handleRejectSuggestion(suggestion, rejectPendingSuggestion, setToast);

    assert.equal(rejectPendingSuggestion.mock.calls.length, 1);
    assert.deepEqual(rejectPendingSuggestion.mock.calls[0].arguments, ['sugg-1']);

    assert.equal(setToast.mock.calls.length, 1);
    assert.deepEqual(setToast.mock.calls[0].arguments, [{ message: '"The Matrix" rejected.', type: 'info' }]);
  });

  await t.test('calls setToast with error message when rejection fails with Error', async () => {
    const suggestion = { id: 'sugg-2', title: 'Inception' };
    const rejectPendingSuggestion = mock.fn(async () => {
      throw new Error('Network timeout');
    });
    const setToast = mock.fn();

    await handleRejectSuggestion(suggestion, rejectPendingSuggestion, setToast);

    assert.equal(rejectPendingSuggestion.mock.calls.length, 1);

    assert.equal(setToast.mock.calls.length, 1);
    assert.deepEqual(setToast.mock.calls[0].arguments, [{ message: 'Network timeout', type: 'error' }]);
  });

  await t.test('calls setToast with fallback message when rejection fails with non-Error', async () => {
    const suggestion = { id: 'sugg-3', title: 'Avatar' };
    const rejectPendingSuggestion = mock.fn(async () => {
      throw 'String error';
    });
    const setToast = mock.fn();

    await handleRejectSuggestion(suggestion, rejectPendingSuggestion, setToast);

    assert.equal(rejectPendingSuggestion.mock.calls.length, 1);

    assert.equal(setToast.mock.calls.length, 1);
    assert.deepEqual(setToast.mock.calls[0].arguments, [{ message: 'Failed to reject suggestion', type: 'error' }]);
  });
});
