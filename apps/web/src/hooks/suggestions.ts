import { useSuggestionsScope } from "./index";
import type { User, MovieSuggestion } from "@/shared/types";

export function useSuggestions(currentUser?: User, isPaused = false) {
  const { data, isLoading, mutate } = useSuggestionsScope({ isPaused });
  const suggestions = (data as MovieSuggestion[]) || [];

  const addSuggestion = async (suggestion: Partial<MovieSuggestion>) => {
    const newSuggestions = [
      ...suggestions,
      {
        id: suggestion.id || `s-${Date.now()}`,
        title: suggestion.title || "",
        suggestedBy: currentUser || "Aaron",
        createdAt: new Date().toISOString(),
        ...suggestion,
      } as MovieSuggestion,
    ];
    await mutate(newSuggestions);
  };

  const deleteSuggestion = async (id: string) => {
    const updated = suggestions.filter((s) => s.id !== id);
    await mutate(updated);
  };

  return {
    suggestions,
    isLoading,
    addSuggestion,
    deleteSuggestion,
  };
}

export default useSuggestions;
