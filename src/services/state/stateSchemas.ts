import {
  CHARACTERS,
  type QuizCharacter,
  type QuizQuestion,
} from "../../components/quiz/lib/types.ts";
import {
  characterDescriptions as defaultDescriptions,
  neitherDescription as defaultNeither,
  quizQuestions as defaultQuestions,
} from "../../components/quiz/lib/data.ts";
import { reconcileMatchmakerStatus } from "../../components/matchmaker/matchmakerGame.ts";
import { normalizePinRecord, type PinRecord } from "../content/pinHelpers.ts";
import type {
  MatchmakerGame,
  Message,
  MovieSuggestion,
  Place,
  PlaceSuggestion,
  SharedMemory,
} from "../../shared/types.ts";
import type { DailySpinRecord, SpinEntry } from "./stateTypes.ts";
import {
  deepClone,
  isUser,
  isValidUrl,
  parseJsonContent,
  sanitizeInput,
} from "../../utils/shared.ts";
import type { PinsState, QuizData } from "./stateTypes.ts";

const normalizeRequiredString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = sanitizeInput(value);
  return normalized || null;
};

const normalizeOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = sanitizeInput(value);
  return normalized || undefined;
};

const normalizeCreatedAt = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  return Number.isNaN(Date.parse(value)) ? null : value;
};

const normalizeOptionalDate = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  return Number.isNaN(Date.parse(value)) ? undefined : value;
};

const normalizeOptionalUrl = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = sanitizeInput(value);
  return normalized && isValidUrl(normalized) ? normalized : undefined;
};

const normalizeOptionalNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

export const defaultQuizData: QuizData = {
  questions: defaultQuestions,
  characterDescriptions: defaultDescriptions,
  neitherDescription: defaultNeither,
};

export const cloneQuizData = (data: QuizData): QuizData => deepClone(data);

export const normalizeQuizData = (value: unknown): QuizData | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<QuizData> & {
    characterDescriptions?: Partial<Record<QuizCharacter, unknown>>;
    neitherDescription?: unknown;
  };

  if (!Array.isArray(candidate.questions)) {
    return null;
  }

  const characterDescriptions = CHARACTERS.reduce<
    Record<QuizCharacter, string>
  >(
    (acc, character) => {
      const nextValue = candidate.characterDescriptions?.[character];
      acc[character] =
        typeof nextValue === "string"
          ? nextValue
          : defaultDescriptions[character];
      return acc;
    },
    {} as Record<QuizCharacter, string>,
  );

  return {
    questions:
      candidate.questions.length > 0
        ? (candidate.questions as QuizQuestion[])
        : defaultQuestions,
    characterDescriptions,
    neitherDescription:
      typeof candidate.neitherDescription === "string"
        ? candidate.neitherDescription
        : defaultNeither,
  };
};

export const cloneMessages = (messages: Message[]): Message[] =>
  messages.map((message) => ({
    ...message,
  }));

export const normalizeMessageRecord = (value: unknown): Message | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const message = value as Partial<Message>;
  const id = normalizeRequiredString(message.id);
  const author = normalizeRequiredString(message.author);
  const content = normalizeRequiredString(message.content);
  const createdAt = normalizeCreatedAt(message.createdAt);

  if (!id || !author || !content || !createdAt) {
    return null;
  }

  return {
    id,
    author,
    content,
    createdAt,
  };
};

export const isMessageRecord = (value: unknown): value is Message =>
  normalizeMessageRecord(value) !== null;

export const parseMessagesContent = (
  content: string | undefined,
): Message[] => {
  if (!content) {
    return [];
  }

  const parsed = parseJsonContent(content, "messages");
  return Array.isArray(parsed)
    ? parsed.flatMap((message) => {
        const normalized = normalizeMessageRecord(message);
        return normalized ? [normalized] : [];
      })
    : [];
};

export const cloneMemories = (memories: SharedMemory[]): SharedMemory[] =>
  memories.map((memory) => ({
    ...memory,
  }));

export const normalizeSharedMemoryRecord = (
  value: unknown,
): SharedMemory | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const memory = value as Partial<SharedMemory>;
  const id = normalizeRequiredString(memory.id);
  const movieTitle = normalizeRequiredString(memory.movieTitle);
  const author = normalizeRequiredString(memory.author);
  const note = normalizeRequiredString(memory.note);
  const createdAt = normalizeCreatedAt(memory.createdAt);

  if (!id || !movieTitle || !author || !note || !createdAt) {
    return null;
  }

  return {
    id,
    movieId: normalizeOptionalString(memory.movieId),
    movieTitle,
    author,
    note,
    createdAt,
    updatedAt: normalizeOptionalDate(memory.updatedAt),
    isPinned:
      typeof memory.isPinned === "boolean" ? memory.isPinned : undefined,
    imageUrl: normalizeOptionalUrl(memory.imageUrl),
  };
};

export const normalizeMemories = (value: unknown): SharedMemory[] =>
  Array.isArray(value)
    ? value.flatMap((entry) => {
        const normalized = normalizeSharedMemoryRecord(entry);
        return normalized ? [normalized] : [];
      })
    : [];

const isSuggestionStatus = (
  value: unknown,
): value is MovieSuggestion["status"] =>
  value === "pending" || value === "accepted" || value === "rejected";

const isMovieSuggestionType = (
  value: unknown,
): value is NonNullable<MovieSuggestion["type"]> =>
  value === "movie" || value === "series";

export const normalizeSuggestionRecord = (
  value: unknown,
): MovieSuggestion | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const suggestion = value as Partial<MovieSuggestion>;
  const id = normalizeRequiredString(suggestion.id);
  const title = normalizeRequiredString(suggestion.title);
  const suggestedBy = normalizeRequiredString(suggestion.suggestedBy);
  const createdAt = normalizeCreatedAt(suggestion.createdAt);

  if (
    !id ||
    !title ||
    !suggestedBy ||
    !createdAt ||
    !isSuggestionStatus(suggestion.status)
  ) {
    return null;
  }

  return {
    id,
    title,
    suggestedBy,
    imdbID: normalizeOptionalString(suggestion.imdbID),
    type: isMovieSuggestionType(suggestion.type) ? suggestion.type : undefined,
    status: suggestion.status,
    createdAt,
    reason: normalizeOptionalString(suggestion.reason),
    respondedAt: normalizeOptionalDate(suggestion.respondedAt),
    respondedBy: isUser(suggestion.respondedBy)
      ? suggestion.respondedBy
      : undefined,
  };
};

export const normalizeSuggestions = (value: unknown): MovieSuggestion[] =>
  Array.isArray(value)
    ? value.flatMap((entry) => {
        const normalized = normalizeSuggestionRecord(entry);
        return normalized ? [normalized] : [];
      })
    : [];

const isPlaceSuggestionStatus = (
  value: unknown,
): value is PlaceSuggestion["status"] =>
  value === "pending" || value === "accepted" || value === "rejected";

export const normalizePlaceSuggestionRecord = (
  value: unknown,
): PlaceSuggestion | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const suggestion = value as Partial<PlaceSuggestion>;
  const id = normalizeRequiredString(suggestion.id);
  const name = normalizeRequiredString(suggestion.name);
  const suggestedBy = normalizeRequiredString(suggestion.suggestedBy);
  const createdAt = normalizeCreatedAt(suggestion.createdAt);

  if (
    !id ||
    !name ||
    !suggestedBy ||
    !createdAt ||
    !isPlaceSuggestionStatus(suggestion.status)
  ) {
    return null;
  }

  return {
    id,
    name,
    suggestedBy,
    status: suggestion.status,
    createdAt,
    notes: normalizeOptionalString(suggestion.notes),
    category: normalizeOptionalString(suggestion.category),
    rating: normalizeOptionalString(suggestion.rating),
    description: normalizeOptionalString(suggestion.description),
    imageUrl: normalizeOptionalUrl(suggestion.imageUrl),
    respondedAt: normalizeOptionalDate(suggestion.respondedAt),
    respondedBy: isUser(suggestion.respondedBy)
      ? suggestion.respondedBy
      : undefined,
  };
};

export const normalizePlaceSuggestions = (value: unknown): PlaceSuggestion[] =>
  Array.isArray(value)
    ? value.flatMap((entry) => {
        const normalized = normalizePlaceSuggestionRecord(entry);
        return normalized ? [normalized] : [];
      })
    : [];

export const clonePlaces = (places: Place[]): Place[] =>
  places.map((place) => ({
    ...place,
  }));

export const normalizePlaceRecord = (value: unknown): Place | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const place = value as Partial<Place>;
  const id = normalizeRequiredString(place.id);
  const name = normalizeRequiredString(place.name);
  const createdAt = normalizeCreatedAt(place.createdAt);

  if (!id || !name || !createdAt) {
    return null;
  }

  return {
    id,
    name,
    addedBy: isUser(place.addedBy) ? place.addedBy : undefined,
    notes: normalizeOptionalString(place.notes),
    createdAt,
    visitedAt: normalizeOptionalDate(place.visitedAt),
    lat: normalizeOptionalNumber(place.lat),
    lng: normalizeOptionalNumber(place.lng),
    category: normalizeOptionalString(place.category),
    rating: normalizeOptionalString(place.rating),
    description: normalizeOptionalString(place.description),
    imageUrl: normalizeOptionalUrl(place.imageUrl),
  };
};

export const normalizePlaces = (value: unknown): Place[] =>
  Array.isArray(value)
    ? value.flatMap((entry) => {
        const normalized = normalizePlaceRecord(entry);
        return normalized ? [normalized] : [];
      })
    : [];

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isMatchmakerStatus = (
  value: unknown,
): value is MatchmakerGame["status"] =>
  value === "active" || value === "completed";

export const normalizeMatchmakerGame = (
  value: unknown,
): MatchmakerGame | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const game = value as Partial<MatchmakerGame>;
  const id = normalizeRequiredString(game.id);
  const createdAt = normalizeCreatedAt(game.createdAt);

  if (
    !id ||
    !createdAt ||
    !isUser(game.startedBy) ||
    !isMatchmakerStatus(game.status) ||
    !isStringArray(game.moviePool) ||
    !isStringArray(game.aaronLikes) ||
    !isStringArray(game.electraLikes) ||
    !isStringArray(game.aaronDislikes) ||
    !isStringArray(game.electraDislikes)
  ) {
    return null;
  }

  return reconcileMatchmakerStatus({
    id,
    createdAt,
    startedBy: game.startedBy,
    status: game.status,
    moviePool: [...game.moviePool],
    aaronLikes: [...game.aaronLikes],
    electraLikes: [...game.electraLikes],
    aaronDislikes: [...game.aaronDislikes],
    electraDislikes: [...game.electraDislikes],
    aaronSwipeOrder: isStringArray(game.aaronSwipeOrder)
      ? [...game.aaronSwipeOrder]
      : [],
    electraSwipeOrder: isStringArray(game.electraSwipeOrder)
      ? [...game.electraSwipeOrder]
      : [],
  });
};

export const cloneMatchmakerGame = (
  game: MatchmakerGame | null,
): MatchmakerGame | null =>
  game
    ? {
        ...game,
        moviePool: [...game.moviePool],
        aaronLikes: [...game.aaronLikes],
        electraLikes: [...game.electraLikes],
        aaronDislikes: [...game.aaronDislikes],
        electraDislikes: [...game.electraDislikes],
        aaronSwipeOrder: [...(game.aaronSwipeOrder ?? [])],
        electraSwipeOrder: [...(game.electraSwipeOrder ?? [])],
      }
    : null;

export const normalizePinsState = (value: unknown): PinsState => {
  const pins = normalizePinRecord(value);
  return {
    Aaron: Boolean(pins?.Aaron),
    Electra: Boolean(pins?.Electra),
  };
};

export const pinsStateFromHashes = (pins: PinRecord): PinsState => ({
  Aaron: Boolean(pins.Aaron),
  Electra: Boolean(pins.Electra),
});

export const normalizeStoredPins = (value: unknown): PinRecord =>
  normalizePinRecord(value) ?? {};

export const clonePinsState = (pins: PinsState): PinsState => ({ ...pins });

const spinHistoryTitleFromEntry = (entry: unknown): string | null => {
  if (typeof entry === "string") {
    const t = sanitizeInput(entry);
    return t || null;
  }
  if (!entry || typeof entry !== "object") {
    return null;
  }
  const o = entry as { title?: unknown; movieTitle?: unknown };
  if (typeof o.title === "string") {
    const t = sanitizeInput(o.title);
    return t || null;
  }
  if (typeof o.movieTitle === "string") {
    const t = sanitizeInput(o.movieTitle);
    return t || null;
  }
  return null;
};

/** Normalize stored JSON: string[], legacy objects, or invalid → string[] (newest-first order preserved). */
export const normalizeSpinHistoryParsed = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => spinHistoryTitleFromEntry(entry))
    .filter((t): t is string => Boolean(t));
};

export const normalizeSpinEntry = (value: unknown): SpinEntry | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const entry = value as Partial<SpinEntry>;
  const movieId = normalizeRequiredString(entry.movieId);
  const movieTitle = normalizeRequiredString(entry.movieTitle);
  const createdAt = normalizeCreatedAt(entry.createdAt);

  if (!movieId || !movieTitle || !createdAt || !isUser(entry.spunBy)) {
    return null;
  }

  return {
    movieId,
    movieTitle,
    spunBy: entry.spunBy,
    createdAt,
  };
};

export const appendDailySpinEntry = (
  current: DailySpinRecord | null,
  nextEntry: SpinEntry,
): DailySpinRecord => {
  const nextDate = nextEntry.createdAt.slice(0, 10);
  const spins = current?.date === nextDate ? current.spins : [];

  return {
    date: nextDate,
    spins: [...spins, nextEntry],
  };
};

export const normalizeDailySpinRecord = (
  value: unknown,
): DailySpinRecord | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<DailySpinRecord> & Partial<SpinEntry>;
  const date = normalizeRequiredString(candidate.date);
  if (!date) {
    return null;
  }

  if (Array.isArray(candidate.spins)) {
    const spins = candidate.spins.flatMap((entry) => {
      const normalized = normalizeSpinEntry(entry);
      return normalized ? [normalized] : [];
    });

    return spins.length > 0 ? { date, spins } : null;
  }

  const legacyEntry = normalizeSpinEntry(candidate);
  if (!legacyEntry) {
    return null;
  }

  return {
    date,
    spins: [legacyEntry],
  };
};
