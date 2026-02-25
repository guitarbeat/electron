import assert from 'node:assert/strict';
import test from 'node:test';
import { extractTextFromResponse } from './geminiUtils.ts';

test('extractTextFromResponse extracts text from valid response', () => {
  const mockResponse = {
    candidates: [
      {
        content: {
          parts: [
            { text: 'Part 1' },
            { text: 'Part 2' }
          ]
        }
      }
    ]
  };

  const result = extractTextFromResponse(mockResponse);
  assert.equal(result, 'Part 1\nPart 2');
});

test('extractTextFromResponse returns empty string for empty parts', () => {
  const mockResponse = {
    candidates: [
      {
        content: {
          parts: []
        }
      }
    ]
  };

  const result = extractTextFromResponse(mockResponse);
  assert.equal(result, '');
});

test('extractTextFromResponse handles missing candidates', () => {
  const mockResponse = {};
  const result = extractTextFromResponse(mockResponse as any);
  assert.equal(result, '');
});

test('extractTextFromResponse handles null/undefined parts', () => {
   const mockResponse = {
    candidates: [
      {
        content: {
          parts: undefined
        }
      }
    ]
  };
  const result = extractTextFromResponse(mockResponse as any);
  assert.equal(result, '');
});

test('extractTextFromResponse filters out empty/undefined text', () => {
  const mockResponse = {
    candidates: [
      {
        content: {
          parts: [
            { text: 'Valid' },
            { text: '' }, // Should be filtered? Boolean('') is false.
            { text: undefined }
          ]
        }
      }
    ]
  };
  // Original code: .filter(Boolean). Boolean('') is false.
  // So 'Valid' should be the only result.
  const result = extractTextFromResponse(mockResponse as any);
  assert.equal(result, 'Valid');
});
