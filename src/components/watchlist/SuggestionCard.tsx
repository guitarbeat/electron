import React from 'react';
import type { MovieSuggestion } from '@/shared/types';
import Card from '@/ui/Card';
import MediaCard from '@/ui/MediaCard';
import Button from '@/ui/Button';
import { colors, motion, spacing, typography } from '@/theme/tokens';
import { CheckIcon, CrossIcon } from '@/common/icons';
import { fetchOmdbMetadata } from '@/services/metadata/omdb';
import { consoleError } from '@/utils';

interface SuggestionCardProps {
  suggestion: MovieSuggestion;
  onAccept: () => void;
  onReject: () => void;
  canRespond?: boolean;
  disableActions?: boolean;
  isProcessing?: boolean;
  animationDelay?: string;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onAccept,
  onReject,
  canRespond = true,
  disableActions = false,
  isProcessing = false,
  animationDelay = '0s',
}) => {
  const actionsDisabled = isProcessing || disableActions || !canRespond;

  const [posterUrl, setPosterUrl] = React.useState<string | undefined>(undefined);
  const [hasImageError, setHasImageError] = React.useState(false);
  const [hasCatError, setHasCatError] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    setPosterUrl(undefined);
    setHasImageError(false);
    setHasCatError(false);

    fetchOmdbMetadata(suggestion.title, suggestion.type, suggestion.imdbID, controller.signal)
      .then((meta) => {
        if (!cancelled && meta.poster) {
          setPosterUrl(meta.poster);
        }
      })
      .catch((error) => {
        if (!cancelled && (error as Error)?.name !== 'AbortError') {
          consoleError('Failed to fetch suggestion poster', error);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [suggestion.title, suggestion.type, suggestion.imdbID]);

  const shouldShowPoster = Boolean(posterUrl) && !hasImageError;
  const catUrl = `https://cataas.com/cat?width=300&height=450&_id=${encodeURIComponent(suggestion.id || suggestion.title || 'cat')}`;

  return (
    <Card
      variant="default"
      className="movie-item-card suggestion-item-card slide-up"
      style={{
        padding: 0,
        marginBottom: 0,
        animation: `fade-in ${motion.duration.normal} ${motion.easing.easeOut} ${animationDelay} both`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <MediaCard.PosterWrap className="movie-item-poster-wrap">
        <div className="movie-poster-wrap">
          {shouldShowPoster ? (
            <img
              src={posterUrl}
              alt={`${suggestion.title} poster`}
              loading="lazy"
              className="movie-poster"
              onError={() => setHasImageError(true)}
            />
          ) : !hasCatError ? (
            <>
              <img
                src={catUrl}
                alt={`A cat representing ${suggestion.title}`}
                loading="lazy"
                className="movie-poster movie-poster--cat-fallback"
                onError={() => setHasCatError(true)}
              />
              <div className="movie-poster-cat-title" aria-hidden="true">
                {suggestion.title}
              </div>
            </>
          ) : (
            <div className="movie-poster-fallback">
              <div className="movie-poster-fallback__inner">
                <h3 className="movie-poster-fallback__title">{suggestion.title}</h3>
              </div>
            </div>
          )}
        </div>

        <MediaCard.Overlay className="movie-item-overlay">
          <MediaCard.Info>
            <div
              className="suggestion-item-card__eyebrow"
              style={{ ...typography.presets.eyebrow, color: colors.accent, opacity: 0.9 }}
            >
              From {suggestion.suggestedBy}
            </div>
            <MediaCard.Title
              className={`movie-item-title ${posterUrl ? '' : 'movie-item-title--fallback'}`}
            >
              {suggestion.title}
            </MediaCard.Title>
            {suggestion.reason && (
              <p
                style={{
                  margin: 0,
                  ...typography.presets.caption,
                  color: colors.textSecondary,
                  fontStyle: 'italic',
                  lineHeight: 1.4,
                  marginTop: spacing.xs,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                &quot;{suggestion.reason}&quot;
              </p>
            )}
          </MediaCard.Info>
        </MediaCard.Overlay>
      </MediaCard.PosterWrap>

      <div
        className="movie-item-action-rail"
        style={{
          display: 'flex',
          gap: spacing.xs,
          padding: spacing.sm,
        }}
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={onAccept}
          isLoading={isProcessing}
          disabled={actionsDisabled}
          className="suggestion-item-card__button is-accept"
          aria-label="Accept suggestion"
          style={{ flex: 1, padding: 0 }}
        >
          <CheckIcon style={{ width: 16, height: 16 }} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReject}
          disabled={actionsDisabled}
          className="suggestion-item-card__button is-reject"
          aria-label="Reject suggestion"
          style={{ flex: 1, padding: 0 }}
        >
          <CrossIcon style={{ width: 16, height: 16 }} />
        </Button>
      </div>

      {!canRespond && (
        <p
          className="suggestion-item-card__profile-hint"
          style={{
            margin: 0,
            padding: `0 ${spacing.sm} ${spacing.sm}`,
            ...typography.presets.caption,
            color: colors.textSecondary,
            textAlign: 'center',
          }}
        >
          Pick a profile to review suggestions.
        </p>
      )}

      {isProcessing && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.1)',
            backdropFilter: 'blur(1px)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
      )}
    </Card>
  );
};

export default SuggestionCard;
