import React, { useMemo, useState } from "react";
import type { MovieSuggestion, User } from "@/shared/types";
import Stack from "@/components/ui/Stack";
import SuggestionCard from "./SuggestionCard";
import "./SuggestionStack.css";

interface SuggestionStackProps {
  suggestions: MovieSuggestion[];
  currentUser: User | null;
  processingSuggestionId: string | null;
  onAccept: (suggestion: MovieSuggestion) => void;
  onReject: (suggestion: MovieSuggestion) => void;
}

const SuggestionStack: React.FC<SuggestionStackProps> = ({
  suggestions,
  currentUser,
  processingSuggestionId,
  onAccept,
  onReject,
}) => {
  const orderedSuggestions = useMemo(
    () => [...suggestions].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [suggestions],
  );

  const defaultTopId =
    orderedSuggestions[orderedSuggestions.length - 1]?.id ?? null;
  const [topSuggestionId, setTopSuggestionId] = useState<string | null>(
    defaultTopId,
  );

  React.useEffect(() => {
    if (!defaultTopId) {
      setTopSuggestionId(null);
      return;
    }

    setTopSuggestionId((current) => {
      if (!current || !orderedSuggestions.some((entry) => entry.id === current)) {
        return defaultTopId;
      }
      return current;
    });
  }, [defaultTopId, orderedSuggestions]);

  const stackItems = useMemo(
    () =>
      orderedSuggestions.map((suggestion) => {
        const isTop = suggestion.id === topSuggestionId;

        return {
          id: suggestion.id,
          content: (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onAccept={() => onAccept(suggestion)}
              onReject={() => onReject(suggestion)}
              canRespond={Boolean(currentUser)}
              disableActions={!currentUser || !isTop}
              isProcessing={processingSuggestionId === suggestion.id}
              className={`suggestion-stack-card${
                isTop ? "" : " suggestion-stack-card--inactive"
              }`}
            />
          ),
        };
      }),
    [
      currentUser,
      onAccept,
      onReject,
      orderedSuggestions,
      processingSuggestionId,
      topSuggestionId,
    ],
  );

  if (stackItems.length === 0) return null;

  return (
    <div className="suggestion-stack-stage suggestion-stack-stage--incoming">
      <div className="suggestion-stack">
        <Stack
          items={stackItems}
          randomRotation
          sensitivity={160}
          sendToBackOnClick={stackItems.length > 1}
          mobileClickOnly
          pauseOnHover={stackItems.length > 2}
          onTopItemChange={setTopSuggestionId}
          animationConfig={{ stiffness: 280, damping: 22 }}
        />
      </div>

      {stackItems.length > 1 ? (
        <p className="suggestion-stack__hint">
          {currentUser
            ? "Drag or tap the poster to peek at more"
            : "Tap the poster to flip through suggestions"}
        </p>
      ) : null}

      {!currentUser ? (
        <p className="suggestion-stack__guest-hint">
          Sign in to accept or reject suggestions
        </p>
      ) : null}

      <p className="suggestion-stack__count">
        {stackItems.length} incoming
      </p>
    </div>
  );
};

export const SuggestionStackSkeleton: React.FC = () => (
  <div
    className="suggestion-stack-stage suggestion-stack-stage--incoming"
    aria-hidden
  >
    <div className="suggestion-stack-skeleton">
      <div className="suggestion-stack-skeleton__card suggestion-stack-skeleton__card--back" />
      <div className="suggestion-stack-skeleton__card suggestion-stack-skeleton__card--mid" />
      <div className="suggestion-stack-skeleton__card" />
    </div>
    <p className="suggestion-stack__hint">Loading suggestions</p>
  </div>
);

export default SuggestionStack;
