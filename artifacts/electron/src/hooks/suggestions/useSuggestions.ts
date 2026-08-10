import { useCallback } from "react";
import { sanitizeInput } from "@/utils";
import type { MovieSuggestion } from "@/shared/types";
import type { MovieAutocompleteResult } from "@/services/metadata/types";
import {
  type SuggestionRecord as BaseSuggestion,
  useSuggestionCollection,
} from "./suggestionCollection";

export type { BaseSuggestion };

export const useSuggestions = (isPaused: boolean = false) => {
  const {
    suggestions,
    pendingSuggestions,
    currentUser,
    isLoading,
    isSubmitting,
    error,
    isDegraded,
    isSyncBlocked,
    syncWarning,
    refresh,
    retrySync,
    add,
    accept,
    reject,
  } = useSuggestionCollection<MovieSuggestion>(
    {
      scope: "suggestions",
      addOperation: "add_suggestion",
      acceptOperation: "accept_suggestion",
      rejectOperation: "reject_suggestion",
    },
    isPaused,
  );

  const addSuggestion = useCallback(
    async (
      title: string,
      reason?: string,
      suggestedByOverride?: string,
      selectedResult?: Pick<MovieAutocompleteResult, "imdbID" | "type"> | null,
    ): Promise<MovieSuggestion> => {
      const cleanSuggestedBy =
        currentUser ?? (sanitizeInput(suggestedByOverride || "") || "Guest");

      const nextSuggestion: MovieSuggestion = {
        id: crypto.randomUUID(),
        title: sanitizeInput(title),
        suggestedBy: cleanSuggestedBy,
        reason: reason ? sanitizeInput(reason) : undefined,
        imdbID: selectedResult?.imdbID,
        type: selectedResult?.type,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      const payload = {
        id: nextSuggestion.id,
        title: nextSuggestion.title,
        reason: nextSuggestion.reason,
        imdbID: nextSuggestion.imdbID,
        type: nextSuggestion.type,
      };
      return add(nextSuggestion, payload, {
        ...payload,
        suggestedBy: nextSuggestion.suggestedBy,
      });
    },
    [add, currentUser],
  );

  return {
    suggestions,
    pendingSuggestions,
    isLoading,
    isSubmitting,
    error,
    isDegraded,
    isSyncBlocked,
    syncWarning,
    refresh,
    retrySync,
    addSuggestion,
    acceptSuggestion: accept,
    rejectSuggestion: reject,
  };
};
