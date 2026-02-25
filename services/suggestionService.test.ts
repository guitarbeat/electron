import assert from 'node:assert/strict';
import test, { mock, describe, beforeEach, afterEach } from 'node:test';
import { getSuggestions, saveSuggestions, addSuggestion } from './suggestionService.ts';
import { GIST_SUGGESTIONS_FILENAME } from '../gistConfig.ts';
import type { MovieSuggestion } from '../types.ts';

// Helper to create a successful fetch response
const mockResponse = (data: unknown, ok = true, status = 200) =>
  ({
    ok,
    status,
    json: async () => data,
  }) as Response;

describe('suggestionService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fetchMock: any;

  beforeEach(() => {
    fetchMock = mock.method(global, 'fetch');
  });

  afterEach(() => {
    fetchMock.mock.restore();
  });

  describe('getSuggestions', () => {
    test('returns empty array if file content is missing', async () => {
      fetchMock.mock.mockImplementation(async () =>
        mockResponse({
          files: { [GIST_SUGGESTIONS_FILENAME]: null },
        })
      );

      const result = await getSuggestions();
      assert.deepEqual(result, []);
    });

    test('returns empty array if file content is empty string', async () => {
      fetchMock.mock.mockImplementation(async () =>
        mockResponse({
          files: { [GIST_SUGGESTIONS_FILENAME]: { content: '' } },
        })
      );

      const result = await getSuggestions();
      assert.deepEqual(result, []);
    });

    test('returns parsed suggestions if content exists', async () => {
      const suggestions: MovieSuggestion[] = [
        {
          id: '1',
          title: 'Test Movie',
          suggestedBy: 'Tester',
          status: 'pending',
          createdAt: '2023-01-01T00:00:00.000Z',
        },
      ];
      fetchMock.mock.mockImplementation(async () =>
        mockResponse({
          files: { [GIST_SUGGESTIONS_FILENAME]: { content: JSON.stringify(suggestions) } },
        })
      );

      const result = await getSuggestions();
      assert.deepEqual(result, suggestions);
    });

    test('throws error on API failure', async () => {
      fetchMock.mock.mockImplementation(async () =>
        mockResponse({ message: 'Not Found' }, false, 404)
      );

      await assert.rejects(async () => getSuggestions(), {
        message: 'GitHub API responded with 404',
      });
    });
  });

  describe('saveSuggestions', () => {
    test('saves suggestions successfully', async () => {
      fetchMock.mock.mockImplementation(async () => mockResponse({}));

      const suggestions: MovieSuggestion[] = [
        {
          id: '1',
          title: 'Test Movie',
          suggestedBy: 'Tester',
          status: 'pending',
          createdAt: '2023-01-01T00:00:00.000Z',
        },
      ];
      await saveSuggestions(suggestions);

      const { calls } = fetchMock.mock;
      assert.equal(calls.length, 1);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_url, options] = calls[0].arguments;
      assert.equal(options.method, 'PATCH');
      const body = JSON.parse(options.body);
      const content = JSON.parse(body.files[GIST_SUGGESTIONS_FILENAME].content);
      assert.deepEqual(content, suggestions);
    });

    test('throws error on API failure', async () => {
      fetchMock.mock.mockImplementation(async () =>
        mockResponse({ message: 'Forbidden' }, false, 403)
      );

      await assert.rejects(async () => saveSuggestions([]), {
        message: 'GitHub API responded with 403',
      });
    });
  });

  describe('addSuggestion', () => {
    test('adds a new suggestion and sanitizes input', async () => {
      const existingSuggestions: MovieSuggestion[] = [];

      // Mock getSuggestions (GET) then saveSuggestions (PATCH)
      fetchMock.mock.mockImplementation(async (_url: string, options: RequestInit) => {
        if (options?.method === 'PATCH') {
          return mockResponse({});
        }
        return mockResponse({
          files: { [GIST_SUGGESTIONS_FILENAME]: { content: JSON.stringify(existingSuggestions) } },
        });
      });

      const title = '  Dirty Movie <script>alert(1)</script>  ';
      const suggestedBy = '  Hacker \x00  ';
      const reason = '  Because it is good  ';

      const result = await addSuggestion(title, suggestedBy, reason);

      // Verify sanitization
      // sanitizeInput trims and removes control chars. It does NOT escape HTML.
      assert.equal(
        result.title,
        'Dirty Movie <script>alert(1)</script>',
        'Title should be trimmed and control chars removed'
      );
      assert.equal(
        result.suggestedBy,
        'Hacker',
        'suggestedBy should be trimmed and control chars removed'
      );
      assert.equal(result.reason, 'Because it is good', 'Reason should be trimmed');
      assert.ok(result.id, 'ID should be generated');
      assert.equal(result.status, 'pending');
      assert.ok(result.createdAt, 'createdAt should be generated');

      // Verify save call
      const { calls } = fetchMock.mock;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const patchCall = calls.find((call: any) => call.arguments[1]?.method === 'PATCH');
      assert.ok(patchCall, 'Should make a PATCH request');

      const body = JSON.parse(patchCall.arguments[1].body);
      const content = JSON.parse(body.files[GIST_SUGGESTIONS_FILENAME].content);
      assert.equal(content.length, 1);
      assert.deepEqual(content[0], result);
    });
  });
});
