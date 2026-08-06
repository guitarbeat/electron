import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SPIN_HISTORY_MAX,
  appendSpinHistory,
  getUserSwipedIds,
  isMatchmakerComplete,
  reconcileMatchmakerStatus,
  applyMatchmakerSwipe,
  undoMatchmakerSwipe,
} from '../../api/_lib/gameHelpers.ts';
import type { MatchmakerGame } from '../shared/types.ts';

describe('gameHelpers', () => {
  describe('appendSpinHistory', () => {
    it('appends new spin title to history array', () => {
      const history = ['Inception', 'Interstellar'];
      const result = appendSpinHistory(history, 'The Matrix');

      assert.deepEqual(result, ['The Matrix', 'Inception', 'Interstellar']);
    });

    it('caps spin history at SPIN_HISTORY_MAX (10 entries)', () => {
      const history = Array.from({ length: 10 }, (_, i) => `Movie ${i + 1}`);
      const result = appendSpinHistory(history, 'New Movie', SPIN_HISTORY_MAX);

      assert.equal(result.length, 10);
      assert.equal(result[0], 'New Movie');
      assert.equal(result[9], 'Movie 9');
    });
  });

  describe('getUserSwipedIds', () => {
    const mockGame: MatchmakerGame = {
      id: 'mm_1',
      status: 'active',
      moviePool: ['m1', 'm2', 'm3'],
      aaronLikes: ['m1'],
      aaronDislikes: ['m2'],
      electraLikes: ['m3'],
      electraDislikes: [],
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    it('returns combined likes and dislikes for Aaron', () => {
      const swiped = getUserSwipedIds(mockGame, 'Aaron');
      assert.deepEqual(swiped, ['m1', 'm2']);
    });

    it('returns combined likes and dislikes for Electra', () => {
      const swiped = getUserSwipedIds(mockGame, 'Electra');
      assert.deepEqual(swiped, ['m3']);
    });

    it('returns empty array when game or user is null', () => {
      assert.deepEqual(getUserSwipedIds(null, 'Aaron'), []);
      assert.deepEqual(getUserSwipedIds(mockGame, null), []);
    });
  });

  describe('isMatchmakerComplete and reconcileMatchmakerStatus', () => {
    const incompleteGame: MatchmakerGame = {
      id: 'mm_2',
      status: 'active',
      moviePool: ['m1', 'm2'],
      aaronLikes: ['m1'],
      aaronDislikes: ['m2'],
      electraLikes: ['m1'],
      electraDislikes: [],
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const completeGame: MatchmakerGame = {
      ...incompleteGame,
      electraDislikes: ['m2'],
    };

    it('returns false when either user has remaining pool items', () => {
      assert.equal(isMatchmakerComplete(incompleteGame), false);
    });

    it('returns true when both users have swiped all pool items', () => {
      assert.equal(isMatchmakerComplete(completeGame), true);
    });

    it('reconciles status from active to completed when all items are swiped', () => {
      const reconciled = reconcileMatchmakerStatus(completeGame);
      assert.equal(reconciled.status, 'completed');
    });
  });

  describe('applyMatchmakerSwipe and undoMatchmakerSwipe', () => {
    const initialGame: MatchmakerGame = {
      id: 'mm_3',
      status: 'active',
      moviePool: ['m1', 'm2'],
      aaronLikes: [],
      aaronDislikes: [],
      electraLikes: [],
      electraDislikes: [],
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    it('applies a swipe like for Aaron and records swipe order', () => {
      const updated = applyMatchmakerSwipe(initialGame, 'Aaron', 'm1', true);

      assert.deepEqual(updated.aaronLikes, ['m1']);
      assert.deepEqual(updated.aaronSwipeOrder, ['m1']);
    });

    it('undoes the last swipe for Aaron accurately', () => {
      const swiped = applyMatchmakerSwipe(initialGame, 'Aaron', 'm1', true);
      const undone = undoMatchmakerSwipe(swiped, 'Aaron');

      assert.deepEqual(undone.aaronLikes, []);
      assert.deepEqual(undone.aaronSwipeOrder, []);
    });
  });
});
