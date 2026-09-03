import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { logger } from './logger';

describe('logger helper', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('debug', () => {
    it('logs debug message when NODE_ENV is not production', (t) => {
      process.env.NODE_ENV = 'development';
      delete process.env.DEBUG;

      const mockDebug = t.mock.method(console, 'debug', () => {});
      logger.debug('test message', { foo: 'bar' });

      assert.strictEqual(mockDebug.mock.callCount(), 1);
      const args = mockDebug.mock.calls[0].arguments;
      assert.match(args[0] as string, /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[DEBUG\]$/);
      assert.strictEqual(args[1], 'test message');
      assert.deepStrictEqual(args[2], { foo: 'bar' });
    });

    it('suppresses debug log when NODE_ENV is production and DEBUG is not set', (t) => {
      process.env.NODE_ENV = 'production';
      delete process.env.DEBUG;

      const mockDebug = t.mock.method(console, 'debug', () => {});
      logger.debug('hidden debug');

      assert.strictEqual(mockDebug.mock.callCount(), 0);
    });

    it('logs debug message in production if DEBUG is set', (t) => {
      process.env.NODE_ENV = 'production';
      process.env.DEBUG = '1';

      const mockDebug = t.mock.method(console, 'debug', () => {});
      logger.debug('visible debug in prod');

      assert.strictEqual(mockDebug.mock.callCount(), 1);
      const args = mockDebug.mock.calls[0].arguments;
      assert.strictEqual(args[1], 'visible debug in prod');
    });
  });

  describe('info', () => {
    it('logs info message correctly', (t) => {
      const mockInfo = t.mock.method(console, 'info', () => {});
      logger.info('info message', 123);

      assert.strictEqual(mockInfo.mock.callCount(), 1);
      const args = mockInfo.mock.calls[0].arguments;
      assert.match(args[0] as string, /\[INFO\]/);
      assert.strictEqual(args[1], 'info message');
      assert.strictEqual(args[2], 123);
    });
  });

  describe('warn', () => {
    it('logs warn message correctly', (t) => {
      const mockWarn = t.mock.method(console, 'warn', () => {});
      logger.warn('warning message');

      assert.strictEqual(mockWarn.mock.callCount(), 1);
      const args = mockWarn.mock.calls[0].arguments;
      assert.match(args[0] as string, /\[WARN\]/);
      assert.strictEqual(args[1], 'warning message');
    });
  });

  describe('error', () => {
    it('logs error message and formats Error instances in arguments', (t) => {
      const mockError = t.mock.method(console, 'error', () => {});

      const innerError = new Error('Inner error');
      const err = new Error('Main error');
      (err as unknown as { code: string }).code = 'ERR_TEST';
      (err as unknown as { status: number }).status = 500;
      (err as unknown as { cause: Error }).cause = innerError;

      logger.error('Failed to process', err, 'additional context');

      assert.strictEqual(mockError.mock.callCount(), 1);
      const args = mockError.mock.calls[0].arguments;
      assert.match(args[0] as string, /\[ERROR\]/);
      assert.strictEqual(args[1], 'Failed to process');

      const formattedErr = args[2] as Record<string, unknown>;
      assert.strictEqual(formattedErr.name, 'Error');
      assert.strictEqual(formattedErr.message, 'Main error');
      assert.strictEqual(formattedErr.code, 'ERR_TEST');
      assert.strictEqual(formattedErr.status, 500);
      assert.ok(formattedErr.stack);

      const cause = formattedErr.cause as Record<string, unknown>;
      assert.strictEqual(cause.name, 'Error');
      assert.strictEqual(cause.message, 'Inner error');

      assert.strictEqual(args[3], 'additional context');
    });

    it('formats non-Error object causes and values properly in formatErrorDetails', (t) => {
      const mockError = t.mock.method(console, 'error', () => {});

      const errWithObjectCause = new Error('Object cause error');
      (errWithObjectCause as unknown as { cause: unknown }).cause = { detail: 'custom cause object' };

      const plainObj = { custom: 'object' };
      const stringVal = 'string error';

      logger.error('Multiple errors', errWithObjectCause, plainObj, stringVal);

      assert.strictEqual(mockError.mock.callCount(), 1);
      const args = mockError.mock.calls[0].arguments;

      const formattedErr = args[2] as Record<string, unknown>;
      assert.deepStrictEqual(formattedErr.cause, { detail: 'custom cause object' });
      assert.deepStrictEqual(args[3], plainObj);
      assert.strictEqual(args[4], stringVal);
    });
  });

  describe('withContext', () => {
    it('prefixes logs with request, scope, and user details', (t) => {
      process.env.NODE_ENV = 'development';
      const ctxLogger = logger.withContext({
        requestId: 'req-123',
        scope: 'test-scope',
        userId: 'user-456',
      });

      const mockDebug = t.mock.method(console, 'debug', () => {});
      const mockInfo = t.mock.method(console, 'info', () => {});
      const mockWarn = t.mock.method(console, 'warn', () => {});
      const mockError = t.mock.method(console, 'error', () => {});

      ctxLogger.debug('ctx debug');
      ctxLogger.info('ctx info');
      ctxLogger.warn('ctx warn');
      ctxLogger.error('ctx error', new Error('ctx err'));

      assert.strictEqual(mockDebug.mock.callCount(), 1);
      assert.match(mockDebug.mock.calls[0].arguments[0] as string, /\[DEBUG\] \[req:req-123 scope:test-scope user:user-456\]/);

      assert.strictEqual(mockInfo.mock.callCount(), 1);
      assert.match(mockInfo.mock.calls[0].arguments[0] as string, /\[INFO\] \[req:req-123 scope:test-scope user:user-456\]/);

      assert.strictEqual(mockWarn.mock.callCount(), 1);
      assert.match(mockWarn.mock.calls[0].arguments[0] as string, /\[WARN\] \[req:req-123 scope:test-scope user:user-456\]/);

      assert.strictEqual(mockError.mock.callCount(), 1);
      assert.match(mockError.mock.calls[0].arguments[0] as string, /\[ERROR\] \[req:req-123 scope:test-scope user:user-456\]/);
    });

    it('suppresses debug log in production on contextual logger when DEBUG is not set', (t) => {
      process.env.NODE_ENV = 'production';
      delete process.env.DEBUG;

      const ctxLogger = logger.withContext({ requestId: 'req-1' });
      const mockDebug = t.mock.method(console, 'debug', () => {});

      ctxLogger.debug('hidden ctx debug');

      assert.strictEqual(mockDebug.mock.callCount(), 0);
    });

    it('handles empty context object without adding trailing brackets', (t) => {
      const ctxLogger = logger.withContext({});
      const mockInfo = t.mock.method(console, 'info', () => {});

      ctxLogger.info('no context parts');

      assert.strictEqual(mockInfo.mock.callCount(), 1);
      const prefix = mockInfo.mock.calls[0].arguments[0] as string;
      assert.match(prefix, /\] \[INFO\]$/);
    });
  });
});
