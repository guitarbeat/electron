import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert';
import {
  mergeHeaders,
  jsonResponse,
  emptyResponse,
  unauthorizedResponse,
  forbiddenResponse,
  conflictResponse,
  methodNotAllowedResponse,
  badRequestResponse,
  serverErrorResponse,
  normalizeEtag,
  toQuotedEtag
} from './http';

describe('http utilities', () => {
  describe('mergeHeaders', () => {
    it('merges multiple HeadersInit correctly', () => {
      const headers = mergeHeaders(
        { 'X-Test-1': '1' },
        { 'X-Test-2': '2', 'X-Test-1': 'overwritten' },
        new Headers({ 'X-Test-3': '3' })
      );
      assert.strictEqual(headers.get('X-Test-1'), 'overwritten');
      assert.strictEqual(headers.get('X-Test-2'), '2');
      assert.strictEqual(headers.get('X-Test-3'), '3');
    });

    it('handles undefined sources', () => {
      const headers = mergeHeaders({ 'X-Test-1': '1' }, undefined, { 'X-Test-2': '2' });
      assert.strictEqual(headers.get('X-Test-1'), '1');
      assert.strictEqual(headers.get('X-Test-2'), '2');
    });

    it('appends set-cookie instead of overwriting', () => {
      const headers = mergeHeaders(
        { 'set-cookie': 'a=1' },
        { 'Set-Cookie': 'b=2' }
      );
      assert.strictEqual(headers.get('set-cookie'), 'a=1, b=2');
    });
  });

  describe('jsonResponse', () => {
    it('creates a JSON response with default headers', async () => {
      const data = { hello: 'world' };
      const response = jsonResponse(data);
      assert.strictEqual(response.headers.get('Content-Type'), 'application/json');
      assert.strictEqual(response.headers.get('Cache-Control'), 'no-store');

      const text = await response.text();
      assert.strictEqual(text, JSON.stringify(data));
    });

    it('respects additional initialization options', () => {
      const response = jsonResponse({}, { status: 201, headers: { 'X-Custom': 'val' } });
      assert.strictEqual(response.status, 201);
      assert.strictEqual(response.headers.get('X-Custom'), 'val');
    });
  });

  describe('emptyResponse', () => {
    it('creates an empty response', async () => {
      const response = emptyResponse();
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.headers.get('Cache-Control'), 'no-store');

      const text = await response.text();
      assert.strictEqual(text, '');
    });
  });

  describe('unauthorizedResponse', () => {
    it('returns a 401 response', async () => {
      const response = unauthorizedResponse();
      assert.strictEqual(response.status, 401);
      const data = await response.json();
      assert.deepStrictEqual(data, { error: 'Unauthorized.' });
    });

    it('allows custom message', async () => {
      const response = unauthorizedResponse('Custom auth error');
      const data = await response.json();
      assert.deepStrictEqual(data, { error: 'Custom auth error' });
    });
  });

  describe('forbiddenResponse', () => {
    it('returns a 403 response', async () => {
      const response = forbiddenResponse();
      assert.strictEqual(response.status, 403);
      const data = await response.json();
      assert.deepStrictEqual(data, { error: 'Forbidden.' });
    });

    it('allows custom message', async () => {
      const response = forbiddenResponse('Custom forbidden');
      const data = await response.json();
      assert.deepStrictEqual(data, { error: 'Custom forbidden' });
    });
  });

  describe('conflictResponse', () => {
    it('returns a 409 response', async () => {
      const response = conflictResponse({ id: 123 });
      assert.strictEqual(response.status, 409);
      const data = await response.json();
      assert.deepStrictEqual(data, { id: 123 });
    });
  });

  describe('methodNotAllowedResponse', () => {
    it('returns a 405 response with Allow header', async () => {
      const response = methodNotAllowedResponse('GET, POST');
      assert.strictEqual(response.status, 405);
      assert.strictEqual(response.headers.get('Allow'), 'GET, POST');
      const data = await response.json();
      assert.deepStrictEqual(data, { error: 'Method not allowed.' });
    });
  });

  describe('badRequestResponse', () => {
    it('returns a 400 response', async () => {
      const response = badRequestResponse('Invalid input');
      assert.strictEqual(response.status, 400);
      const data = await response.json();
      assert.deepStrictEqual(data, { error: 'Invalid input' });
    });
  });

  describe('serverErrorResponse', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('returns a 500 response', async () => {
      const response = serverErrorResponse();
      assert.strictEqual(response.status, 500);
    });

    it('hides details in non-development environment', async () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Secret error message');
      const response = serverErrorResponse(error);
      const data = await response.json();

      assert.deepStrictEqual(data, {
        error: 'Internal Server Error',
        message: 'Internal server error.',
      });
    });

    it('exposes details in development environment', async () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Secret error message');
      const response = serverErrorResponse(error);
      const data = await response.json();

      assert.strictEqual(data.error, 'Internal Server Error');
      assert.strictEqual(data.message, 'Secret error message');
      assert.ok(data.stack);
    });
  });

  describe('normalizeEtag', () => {
    it('normalizes etags correctly', () => {
      assert.strictEqual(normalizeEtag('W/"123"'), '123');
      assert.strictEqual(normalizeEtag('"123"'), '123');
      assert.strictEqual(normalizeEtag('123'), '123');
      assert.strictEqual(normalizeEtag(null), '');
    });
  });

  describe('toQuotedEtag', () => {
    it('quotes etags correctly', () => {
      assert.strictEqual(toQuotedEtag('W/"123"'), '"123"');
      assert.strictEqual(toQuotedEtag('"123"'), '"123"');
      assert.strictEqual(toQuotedEtag('123'), '"123"');
    });
  });
});
