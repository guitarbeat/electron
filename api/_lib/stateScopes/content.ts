import { randomUUID } from 'node:crypto';
import {
  mockMemories,
  mockMessages,
  mockPlaces,
} from '../../../apps/web/src/services/state/mockData.js';
import {
  normalizeMessageRecord,
  normalizePlaceRecord,
  normalizeSharedMemoryRecord,
} from '../../../apps/web/src/services/state/stateSchemas.js';
import type { StateScopeDataMap } from '../../../apps/web/src/services/state/stateTypes.js';
import type {
  Message,
  Place,
  SharedMemory,
} from '../../../apps/web/src/shared/types.js';
import {
  MAX_MESSAGE_LENGTH,
  parseJsonContent,
  sanitizeInput,
} from '../common.js';
import type { ScopeDefinition } from '../state.js';

const extractString = (value: unknown): string =>
  typeof value === 'string' ? sanitizeInput(value) : '';

const parseArrayScope = <T>(
  content: string | null,
  context: string,
  normalizeRecord: (value: unknown) => T | null,
  defaultContent: T[] = []
): T[] => {
  if (!content) {
    return defaultContent;
  }

  try {
    const parsed = parseJsonContent(content, context);
    if (!Array.isArray(parsed)) {
      console.warn(`${context} was not an array; defaulting to seed state.`);
      return defaultContent;
    }

    return parsed.flatMap((entry) => {
      const next = normalizeRecord(entry);
      return next ? [next] : [];
    });
  } catch (error) {
    console.error(`Failed to parse ${context}; defaulting to seed state.`, error);
    return defaultContent;
  }
};

export const messagesScopeDefinition: ScopeDefinition<'messages', unknown> = {
  filename: 'messages.json',
  parse: (content) =>
    parseArrayScope<Message>(content, 'messages', normalizeMessageRecord, mockMessages),
  serialize: (value) => JSON.stringify(value, null, 2),
  toClient: (value) => value as StateScopeDataMap['messages'],
  mutate: (current, op, payload, context) => {
    const messages = current as Message[];

    switch (op) {
      case 'add_message': {
        const nextPayload = payload as { id?: unknown; content?: unknown };
        const rawId = extractString(nextPayload.id);
        const id = rawId || `message-${randomUUID()}`;
        const content = extractString(nextPayload.content);

        if (!content || content.length > MAX_MESSAGE_LENGTH) {
          return { ok: false, conflict: 'Invalid message content.' };
        }

        if (messages.some((message) => message.id === id)) {
          return { ok: false, conflict: 'Message already exists.' };
        }

        return {
          ok: true,
          data: [
            ...messages,
            {
              id,
              author: context.currentUser!,
              content,
              createdAt: context.now,
            },
          ],
        };
      }
      case 'delete_message': {
        const messageId = extractString((payload as { messageId?: unknown }).messageId);

        const message = messages.find((entry) => entry.id === messageId);
        if (!message) {
          return { ok: false, conflict: 'Message not found.' };
        }

        if (message.author !== context.currentUser!) {
          return { ok: false, conflict: 'Only the author can delete this message.' };
        }

        return {
          ok: true,
          data: messages.filter((entry) => entry.id !== messageId),
        };
      }
      default:
        return { ok: false, conflict: `Unsupported messages operation: ${op}` };
    }
  },
};

export const memoriesScopeDefinition: ScopeDefinition<'memories', unknown> = {
  filename: 'memories.json',
  parse: (content) =>
    parseArrayScope<SharedMemory>(content, 'memories', normalizeSharedMemoryRecord, mockMemories),
  serialize: (value) => JSON.stringify(value, null, 2),
  toClient: (value) => value as StateScopeDataMap['memories'],
  mutate: (current, op, payload, context) => {
    const memories = current as SharedMemory[];

    switch (op) {
      case 'add_memory': {
        const nextPayload = payload as {
          id?: unknown;
          movieId?: unknown;
          movieTitle?: unknown;
          note?: unknown;
          imageUrl?: unknown;
        };
        const rawId = extractString(nextPayload.id);
        const id = rawId || `memory-${randomUUID()}`;
        const movieTitle = extractString(nextPayload.movieTitle);
        const note = extractString(nextPayload.note);

        if (!movieTitle || !note) {
          return { ok: false, conflict: 'Invalid memory payload.' };
        }

        if (memories.some((memory) => memory.id === id)) {
          return { ok: false, conflict: 'Memory already exists.' };
        }

        const movieId = extractString(nextPayload.movieId) || undefined;
        const imageUrl = extractString(nextPayload.imageUrl) || undefined;

        return {
          ok: true,
          data: [
            {
              id,
              movieId,
              movieTitle,
              author: context.currentUser!,
              note,
              createdAt: context.now,
              imageUrl,
            },
            ...memories,
          ],
        };
      }
      case 'update_memory': {
        const nextPayload = payload as {
          memoryId?: unknown;
          updates?: { note?: unknown; movieId?: unknown; movieTitle?: unknown };
        };
        const memoryId = extractString(nextPayload.memoryId);

        const index = memories.findIndex((memory) => memory.id === memoryId);
        if (index < 0) {
          return { ok: false, conflict: 'Memory not found.' };
        }

        const currentMemory = memories[index];
        if (currentMemory.author !== context.currentUser!) {
          return { ok: false, conflict: 'Only the author can edit this memory.' };
        }

        const upd = nextPayload.updates ?? {};
        const updatedMemory: SharedMemory = {
          ...currentMemory,
          note: typeof upd.note === 'string' ? extractString(upd.note) : currentMemory.note,
          movieId: typeof upd.movieId === 'string' ? extractString(upd.movieId) : currentMemory.movieId,
          movieTitle: typeof upd.movieTitle === 'string' ? extractString(upd.movieTitle) : currentMemory.movieTitle,
          updatedAt: context.now,
        };

        return {
          ok: true,
          data: memories.map((memory) =>
            memory.id === memoryId ? updatedMemory : memory
          ),
        };
      }
      case 'update_memories_batch': {
        const nextPayload = payload as {
          updates?: Array<{ memoryId?: unknown; updates?: { note?: unknown; movieId?: unknown; movieTitle?: unknown } }>;
        };
        if (!Array.isArray(nextPayload.updates)) {
          return { ok: false, conflict: 'Invalid batch payload.' };
        }

        const updatesMap = new Map(
          nextPayload.updates.map((u) => [extractString(u.memoryId), u.updates])
        );

        for (const memory of memories) {
          if (updatesMap.has(memory.id) && memory.author !== context.currentUser!) {
            return { ok: false, conflict: 'Only the author can edit this memory.' };
          }
        }

        const nextData = memories.map((memory) => {
          const upd = updatesMap.get(memory.id);
          if (!upd) return memory;

          return {
            ...memory,
            note: typeof upd.note === 'string' ? extractString(upd.note) : memory.note,
            movieId: typeof upd.movieId === 'string' ? extractString(upd.movieId) : memory.movieId,
            movieTitle: typeof upd.movieTitle === 'string' ? extractString(upd.movieTitle) : memory.movieTitle,
            updatedAt: context.now,
          };
        });

        return {
          ok: true,
          data: nextData,
        };
      }
      case 'delete_memory': {
        const memoryId = extractString((payload as { memoryId?: unknown }).memoryId);

        const memory = memories.find((entry) => entry.id === memoryId);
        if (!memory) {
          return { ok: false, conflict: 'Memory not found.' };
        }
        if (memory.author !== context.currentUser!) {
          return { ok: false, conflict: 'Only the author can delete this memory.' };
        }

        return {
          ok: true,
          data: memories.filter((memory) => memory.id !== memoryId),
        };
      }
      case 'toggle_memory_pin': {
        const memoryId = extractString((payload as { memoryId?: unknown }).memoryId);

        const existing = memories.find((memory) => memory.id === memoryId);
        if (!existing) {
          return { ok: false, conflict: 'Memory not found.' };
        }

        return {
          ok: true,
          data: memories.map((memory) =>
            memory.id === memoryId
              ? {
                  ...memory,
                  isPinned: !memory.isPinned,
                  updatedAt: context.now,
                }
              : memory
          ),
        };
      }
      default:
        return { ok: false, conflict: `Unsupported memories operation: ${op}` };
    }
  },
};

export const placesScopeDefinition: ScopeDefinition<'places', unknown> = {
  filename: 'places.json',
  parse: (content) =>
    parseArrayScope<Place>(content, 'places', normalizePlaceRecord, mockPlaces),
  serialize: (value) => JSON.stringify(value, null, 2),
  toClient: (value) => value as StateScopeDataMap['places'],
  mutate: (current, op, payload, context) => {
    const places = current as Place[];

    switch (op) {
      case 'add_place': {
        const nextPayload = payload as {
          id?: unknown;
          name?: unknown;
          notes?: unknown;
          lat?: unknown;
          lng?: unknown;
          imageUrl?: unknown;
        };
        const id = extractString(nextPayload.id);
        const name = extractString(nextPayload.name);
        if (!id || !name) {
          return { ok: false, conflict: 'Invalid place payload.' };
        }

        if (places.some((place) => place.id === id)) {
          return { ok: false, conflict: 'Place already exists.' };
        }

        const notes = extractString(nextPayload.notes) || undefined;

        return {
          ok: true,
          data: [
            ...places,
            {
              id,
              name,
              addedBy: context.currentUser!,
              notes,
              createdAt: context.now,
              lat: typeof nextPayload.lat === 'number' ? nextPayload.lat : undefined,
              lng: typeof nextPayload.lng === 'number' ? nextPayload.lng : undefined,
              imageUrl: typeof nextPayload.imageUrl === 'string' ? extractString(nextPayload.imageUrl) || undefined : undefined,
            },
          ],
        };
      }
      case 'update_place': {
        const nextPayload = payload as {
          placeId?: unknown;
          updates?: { name?: unknown; notes?: unknown; category?: unknown; lat?: unknown; lng?: unknown; imageUrl?: unknown };
        };
        const placeId = extractString(nextPayload.placeId);

        const existing = places.find((place) => place.id === placeId);
        if (!existing) {
          return { ok: false, conflict: 'Place not found.' };
        }

        const upd = nextPayload.updates ?? {};
        return {
          ok: true,
          data: places.map((place) =>
            place.id === placeId
              ? {
                  ...place,
                  name: typeof upd.name === 'string' ? extractString(upd.name) : place.name,
                  notes: typeof upd.notes === 'string' ? extractString(upd.notes) || undefined : place.notes,
                  category: typeof upd.category === 'string' ? extractString(upd.category) || undefined : place.category,
                  lat: typeof upd.lat === 'number' ? upd.lat : place.lat,
                  lng: typeof upd.lng === 'number' ? upd.lng : place.lng,
                  imageUrl: typeof upd.imageUrl === 'string' ? extractString(upd.imageUrl) || undefined : place.imageUrl,
                }
              : place
          ),
        };
      }
      case 'remove_place': {
        const placeId = extractString((payload as { placeId?: unknown }).placeId);

        if (!places.some((place) => place.id === placeId)) {
          return { ok: false, conflict: 'Place not found.' };
        }

        return {
          ok: true,
          data: places.filter((place) => place.id !== placeId),
        };
      }
      case 'mark_visited':
      case 'mark_unvisited': {
        const placeId = extractString((payload as { placeId?: unknown }).placeId);

        if (!places.some((place) => place.id === placeId)) {
          return { ok: false, conflict: 'Place not found.' };
        }

        return {
          ok: true,
          data: places.map((place) =>
            place.id === placeId
              ? {
                  ...place,
                  visitedAt: op === 'mark_visited' ? context.now : undefined,
                }
              : place
          ),
        };
      }
      default:
        return { ok: false, conflict: `Unsupported places operation: ${op}` };
    }
  },
};
