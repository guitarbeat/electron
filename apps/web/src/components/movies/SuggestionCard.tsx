import React from "react";
import type { MovieSuggestion } from "@/shared/types";
import { fetchOmdbMetadataCached } from "@/services/metadata";
import MediaPoster from "@/ui/MediaPoster";
import SuggestionCardBase from "@/ui/SuggestionCardBase";
import MediaCardMetadata from "@/ui/MediaCardMetadata";
import StremioButton from "@/components/ui/StremioButton";

interface SuggestionCardProps {

  suggestion: MovieSuggestion;
  onAccept: () => void;
  onReject: () => void;
  canRespond?: boolean;
  disableActions?: boolean;
  isProcessing?: boolean;
  className?: string;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onAccept,
  onReject,
  canRespond = true,
  disableActions = false,
  isProcessing = false,
  className,
}) => {
  const [posterUrl, setPosterUrl] = React.useState<string | undefined>(
    undefined,
  );
  const [year, setYear] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    fetchOmdbMetadataCached(
      suggestion.title,
      suggestion.type,
      suggestion.imdbID,
      controller.signal,
    )
      .then((meta) => {
        if (cancelled) return;
        setPosterUrl(meta.poster);
        setYear(meta.year);
      })
      .catch(() => {
        // Silent fail — fallback chain handles missing posters
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [suggestion.title, suggestion.type, suggestion.imdbID]);

  return (
    <SuggestionCardBase
      suggestedBy={suggestion.suggestedBy}
      title={suggestion.title}
      subtitle={suggestion.reason}
      onAccept={onAccept}
      onReject={onReject}
      canRespond={canRespond}
      disableActions={disableActions}
      isProcessing={isProcessing}
      className={["movie-item-card suggestion-item-card", className]
        .filter(Boolean)
        .join(" ")}
      media={
        <MediaPoster
          title={suggestion.title}
          posterUrl={posterUrl}
          year={year}
          id={suggestion.id}
        />
      }
      details={
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
          {year ? <MediaCardMetadata items={[year]} className="movie-metadata" /> : null}
          <StremioButton
            movie={{
              title: suggestion.title,
              imdbID: suggestion.imdbID,
              mediaType: suggestion.type,
            }}
            variant="pill"
          />
        </div>
      }
    />
  );
};


export default React.memo(SuggestionCard);
