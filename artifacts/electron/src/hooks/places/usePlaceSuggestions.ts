import { useCallback } from "react";
import { sanitizeInput } from "@/utils";
import type { PlaceSuggestion } from "@/shared/types";
import { useSuggestionCollection } from "../suggestions/suggestionCollection";

export const usePlaceSuggestions = (isPaused: boolean = false) => {
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
  } = useSuggestionCollection<PlaceSuggestion>(
    {
      scope: "placeSuggestions",
      addOperation: "add_place_suggestion",
      acceptOperation: "accept_place_suggestion",
      rejectOperation: "reject_place_suggestion",
    },
    isPaused,
  );

  const addPlaceSuggestion = useCallback(
    async (
      name: string,
      notes?: string,
      metadata?: Partial<PlaceSuggestion>,
      suggestedByOverride?: string,
    ): Promise<PlaceSuggestion> => {
      const cleanSuggestedBy =
        currentUser ?? (sanitizeInput(suggestedByOverride || "") || "Guest");

      const nextSuggestion: PlaceSuggestion = {
        id: crypto.randomUUID(),
        name: sanitizeInput(name),
        suggestedBy: cleanSuggestedBy,
        notes: notes ? sanitizeInput(notes) : undefined,
        status: "pending",
        createdAt: new Date().toISOString(),
        ...metadata,
      };

      const payload = {
        id: nextSuggestion.id,
        name: nextSuggestion.name,
        notes: nextSuggestion.notes,
        category: nextSuggestion.category,
        rating: nextSuggestion.rating,
        description: nextSuggestion.description,
        imageUrl: nextSuggestion.imageUrl,
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
    addPlaceSuggestion,
    acceptPlaceSuggestion: accept,
    rejectPlaceSuggestion: reject,
  };
};
