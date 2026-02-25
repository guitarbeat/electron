import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getEmptyStateMessage } from './utils.ts';

describe('getEmptyStateMessage', () => {
  it('should return "No results match your search." when searchQuery is provided', () => {
    assert.strictEqual(getEmptyStateMessage('something', 'all'), 'No results match your search.');
    assert.strictEqual(
      getEmptyStateMessage('test', 'suggestions'),
      'No results match your search.'
    );
    // Truthy check in original code: '   ' is truthy
    assert.strictEqual(getEmptyStateMessage('   ', 'all'), 'No results match your search.');
  });

  it('should return "No pending suggestions right now." when contentTab is "suggestions" and no searchQuery', () => {
    assert.strictEqual(
      getEmptyStateMessage('', 'suggestions'),
      'No pending suggestions right now.'
    );
  });

  it('should return "No movies in this section yet." for other tabs when no searchQuery', () => {
    assert.strictEqual(getEmptyStateMessage('', 'all'), 'No movies in this section yet.');
    assert.strictEqual(getEmptyStateMessage('', 'to-watch'), 'No movies in this section yet.');
    assert.strictEqual(getEmptyStateMessage('', 'watched'), 'No movies in this section yet.');
  });
});
