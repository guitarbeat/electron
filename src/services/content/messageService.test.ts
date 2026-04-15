import assert from 'node:assert/strict';
import test from 'node:test';
import { cloneMessages, isMessageRecord, parseMessagesContent } from './messageService.ts';

test('cloneMessages', async (t) => {
  await t.test('returns a new array with copied message objects', () => {
    const original = [
      {
        id: 'message-1',
        author: 'Aaron',
        content: 'hi',
        createdAt: '2026-03-21T12:00:00.000Z',
      },
    ];

    const cloned = cloneMessages(original);

    assert.deepEqual(cloned, original);
    assert.notEqual(cloned, original);
    assert.notEqual(cloned[0], original[0]);
  });
});

test('isMessageRecord', async (t) => {
  await t.test('accepts valid message records', () => {
    assert.equal(
      isMessageRecord({
        id: 'message-1',
        author: 'Electra',
        content: 'hello',
        createdAt: '2026-03-21T12:00:00.000Z',
      }),
      true
    );
  });

  await t.test('rejects invalid message records', () => {
    assert.equal(isMessageRecord(null), false);
    assert.equal(isMessageRecord('hello'), false);
    assert.equal(isMessageRecord({ id: 'message-1', author: 'Aaron', content: 'hello' }), false);
  });
});

test('parseMessagesContent', async (t) => {
  await t.test('returns an empty array for empty content', () => {
    assert.deepEqual(parseMessagesContent(undefined), []);
    assert.deepEqual(parseMessagesContent(''), []);
  });

  await t.test('keeps valid records and drops invalid rows', () => {
    const parsed = parseMessagesContent(
      JSON.stringify([
        {
          id: 'message-1',
          author: 'Aaron',
          content: 'First',
          createdAt: '2026-03-21T12:00:00.000Z',
        },
        {
          id: 'message-2',
          author: 'Electra',
        },
      ])
    );

    assert.deepEqual(parsed, [
      {
        id: 'message-1',
        author: 'Aaron',
        content: 'First',
        createdAt: '2026-03-21T12:00:00.000Z',
      },
    ]);
  });

  await t.test('throws on invalid JSON', () => {
    assert.throws(() => parseMessagesContent('{nope'), /Failed to parse messages JSON/);
  });
});
