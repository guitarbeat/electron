import { useCallback, useMemo } from "react";
import { sanitizeInput } from "@/utils";
import type { PlaceSuggestion, User } from "@/shared/types";
import { useUser } from "@/app/useProviders";
import { mutateScope } from "@/services/state";
import { useCollection } from "../useCollection";

export const usePlaceSuggestions = (isPaused: boolean = false) => {
  const { currentUser } = useUser();
  const {
    data: suggestions,
    isLoading,
    isSubmitting,
    error,
    isDegraded,
    isSyncBlocked,
    syncWarning,
    refresh,
    retrySync,
    performMutation,
  } = useCollection<PlaceSuggestion>("placeSuggestions", currentUser, {
    pollingInterval: 60000,
    isPaused,
  });

  const pendingSuggestions = useMemo(
    () => suggestions.filter((s) => s.status === "pending"),
    [suggestions],
  );

  const respondToSuggestion = useCallback(
    async (
      suggestionId: string,
      status: "accepted" | "rejected",
      respondedBy: User,
      op: string,
    ) => {
      const suggestion = suggestions.find((entry) => entry.id === suggestionId);
      if (!suggestion) {
        throw new Error("Suggestion not found");
      }

      await performMutation(
        op,
        { suggestionId },
        suggestions.map((entry) =>
          entry.id === suggestionId
            ? {
                ...entry,
                status,
                respondedAt: new Date().toISOString(),
                respondedBy,
              }
            : entry,
        ),
      );
    },
    [performMutation, suggestions],
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

      if (currentUser) {
        await performMutation(
          "add_place_suggestion",
          {
            id: nextSuggestion.id,
            name: nextSuggestion.name,
            notes: nextSuggestion.notes,
            category: nextSuggestion.category,
            rating: nextSuggestion.rating,
            description: nextSuggestion.description,
            imageUrl: nextSuggestion.imageUrl,
          },
          [...suggestions, nextSuggestion],
        );
      } else {
        await mutateScope("placeSuggestions", {
          op: "add_place_suggestion",
          payload: {
            id: nextSuggestion.id,
            name: nextSuggestion.name,
            notes: nextSuggestion.notes,
            category: nextSuggestion.category,
            rating: nextSuggestion.rating,
            description: nextSuggestion.description,
            imageUrl: nextSuggestion.imageUrl,
            suggestedBy: nextSuggestion.suggestedBy,
          },
          optimisticData: [...suggestions, nextSuggestion],
        });
      }

      return nextSuggestion;
    },
    [currentUser, suggestions, performMutation],
  );

  const acceptPlaceSuggestion = useCallback(
    async (suggestionId: string, respondedBy: User): Promise<void> => {
      await respondToSuggestion(
        suggestionId,
        "accepted",
        respondedBy,
        "accept_place_suggestion",
      );
    },
    [respondToSuggestion],
  );

  const rejectPlaceSuggestion = useCallback(
    async (suggestionId: string, respondedBy: User): Promise<void> => {
      await respondToSuggestion(
        suggestionId,
        "rejected",
        respondedBy,
        "reject_place_suggestion",
      );
    },
    [respondToSuggestion],
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
    acceptPlaceSuggestion,
    rejectPlaceSuggestion,
  };
};
