import React from 'react';

interface MediaPosterProps {
  title: string;
  posterUrl?: string;
  year?: string;
  id?: string;
  className?: string;
}

export const MediaPoster: React.FC<MediaPosterProps> = ({
  title,
  posterUrl,
  year,
  id,
  className = '',
}) => {
  const [hasImageError, setHasImageError] = React.useState(false);
  const [hasCatError, setHasCatError] = React.useState(false);

  React.useEffect(() => {
    setHasImageError(false);
    setHasCatError(false);
  }, [posterUrl]);

  const shouldShowPoster = Boolean(posterUrl) && !hasImageError;
  const catUrl = `https://cataas.com/cat?width=300&height=450&_id=${encodeURIComponent(id || title || 'cat')}`;

  return (
    <div className={`movie-poster-wrap ${className}`}>
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
            {year ? <span className="movie-poster-fallback__year">{year}</span> : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaPoster;
