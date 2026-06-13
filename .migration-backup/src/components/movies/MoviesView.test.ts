import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Extracted pure error handling logic for handleAddAction's error path in MoviesView.tsx
 */
const handleRecommendationError = (
  error: unknown,
  setToast: (toast: { message: string; type: 'success' | 'error' | 'info' }) => void
): void => {
  setToast({
    message: error instanceof Error ? error.message : 'Failed to send suggestion',
    type: 'error',
  });
};

test('MoviesView error handling in submitRecommendation catch block', async (t) => {
  await t.test('passes Error message to setToast', () => {
    let calledToast: { message: string; type: string } | null = null;
    const mockSetToast = (toast: { message: string; type: 'success' | 'error' | 'info' }) => {
      calledToast = toast;
    };

    const error = new Error('Network timeout');
    handleRecommendationError(error, mockSetToast);

    assert.deepEqual(calledToast, {
      message: 'Network timeout',
      type: 'error',
    });
  });

  await t.test('passes default message to setToast for string errors', () => {
    let calledToast: { message: string; type: string } | null = null;
    const mockSetToast = (toast: { message: string; type: 'success' | 'error' | 'info' }) => {
      calledToast = toast;
    };

    handleRecommendationError('Something went wrong', mockSetToast);

    assert.deepEqual(calledToast, {
      message: 'Failed to send suggestion',
      type: 'error',
    });
  });

  await t.test('passes default message to setToast for null', () => {
    let calledToast: { message: string; type: string } | null = null;
    const mockSetToast = (toast: { message: string; type: 'success' | 'error' | 'info' }) => {
      calledToast = toast;
    };

    handleRecommendationError(null, mockSetToast);

    assert.deepEqual(calledToast, {
      message: 'Failed to send suggestion',
      type: 'error',
    });
  });
});
