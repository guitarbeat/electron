import test from 'node:test';
import assert from 'node:assert/strict';
import { saveSuggestions, getSuggestions } from './suggestionService.ts';
import type { MovieSuggestion } from '../types.ts';
import { GIST_SUGGESTIONS_FILENAME } from '../gistConfig.ts';

test('saveSuggestions sends correct data structure', async (t) => {
  const suggestions: MovieSuggestion[] = [
    {
      id: '1',
      title: 'Test Movie',
      suggestedBy: 'User',
      status: 'pending',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  let capturedBody: any = null;

  t.mock.method(global, 'fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.method === 'PATCH') {
      capturedBody = JSON.parse(init.body as string);
      return { ok: true, json: async () => ({}) } as Response;
    }
    return { ok: false, status: 404 } as Response;
  });

  await saveSuggestions(suggestions);

  assert.ok(capturedBody, 'Fetch should have been called with a body');
  assert.ok(capturedBody.files, 'Body should contain files object');
  assert.ok(
    capturedBody.files[GIST_SUGGESTIONS_FILENAME],
    'Body should contain the correct filename'
  );

  const fileContent = capturedBody.files[GIST_SUGGESTIONS_FILENAME].content;
  const parsedContent = JSON.parse(fileContent);

  assert.deepEqual(parsedContent, suggestions, 'Saved content should match original data');
});

test('getSuggestions parses response correctly', async (t) => {
  const mockData: MovieSuggestion[] = [
    {
      id: '2',
      title: 'Another Movie',
      suggestedBy: 'User2',
      status: 'approved',
      createdAt: '2024-01-02T00:00:00.000Z',
    },
  ];

  t.mock.method(global, 'fetch', async () => {
    return {
      ok: true,
      json: async () => ({
        files: {
          [GIST_SUGGESTIONS_FILENAME]: {
            content: JSON.stringify(mockData),
          },
        },
      }),
    } as Response;
  });

  const result = await getSuggestions();
  assert.deepEqual(result, mockData, 'getSuggestions should return parsed data');
});
