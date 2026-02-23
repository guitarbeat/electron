import assert from 'node:assert/strict';
import test from 'node:test';
import { extractSafeMetadata, MetadataResult } from './metadataService.ts';

test('extractSafeMetadata extracts valid metadata', () => {
  const metadata: MetadataResult = {
    posterUrl: 'https://example.com/poster.jpg',
    year: '2023',
    plot: 'A great movie.',
    imdbRating: '8.5',
    runtime: '120 min',
    genre: 'Action',
    director: 'John Doe',
  };

  const result = extractSafeMetadata(metadata);

  assert.deepEqual(result, {
    posterUrl: 'https://example.com/poster.jpg',
    year: '2023',
    plot: 'A great movie.',
    imdbRating: '8.5',
    runtime: '120 min',
    genre: 'Action',
    director: 'John Doe',
  });
});

test('extractSafeMetadata filters invalid posterUrl', () => {
  const metadata: MetadataResult = {
    // eslint-disable-next-line no-script-url
    posterUrl: 'javascript:alert(1)',
    year: '2023',
  };

  const result = extractSafeMetadata(metadata);

  assert.equal(result.posterUrl, undefined);
  assert.equal(result.year, '2023');
});

test('extractSafeMetadata filters non-http/https posterUrl', () => {
  const metadata: MetadataResult = {
    posterUrl: 'ftp://example.com/image.jpg',
  };

  const result = extractSafeMetadata(metadata);
  assert.equal(result.posterUrl, undefined);
});

test('extractSafeMetadata sanitizes string inputs', () => {
  const metadata: MetadataResult = {
    genre: 'Action\x00Terminator',
    director: '  Director Name  ',
  };

  const result = extractSafeMetadata(metadata);

  assert.equal(result.genre, 'ActionTerminator');
  assert.equal(result.director, 'Director Name');
});
