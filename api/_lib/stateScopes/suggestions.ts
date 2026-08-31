import { mockSuggestions } from "../../../apps/web/src/services/state/mockData.js";
import {
  normalizePlaceSuggestionRecord,
  normalizeSuggestionRecord,
} from "../../../apps/web/src/services/state/stateSchemas.js";
import type { StateScopeDataMap } from "../../../apps/web/src/services/state/stateTypes.js";
import type {
  MovieSuggestion,
  PlaceSuggestion,
} from "../../../apps/web/src/shared/types.js";
import { parseJsonContent, sanitizeInput } from "../common.js";
import type { ScopeDefinition } from "../state.js";

const extractString = (value: unknown): string =>
  typeof value === "string" ? sanitizeInput(value) : "";

const parseSuggestions = <T>(
  content: string | null,
  context: string,
  normalize: (value: unknown) => T | null,
  fallback: T[] = [],
): T[] => {
  if (!content) return fallback;
  try {
    const parsed = parseJsonContent(content, context);
    return Array.isArray(parsed)
      ? parsed.flatMap((entry) => {
          const normalized = normalize(entry);
          return normalized ? [normalized] : [];
        })
      : fallback;
  } catch (error) {
    console.error(
      `Failed to parse ${context}; defaulting to seed state.`,
      error,
    );
    return fallback;
  }
};

const movieSuggestions: ScopeDefinition<"suggestions", unknown> = {
  filename: "suggestions.json",
  parse: (content) =>
    parseSuggestions(
      content,
      "suggestions",
      normalizeSuggestionRecord,
      mockSuggestions,
    ),
  serialize: (value) => JSON.stringify(value, null, 2),
  toClient: (value) => value as StateScopeDataMap["suggestions"],
  allowAnonymousMutation: (op) => op === "add_suggestion",
  mutate: (current, op, payload, context) => {
    const suggestions = current as MovieSuggestion[];
    if (op === "add_suggestion") {
      const next = payload as Record<string, unknown>;
      const id = extractString(next.id);
      const title = extractString(next.title);
      if (!id || !title)
        return { ok: false, conflict: "Invalid suggestion payload." };
      if (suggestions.some((suggestion) => suggestion.id === id)) {
        return { ok: false, conflict: "Suggestion already exists." };
      }
      const normalizedTitle = title.trim().toLowerCase();
      if (
        suggestions.some(
          (s) =>
            s.status === "pending" &&
            s.title.trim().toLowerCase() === normalizedTitle,
        )
      ) {
        return {
          ok: false,
          conflict: "A suggestion with this title is already pending.",
        };
      }
      return {
        ok: true,
        data: [
          ...suggestions,
          {
            id,
            title,
            suggestedBy:
              context.currentUser ??
              (extractString(next.suggestedBy) || "Guest"),
            reason: extractString(next.reason) || undefined,
            imdbID: extractString(next.imdbID) || undefined,
            type:
              next.type === "movie" || next.type === "series"
                ? next.type
                : undefined,
            status: "pending" as const,
            createdAt: context.now,
          },
        ],
      };
    }
    if (op === "accept_suggestion" || op === "reject_suggestion") {
      const suggestionId = extractString(
        (payload as Record<string, unknown>).suggestionId,
      );
      if (!suggestions.some((suggestion) => suggestion.id === suggestionId)) {
        return { ok: false, conflict: "Suggestion not found." };
      }
      return {
        ok: true,
        data: suggestions.map((suggestion) =>
          suggestion.id === suggestionId
            ? {
                ...suggestion,
                status:
                  op === "accept_suggestion"
                    ? ("accepted" as const)
                    : ("rejected" as const),
                respondedAt: context.now,
                respondedBy: context.currentUser!,
              }
            : suggestion,
        ),
      };
    }
    return { ok: false, conflict: `Unsupported suggestions operation: ${op}` };
  },
};

const placeSuggestions: ScopeDefinition<"placeSuggestions", unknown> = {
  filename: "placesuggestions.json",
  parse: (content) =>
    parseSuggestions(
      content,
      "placeSuggestions",
      normalizePlaceSuggestionRecord,
    ),
  serialize: (value) => JSON.stringify(value, null, 2),
  toClient: (value) => value as StateScopeDataMap["placeSuggestions"],
  allowAnonymousMutation: (op) => op === "add_place_suggestion",
  mutate: (current, op, payload, context) => {
    const suggestions = current as PlaceSuggestion[];
    if (op === "add_place_suggestion") {
      const next = payload as Record<string, unknown>;
      const id = extractString(next.id);
      const name = extractString(next.name);
      const suggestedBy =
        context.currentUser ?? (extractString(next.suggestedBy) || "Guest");
      if (!id || !name || !suggestedBy) {
        return { ok: false, conflict: "Invalid place suggestion payload." };
      }
      if (suggestions.some((suggestion) => suggestion.id === id)) {
        return { ok: false, conflict: "Suggestion already exists." };
      }
      const normalizedName = name.trim().toLowerCase();
      if (
        suggestions.some(
          (s) =>
            s.status === "pending" &&
            s.name.trim().toLowerCase() === normalizedName,
        )
      ) {
        return {
          ok: false,
          conflict: "A place suggestion with this name is already pending.",
        };
      }
      return {
        ok: true,
        data: [
          ...suggestions,
          {
            id,
            name,
            suggestedBy,
            notes: extractString(next.notes) || undefined,
            category: extractString(next.category) || undefined,
            rating: extractString(next.rating) || undefined,
            description: extractString(next.description) || undefined,
            imageUrl: extractString(next.imageUrl) || undefined,
            status: "pending" as const,
            createdAt: context.now,
          },
        ],
      };
    }
    if (op === "accept_place_suggestion" || op === "reject_place_suggestion") {
      const suggestionId = extractString(
        (payload as Record<string, unknown>).suggestionId,
      );
      if (!suggestions.some((suggestion) => suggestion.id === suggestionId)) {
        return { ok: false, conflict: "Suggestion not found." };
      }
      return {
        ok: true,
        data: suggestions.map((suggestion) =>
          suggestion.id === suggestionId
            ? {
                ...suggestion,
                status:
                  op === "accept_place_suggestion"
                    ? ("accepted" as const)
                    : ("rejected" as const),
                respondedAt: context.now,
                respondedBy: context.currentUser!,
              }
            : suggestion,
        ),
      };
    }
    return {
      ok: false,
      conflict: `Unsupported placeSuggestions operation: ${op}`,
    };
  },
};

export const suggestionScopeDefinitions = {
  suggestions: movieSuggestions,
  placeSuggestions,
};
