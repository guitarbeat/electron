import { useCallback } from "react";
import { Place, PlaceSuggestion, User } from "@/shared/types";
import { sanitizeInput, validateAndThrow, validatePlace } from "@/utils";
import { useCollection } from "../index.ts";
import { useSuggestionCollection } from "../suggestions";

const POLLING_INTERVAL = 15000;

export const usePlaces = (
  currentUser: User | null,
  isPaused: boolean = false,
) => {
  const {
    data: places,
    isLoading,
    isSubmitting,
    error,
    isDegraded,
    isSyncBlocked,
    syncWarning,
    refresh,
    retrySync,
    performMutation,
  } = useCollection<Place>("places", currentUser, {
    pollingInterval: POLLING_INTERVAL,
    isPaused,
  });

  const addPlace = useCallback(
    async (name: string, notes?: string, lat?: number, lng?: number, imageUrl?: string) => {
      validateAndThrow(validatePlace, { name, notes: notes || "" });

      const trimmed = sanitizeInput(name.trim());
      if (!trimmed) throw new Error("Place name cannot be empty");

      const place: Place = {
        id: crypto.randomUUID(),
        name: trimmed,
        addedBy: currentUser ?? undefined,
        notes: notes?.trim() || undefined,
        createdAt: new Date().toISOString(),
        ...(typeof lat === "number" && typeof lng === "number" && { lat, lng }),
        imageUrl,
      };

      await performMutation(
        "add_place",
        {
          id: place.id,
          name: place.name,
          notes: place.notes,
          lat: place.lat,
          lng: place.lng,
          imageUrl: place.imageUrl,
        },
        [...places, place],
      );
    },
    [currentUser, performMutation, places],
  );

  const removePlace = useCallback(
    async (id: string) => {
      await performMutation(
        "remove_place",
        { placeId: id },
        places.filter((p: Place) => p.id !== id),
      );
    },
    [performMutation, places],
  );

  const restorePlace = useCallback(
    async (place: Place) => {
      await performMutation(
        "add_place",
        {
          id: place.id,
          name: place.name,
          notes: place.notes,
          lat: place.lat,
          lng: place.lng,
        },
        [...places, place],
      );
    },
    [performMutation, places],
  );

  const updatePlace = useCallback(
    async (
      id: string,
      updates: Partial<
        Pick<Place, "name" | "notes" | "lat" | "lng" | "category" | "imageUrl">
      >,
    ) => {
      if (updates.name !== undefined || updates.notes !== undefined) {
        validateAndThrow(validatePlace, {
          name: updates.name ?? places.find((p: Place) => p.id === id)?.name ?? "",
          notes: updates.notes ?? "",
        });
      }
      await performMutation(
        "update_place",
        { placeId: id, updates },
        places.map((p: Place) => (p.id === id ? { ...p, ...updates } : p)),
      );
    },
    [performMutation, places],
  );

  const markVisited = useCallback(
    async (id: string) => {
      const visitedAt = new Date().toISOString();
      await performMutation(
        "mark_visited",
        { placeId: id },
        places.map((p: Place) => (p.id === id ? { ...p, visitedAt } : p)),
      );
    },
    [performMutation, places],
  );

  const markUnvisited = useCallback(
    async (id: string) => {
      await performMutation(
        "mark_unvisited",
        { placeId: id },
        places.map((p: Place) => (p.id === id ? { ...p, visitedAt: undefined } : p)),
      );
    },
    [performMutation, places],
  );


  return {
    places,
    isLoading,
    isSubmitting,
    error,
    isDegraded,
    isSyncBlocked,
    syncWarning,
    refresh,
    retrySync,
    addPlace,
    removePlace,
    restorePlace,
    updatePlace,
    markVisited,
    markUnvisited,
  };
};

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
