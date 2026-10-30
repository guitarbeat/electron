/* eslint-disable react-refresh/only-export-components */
import React from "react";

export * from "./SuggestionCard";
export * from "./SpinDriftCard";

export const MOVIE_AUTOCOMPLETE_DEBOUNCE_MS = 250;
export const MOVIE_AUTOCOMPLETE_MIN_QUERY_LENGTH = 2;

export interface MovieRecommendationComposerProps {
  onClose?: () => void;
  initialTitle?: string;
  onAdded?: (title: string) => void;
}

export const MovieRecommendationComposer: React.FC<MovieRecommendationComposerProps> = ({
  onClose,
  initialTitle = "",
  onAdded,
}) => {
  const [title, setTitle] = React.useState(initialTitle);
  const [year, setYear] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdded?.(title.trim());
    onClose?.();
  };

  return (
    <div className="movie-recommendation-composer">
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Movie or series title..."
          style={{
            flex: 1,
            padding: "0.5rem 0.75rem",
            background: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "0.5rem",
            color: "#fff",
          }}
        />
        <input
          type="text"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder="Year"
          style={{
            width: "5rem",
            padding: "0.5rem",
            background: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "0.5rem",
            color: "#fff",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "0.5rem 1rem",
            background: "#38bdf8",
            border: "none",
            borderRadius: "0.5rem",
            color: "#0c122a",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Add
        </button>
      </form>
    </div>
  );
};
