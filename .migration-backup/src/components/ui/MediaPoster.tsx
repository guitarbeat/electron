import React from 'react';

interface MediaPosterProps {
  title: string;
  posterUrl?: string;
  year?: string;
  id?: string;
  className?: string;
}

const brokenUrls = new Set<string>();

export const MediaPoster: React.FC<MediaPosterProps> = ({
  title,
  posterUrl,
  year,
  id,
  className = '',
}) => {
  const [hasImageError, setHasImageError] = React.useState(() =>
    posterUrl ? brokenUrls.has(posterUrl) : false
  );
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasCatError, setHasCatError] = React.useState(false);

  React.useEffect(() => {
    setHasImageError(posterUrl ? brokenUrls.has(posterUrl) : false);
    setIsLoaded(false);
    setHasCatError(false);
  }, [posterUrl]);

  const handleImageError = () => {
    if (posterUrl) {
      brokenUrls.add(posterUrl);
    }
    setHasImageError(true);
    setIsLoaded(true);
  };

  const shouldShowPoster = Boolean(posterUrl) && !hasImageError;
  const catUrl = `https://cataas.com/cat?width=300&height=450&_id=${encodeURIComponent(id || title || 'cat')}`;

  return (
    <div className={`movie-poster-wrap ${className} ${isLoaded ? 'is-loaded' : 'is-loading'}`}>
      {!isLoaded && shouldShowPoster && (
        <div className="movie-poster-skeleton skeleton" />
      )}
      
      {shouldShowPoster ? (
        <img
          src={posterUrl}
          alt={`${title} poster`}
          loading="lazy"
          className={`movie-poster ${isLoaded ? 'is-loaded' : ''}`}
          onLoad={() => setIsLoaded(true)}
          onError={handleImageError}
        />
      ) : !hasCatError ? (
        <>
          <img
            src={catUrl}
            alt={`A cat representing ${title}`}
            loading="lazy"
            className={`movie-poster movie-poster--cat-fallback ${isLoaded ? 'is-loaded' : ''}`}
            onLoad={() => setIsLoaded(true)}
            onError={() => {
              setHasCatError(true);
              setIsLoaded(true);
            }}
          />
          <div className="movie-poster-cat-title" aria-hidden="true">
            {title}
          </div>
        </>
      ) : (
        <div className="movie-poster-fallback">
          <div className="movie-poster-fallback__inner">
            <h3 className="movie-poster-fallback__title">{title}</h3>
            {year ? <span className="movie-poster-fallback__year">{year}</span> : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaPoster;
