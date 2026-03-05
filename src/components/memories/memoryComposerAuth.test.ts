import assert from 'node:assert/strict';
import test from 'node:test';
import { canCreateMemory } from './memoryUtils.ts';

test('composer auth: guests cannot create memories', () => {
  assert.equal(canCreateMemory(null), false);
});

test('composer auth: selected profile can create memories', () => {
  assert.equal(canCreateMemory('Aaron'), true);
  assert.equal(canCreateMemory('Electra'), true);
});
