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
      logger.warn('warning message', 'extra arg');

      assert.strictEqual(mockWarn.mock.callCount(), 1);
      const args = mockWarn.mock.calls[0].arguments;
      assert.match(args[0] as string, /\[WARN\]/);
      assert.strictEqual(args[1], 'warning message');
      assert.strictEqual(args[2], 'extra arg');
    });
  });

  describe('error', () => {
    it('formats a simple Error object without optional properties', (t) => {
      const mockError = t.mock.method(console, 'error', () => {});
      const simpleErr = new Error('Basic error message');

      logger.error('Simple failure', simpleErr);

      assert.strictEqual(mockError.mock.callCount(), 1);
      const args = mockError.mock.calls[0].arguments;
      assert.match(args[0] as string, /\[ERROR\]/);
      assert.strictEqual(args[1], 'Simple failure');

      const formattedErr = args[2] as Record<string, unknown>;
      assert.strictEqual(formattedErr.name, 'Error');
      assert.strictEqual(formattedErr.message, 'Basic error message');
      assert.ok(formattedErr.stack);
      assert.strictEqual(formattedErr.code, undefined);
      assert.strictEqual(formattedErr.status, undefined);
      assert.strictEqual(formattedErr.cause, undefined);
    });

    it('logs error message and formats Error instances with code, status, cause', (t) => {
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

    it('formats primitive error causes and primitive argument values properly in formatErrorDetails', (t) => {
      const mockError = t.mock.method(console, 'error', () => {});

      const errWithNumberCause = new Error('Number cause error');
      (errWithNumberCause as unknown as { cause: unknown }).cause = 404;

      const numVal = 123;
      const boolVal = false;
      const nullVal = null;
      const undefinedVal = undefined;

      logger.error('Primitive errors', errWithNumberCause, numVal, boolVal, nullVal, undefinedVal);

      assert.strictEqual(mockError.mock.callCount(), 1);
      const args = mockError.mock.calls[0].arguments;

      const formattedErr = args[2] as Record<string, unknown>;
      assert.strictEqual(formattedErr.cause, '404');
      assert.strictEqual(args[3], 123);
      assert.strictEqual(args[4], false);
      assert.strictEqual(args[5], null);
      assert.strictEqual(args[6], undefined);
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

      ctxLogger.debug('ctx debug', { a: 1 });
      ctxLogger.info('ctx info', 'extra info');
      ctxLogger.warn('ctx warn', { warning: true });
      ctxLogger.error('ctx error', new Error('ctx err'), 'extra err arg');

      assert.strictEqual(mockDebug.mock.callCount(), 1);
      assert.match(mockDebug.mock.calls[0].arguments[0] as string, /\[DEBUG\] \[req:req-123 scope:test-scope user:user-456\]/);
      assert.deepStrictEqual(mockDebug.mock.calls[0].arguments[2], { a: 1 });

      assert.strictEqual(mockInfo.mock.callCount(), 1);
      assert.match(mockInfo.mock.calls[0].arguments[0] as string, /\[INFO\] \[req:req-123 scope:test-scope user:user-456\]/);
      assert.strictEqual(mockInfo.mock.calls[0].arguments[2], 'extra info');

      assert.strictEqual(mockWarn.mock.callCount(), 1);
      assert.match(mockWarn.mock.calls[0].arguments[0] as string, /\[WARN\] \[req:req-123 scope:test-scope user:user-456\]/);
      assert.deepStrictEqual(mockWarn.mock.calls[0].arguments[2], { warning: true });

      assert.strictEqual(mockError.mock.callCount(), 1);
      assert.match(mockError.mock.calls[0].arguments[0] as string, /\[ERROR\] \[req:req-123 scope:test-scope user:user-456\]/);

      const formattedCtxErr = mockError.mock.calls[0].arguments[2] as Record<string, unknown>;
      assert.strictEqual(formattedCtxErr.name, 'Error');
      assert.strictEqual(formattedCtxErr.message, 'ctx err');
      assert.strictEqual(mockError.mock.calls[0].arguments[3], 'extra err arg');
    });

    it('handles partial context fields correctly', (t) => {
      const mockInfo = t.mock.method(console, 'info', () => {});

      logger.withContext({ requestId: 'req-only' }).info('msg1');
      assert.match(mockInfo.mock.calls[0].arguments[0] as string, /\[INFO\] \[req:req-only\]$/);

      logger.withContext({ scope: 'scope-only' }).info('msg2');
      assert.match(mockInfo.mock.calls[1].arguments[0] as string, /\[INFO\] \[scope:scope-only\]$/);

      logger.withContext({ userId: 'user-only' }).info('msg3');
      assert.match(mockInfo.mock.calls[2].arguments[0] as string, /\[INFO\] \[user:user-only\]$/);
    });

    it('suppresses debug log in production on contextual logger when DEBUG is not set', (t) => {
      process.env.NODE_ENV = 'production';
      delete process.env.DEBUG;

      const ctxLogger = logger.withContext({ requestId: 'req-1' });
      const mockDebug = t.mock.method(console, 'debug', () => {});

      ctxLogger.debug('hidden ctx debug');

      assert.strictEqual(mockDebug.mock.callCount(), 0);
    });

    it('logs debug message in production on contextual logger when DEBUG is set', (t) => {
      process.env.NODE_ENV = 'production';
      process.env.DEBUG = '1';

      const ctxLogger = logger.withContext({ requestId: 'req-1' });
      const mockDebug = t.mock.method(console, 'debug', () => {});

      ctxLogger.debug('visible ctx debug in prod');

      assert.strictEqual(mockDebug.mock.callCount(), 1);
      assert.strictEqual(mockDebug.mock.calls[0].arguments[1], 'visible ctx debug in prod');
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
