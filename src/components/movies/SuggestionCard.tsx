import React from 'react';
import type { MovieSuggestion } from '@/shared/types';
import Card from '@/ui/Card';
import {
  MediaCardInfo,
  MediaCardOverlay,
  MediaCardPosterWrap,
  MediaCardTitle,
} from '@/ui/MediaCard';
import { colors } from '@/theme/tokens';
import { CheckIcon, CrossIcon } from '@/common/Icons';
import { fetchOmdbMetadata } from '@/services/metadata/omdb';

interface SuggestionCardProps {
  suggestion: MovieSuggestion;
  onAccept: () => void;
  onReject: () => void;
  canRespond?: boolean;
  disableActions?: boolean;
  isProcessing?: boolean;
}

const SuggestionPoster: React.FC<{
  title: string;
  posterUrl?: string;
  suggestionId: string;
}> = ({ title, posterUrl, suggestionId }) => {
  const [hasImageError, setHasImageError] = React.useState(false);
  const [hasCatError, setHasCatError] = React.useState(false);

  React.useEffect(() => {
    setHasImageError(false);
    setHasCatError(false);
  }, [posterUrl]);

  const shouldShowPoster = Boolean(posterUrl) && !hasImageError;
  const catUrl = `https://cataas.com/cat?width=300&height=450&_id=${encodeURIComponent(suggestionId || title || 'cat')}`;

  return (
    <div className="movie-poster-wrap">
      {shouldShowPoster ? (
        <img
          src={posterUrl}
          alt={`${title} poster`}
          loading="lazy"
          className="movie-poster"
          onError={() => setHasImageError(true)}
        />
      ) : !hasCatError ? (
        <>
          <img
            src={catUrl}
            alt={`A cat representing ${title}`}
            loading="lazy"
            className="movie-poster movie-poster--cat-fallback"
            onError={() => setHasCatError(true)}
          />
          <div className="movie-poster-cat-title" aria-hidden="true">
            {title}
          </div>
        </>
      ) : (
        <div className="movie-poster-fallback">
          <div className="movie-poster-fallback__inner">
            <h3 className="movie-poster-fallback__title">{title}</h3>
          </div>
        </div>
      )}
    </div>
  );
};

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onAccept,
  onReject,
  canRespond = true,
  disableActions = false,
  isProcessing = false,
}) => {
  const [posterUrl, setPosterUrl] = React.useState<string | undefined>(undefined);
  const [year, setYear] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    fetchOmdbMetadata(suggestion.title, suggestion.type, suggestion.imdbID, controller.signal)
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

  const actionsDisabled = isProcessing || disableActions || !canRespond;

  return (
    <Card
      variant="default"
      className="movie-item-card suggestion-item-card"
      data-suggestion-id={suggestion.id}
      style={{
        padding: 0,
        marginBottom: 0,
        borderColor: colors.border,
      }}
    >
      <MediaCardPosterWrap className="movie-item-poster-wrap">
        <SuggestionPoster
          title={suggestion.title}
          posterUrl={posterUrl}
          suggestionId={suggestion.id}
        />

        {/* "Suggested by" eyebrow chip — top-left, mirrors IMDb badge placement */}
        <div className="suggestion-item-card__suggester-chip" aria-label={`Suggested by ${suggestion.suggestedBy}`}>
          <span className="suggestion-item-card__suggester-chip-eyebrow">From</span>
          <span className="suggestion-item-card__suggester-chip-name">{suggestion.suggestedBy}</span>
        </div>

        <MediaCardOverlay className="movie-item-overlay">
          <MediaCardInfo>
            <MediaCardTitle className={`movie-item-title ${posterUrl ? '' : 'movie-item-title--fallback'}`}>
              {suggestion.title}
            </MediaCardTitle>
            {(year || suggestion.reason) && (
              <div className="movie-metadata">
                {year && (
                  <div className="movie-meta-row">
                    <span className="movie-meta-item">{year}</span>
                  </div>
                )}
                {suggestion.reason && (
                  <p className="suggestion-item-card__reason-overlay">
                    &ldquo;{suggestion.reason}&rdquo;
                  </p>
                )}
              </div>
            )}
          </MediaCardInfo>
        </MediaCardOverlay>
      </MediaCardPosterWrap>

      <div className={`movie-item-action-rail ${actionsDisabled && !canRespond ? 'movie-item-action-rail--guest' : ''}`.trim()}>
        <div className="movie-actions">
          <div className="movie-actions__row movie-actions__row--primary">
            <button
              type="button"
              onClick={onAccept}
              disabled={actionsDisabled}
              aria-label={`Accept suggestion "${suggestion.title}"`}
              className="suggestion-item-card__button is-accept"
            >
              <CheckIcon style={{ width: 14, height: 14 }} />
              <span>Add</span>
            </button>
            <button
              type="button"
              onClick={onReject}
              disabled={actionsDisabled}
              aria-label={`Reject suggestion "${suggestion.title}"`}
              className="suggestion-item-card__button is-reject"
            >
              <CrossIcon style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>
      </div>

      {isProcessing && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.18)',
            backdropFilter: 'blur(1px)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />
      )}
    </Card>
  );
};

export default SuggestionCard;
