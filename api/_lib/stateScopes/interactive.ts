import { randomUUID } from 'node:crypto';
import {
  appendSpinHistory,
  applyMatchmakerSwipe,
  SPIN_HISTORY_MAX,
  undoMatchmakerSwipe,
} from '../gameHelpers.js';
import {
  appendDailySpinEntry,
  cloneQuizData,
  defaultQuizData,
  normalizeDailySpinRecord,
  normalizeMatchmakerGame,
  normalizeQuizData,
  normalizeSpinHistoryParsed,
  normalizeStoredPins,
  type PinRecord,
} from '../../../apps/web/src/services/state/stateSchemas.js';
import type {
  DailySpinRecord,
  StateScopeDataMap,
} from '../../../apps/web/src/services/state/stateTypes.js';
import type {
  MatchmakerGame,
  User,
} from '../../../apps/web/src/shared/types.js';
import {
  ensureBoolean,
  ensureFourDigitPin,
  parseJsonContent,
  sanitizeInput,
} from '../common.js';
import { hashPin } from '../session.js';
import type { ScopeDefinition } from '../state.js';

const extractString = (value: unknown): string =>
  typeof value === 'string' ? sanitizeInput(value) : '';

export const parseQuiz = (content: string | null) => {
  if (!content) {
    return cloneQuizData(defaultQuizData);
  }

  try {
    const parsed = parseJsonContent(content, 'quiz');
    return normalizeQuizData(parsed) ?? cloneQuizData(defaultQuizData);
  } catch (error) {
    console.error('Failed to parse quiz.json; using defaults.', error);
    return cloneQuizData(defaultQuizData);
  }
};

export const parseMatchmaker = (content: string | null): MatchmakerGame | null => {
  if (!content) {
    return null;
  }

  try {
    return normalizeMatchmakerGame(parseJsonContent(content, 'matchmaker'));
  } catch (error) {
    console.error('Failed to parse matchmaker.json; defaulting to no game.', error);
    return null;
  }
};

export const parsePins = (content: string | null): PinRecord => {
  if (!content) {
    return {};
  }

  try {
    return normalizeStoredPins(parseJsonContent(content, 'pins'));
  } catch (error) {
    console.error('Failed to parse pins.json; defaulting to empty pins.', error);
    return {};
  }
};

export const parseSpinHistory = (content: string | null): string[] => {
  if (!content) {
    return [];
  }

  try {
    const parsed = parseJsonContent(content, 'spinHistory');
    return normalizeSpinHistoryParsed(parsed);
  } catch (error) {
    console.error('Failed to parse spinhistory.json; defaulting to empty history.', error);
    return [];
  }
};

export const parseDailySpin = (content: string | null): DailySpinRecord | null => {
  if (!content) {
    return null;
  }

  try {
    const parsed = parseJsonContent(content, 'dailySpin');
    return normalizeDailySpinRecord(parsed);
  } catch (error) {
    console.error('Failed to parse dailyspin.json; defaulting to no daily spin.', error);
    return null;
  }
};

export const quizScopeDefinition: ScopeDefinition<'quiz', unknown> = {
  filename: 'quiz.json',
  parse: parseQuiz,
  serialize: (value) => JSON.stringify(value, null, 2),
  toClient: (value) => value as StateScopeDataMap['quiz'],
  mutate: (_current, op, payload) => {
    if (op !== 'replace_quiz') {
      return { ok: false, conflict: `Unsupported quiz operation: ${op}` };
    }

    const nextPayload = payload as { quizData?: unknown };
    const nextQuiz = normalizeQuizData(nextPayload.quizData ?? payload);
    if (!nextQuiz) {
      return { ok: false, conflict: 'Invalid quiz payload.' };
    }

    return {
      ok: true,
      data: nextQuiz,
    };
  },
};

export const matchmakerScopeDefinition: ScopeDefinition<'matchmaker', unknown> = {
  filename: 'matchmaker.json',
  parse: parseMatchmaker,
  serialize: (value) => (value ? JSON.stringify(value, null, 2) : ''),
  toClient: (value) => value as StateScopeDataMap['matchmaker'],
  mutate: (current, op, payload, context) => {
    const game = current as MatchmakerGame | null;

    switch (op) {
      case 'start_game': {
        const nextPayload = payload as {
          id?: unknown;
          movieIds?: unknown;
        };
        const rawId = extractString(nextPayload.id);
        const id = rawId || randomUUID();
        const movieIds = Array.isArray(nextPayload.movieIds)
          ? nextPayload.movieIds
              .filter((value): value is string => typeof value === 'string')
              .map((value) => sanitizeInput(value))
              .filter(Boolean)
          : [];

        if (movieIds.length === 0) {
          return { ok: false, conflict: 'A new game requires at least one movie.' };
        }

        return {
          ok: true,
          data: {
            id,
            moviePool: [...new Set(movieIds)],
            aaronLikes: [],
            electraLikes: [],
            aaronDislikes: [],
            electraDislikes: [],
            aaronSwipeOrder: [],
            electraSwipeOrder: [],
            status: 'active',
            createdAt: context.now,
            startedBy: context.currentUser!,
          },
        };
      }
      case 'swipe': {
        if (!game) {
          return { ok: false, conflict: 'No active matchmaker game.' };
        }

        const movieId = extractString((payload as { movieId?: unknown }).movieId);
        const liked = ensureBoolean((payload as { liked?: unknown }).liked);

        if (!movieId || liked === null) {
          return { ok: false, conflict: 'Invalid swipe payload.' };
        }

        return {
          ok: true,
          data: applyMatchmakerSwipe(game, context.currentUser!, movieId, liked),
        };
      }
      case 'undo': {
        if (!game) {
          return { ok: false, conflict: 'No active matchmaker game.' };
        }

        return {
          ok: true,
          data: undoMatchmakerSwipe(game, context.currentUser!),
        };
      }
      case 'end_game':
        return {
          ok: true,
          data: null,
        };
      default:
        return { ok: false, conflict: `Unsupported matchmaker operation: ${op}` };
    }
  },
};

export const pinsScopeDefinition: ScopeDefinition<'pins', unknown> = {
  filename: 'pins.json',
  parse: parsePins,
  serialize: (value) => JSON.stringify(value, null, 2),
  toClient: (value) => {
    const pins = value as PinRecord;
    return {
      Aaron: Boolean(pins.Aaron),
      Electra: Boolean(pins.Electra),
    } satisfies StateScopeDataMap['pins'];
  },
  mutate: (current, op, payload, context) => {
    const pins = current as PinRecord;

    switch (op) {
      case 'set_pin': {
        const pin = ensureFourDigitPin((payload as { pin?: unknown }).pin);
        if (!pin) {
          return { ok: false, conflict: 'PIN must be 4 digits.' };
        }

        return {
          ok: true,
          data: {
            ...pins,
            [context.currentUser!]: hashPin(pin),
          },
        };
      }
      case 'remove_pin':
        return {
          ok: true,
          data: {
            ...pins,
            [context.currentUser!]: undefined,
          },
        };
      default:
        return { ok: false, conflict: `Unsupported pins operation: ${op}` };
    }
  },
};

export const spinHistoryScopeDefinition: ScopeDefinition<'spinHistory', unknown> = {
  filename: 'spinhistory.json',
  parse: parseSpinHistory,
  serialize: (value) => JSON.stringify(value, null, 2),
  toClient: (value) => value as StateScopeDataMap['spinHistory'],
  mutate: (current, op, payload) => {
    const history = current as string[];

    if (op !== 'record_pick') {
      return { ok: false, conflict: `Unsupported spinHistory operation: ${op}` };
    }

    const title = extractString((payload as { title?: unknown }).title);

    if (!title) {
      return { ok: false, conflict: 'Invalid spin history title.' };
    }

    return {
      ok: true,
      data: appendSpinHistory(history, title, SPIN_HISTORY_MAX),
    };
  },
};

export const dailySpinScopeDefinition: ScopeDefinition<'dailySpin', unknown> = {
  filename: 'dailyspin.json',
  parse: parseDailySpin,
  serialize: (value) => (value ? JSON.stringify(value, null, 2) : ''),
  toClient: (value) => value as StateScopeDataMap['dailySpin'],
  mutate: (current, op, payload, context) => {
    if (op !== 'record_daily') {
      return { ok: false, conflict: `Unsupported dailySpin operation: ${op}` };
    }

    const movieId = extractString((payload as { movieId?: unknown }).movieId);
    const movieTitle = extractString((payload as { movieTitle?: unknown }).movieTitle);

    if (!movieId || !movieTitle) {
      return { ok: false, conflict: 'Invalid daily spin payload.' };
    }

    const next = appendDailySpinEntry(current as DailySpinRecord | null, {
      movieId,
      movieTitle,
      spunBy: context.currentUser!,
      createdAt: context.now,
    });

    return {
      ok: true,
      data: next,
    };
  },
};
