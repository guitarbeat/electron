import { useCallback, useMemo } from "react";
import { useUser } from "@/app/useProviders";
import type { User } from "@/shared/types";
import { mutateScope } from "@/services/state";
import type { StateScopeDataMap } from "@/services/state/stateTypes";
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
