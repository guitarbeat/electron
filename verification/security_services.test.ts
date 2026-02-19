import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addSuggestion } from '../services/suggestionService';
import { addMemory } from '../services/memoryService';
import { extractSafeMetadata } from '../hooks/useMovies';

// Mock fetch globally
// @ts-expect-error - Mocking global fetch
global.fetch = async (url, options) => {
  if (options && options.method === 'PATCH') {
    return {
      ok: true,
      json: async () => ({}),
    };
  }
  // GET
  return {
    ok: true,
    json: async () => ({
      files: {
        'suggestions.json': { content: '[]' },
        'memories.json': { content: '[]' },
      },
    }),
  };
};

test('security: addSuggestion should sanitize input', async () => {
  const dirtyTitle = 'Dirty\x07Title';
  const dirtyUser = 'Dirty\x07User';

  const result = await addSuggestion(dirtyTitle, dirtyUser);

  if (result.title.includes('\x07')) {
    console.log('FAIL: Suggestion title contains control characters');
  } else {
    console.log('PASS: Suggestion title was sanitized');
  }

  assert.equal(result.title.includes('\x07'), false, 'Suggestion title should be sanitized');
});

test('security: addMemory should sanitize input', async () => {
  const dirtyNote = 'Dirty\x07Note';

  const result = await addMemory('1', 'Movie', 'User', dirtyNote);

  if (result.note.includes('\x07')) {
    console.log('FAIL: Memory note contains control characters');
  } else {
    console.log('PASS: Memory note was sanitized');
  }

  assert.equal(result.note.includes('\x07'), false, 'Memory note should be sanitized');
});

test('security: extractSafeMetadata should sanitize fields', async () => {
  const dirtyMetadata = {
    plot: 'Dirty\x07Plot',
    genre: 'Dirty\x07Genre',
    director: 'Dirty\x07Director',
  };

  // @ts-expect-error - dirtyMetadata is incomplete MetadataResult
  const result = extractSafeMetadata(dirtyMetadata);

  if (result.plot.includes('\x07')) {
    console.log('FAIL: Plot contains control characters');
  } else {
    console.log('PASS: Plot was sanitized');
  }

  assert.equal(result.plot.includes('\x07'), false, 'Plot should be sanitized');
  assert.equal(result.genre.includes('\x07'), false, 'Genre should be sanitized');
  assert.equal(result.director.includes('\x07'), false, 'Director should be sanitized');
});
