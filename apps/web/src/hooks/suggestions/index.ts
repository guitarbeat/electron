import { useCallback, useMemo } from "react";
import { useUser } from "../../app/useProviders.ts";
import type { MovieSuggestion, User } from "../../shared/types";
import { mutateScope } from "../../services/state";
import type { StateScopeDataMap } from "../../services/state/stateTypes";
import { sanitizeInput } from "../../utils";
import type { MovieAutocompleteResult } from "../../services/metadata";
import { useCollection } from "../useCollection";

export interface SuggestionRecord {
  id: string;
  status: "pending" | "accepted" | "rejected";
  respondedAt?: string;
  respondedBy?: User;
}

type SuggestionScope = "suggestions" | "placeSuggestions";

interface SuggestionCollectionConfig {
  scope: SuggestionScope;
  addOperation: string;
  acceptOperation: string;
  rejectOperation: string;
}

export const getPendingSuggestions = <T extends SuggestionRecord>(
  suggestions: T[],
): T[] => suggestions.filter((suggestion) => suggestion.status === "pending");

export const updateSuggestionStatus = <T extends SuggestionRecord>(
  suggestions: T[],
  suggestionId: string,
  status: "accepted" | "rejected",
  respondedBy: User,
  respondedAt: string = new Date().toISOString(),
): T[] => {
  if (!suggestions.some((suggestion) => suggestion.id === suggestionId)) {
    throw new Error("Suggestion not found");
  }

  return suggestions.map((suggestion) =>
    suggestion.id === suggestionId
      ? { ...suggestion, status, respondedAt, respondedBy }
      : suggestion,
  );
};

export const useSuggestionCollection = <T extends SuggestionRecord>(
  config: SuggestionCollectionConfig,
  isPaused: boolean = false,
) => {
  const { currentUser } = useUser();
  const collection = useCollection<T>(config.scope, currentUser, {
    pollingInterval: 60000,
    isPaused,
  });
  const { data: suggestions, performMutation } = collection;

  const pendingSuggestions = useMemo(
    () => getPendingSuggestions(suggestions),
    [suggestions],
  );

  const respond = useCallback(
    async (
      suggestionId: string,
      status: "accepted" | "rejected",
      respondedBy: User,
    ) => {
      const operation =
        status === "accepted" ? config.acceptOperation : config.rejectOperation;
      await performMutation(
        operation,
        { suggestionId },
        updateSuggestionStatus(suggestions, suggestionId, status, respondedBy),
      );
    },
    [config.acceptOperation, config.rejectOperation, performMutation, suggestions],
  );

  const add = useCallback(
    async (suggestion: T, signedInPayload: unknown, guestPayload: unknown) => {
      const optimisticData = [...suggestions, suggestion];
      if (currentUser) {
        await performMutation(config.addOperation, signedInPayload, optimisticData);
      } else {
        await mutateScope(config.scope, {
          op: config.addOperation,
          payload: guestPayload,
          optimisticData: optimisticData as unknown as StateScopeDataMap[SuggestionScope],
        });
      }
      return suggestion;
    },
    [config.addOperation, config.scope, currentUser, performMutation, suggestions],
  );

  return {
    ...collection,
    suggestions,
    pendingSuggestions,
    currentUser,
    add,
    accept: (suggestionId: string, respondedBy: User) =>
      respond(suggestionId, "accepted", respondedBy),
    reject: (suggestionId: string, respondedBy: User) =>
      respond(suggestionId, "rejected", respondedBy),
  };
};

export type { SuggestionRecord as BaseSuggestion };

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
      notes?: string,
      suggestedByOverride?: string,
      selectedResult?: Pick<MovieAutocompleteResult, "imdbID" | "type">,
    ): Promise<MovieSuggestion> => {
      const cleanSuggestedBy =
        currentUser ?? (sanitizeInput(suggestedByOverride || "") || "Guest");

      const nextSuggestion: MovieSuggestion = {
        id: crypto.randomUUID(),
        title: sanitizeInput(title),
        suggestedBy: cleanSuggestedBy,
        notes: notes ? sanitizeInput(notes) : undefined,
        status: "pending",
        createdAt: new Date().toISOString(),
        imdbID: selectedResult?.imdbID,
        type: selectedResult?.type,
      };

      return add(
        nextSuggestion,
        {
          id: nextSuggestion.id,
          title: nextSuggestion.title,
          notes: nextSuggestion.notes,
          imdbID: nextSuggestion.imdbID,
          type: nextSuggestion.type,
        },
        {
          id: nextSuggestion.id,
          title: nextSuggestion.title,
          suggestedBy: nextSuggestion.suggestedBy,
          notes: nextSuggestion.notes,
          imdbID: nextSuggestion.imdbID,
          type: nextSuggestion.type,
        },
      );
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
