import React from 'react';
import { Modal } from '@/ui/modals';
import type { Movie } from '@/shared/types';
import { colors, spacing, typography, radius } from '@/theme/tokens';
import { useMediaQuery, mediaBreakpoints } from '@/hooks/useMediaQuery';

interface MovieDetailsModalProps {
  movie: Movie;
  isOpen: boolean;
  onClose: () => void;
}

const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({
  movie,
  isOpen,
  onClose,
}) => {
  const isMobile = useMediaQuery(mediaBreakpoints.sm);
  const [hasPosterError, setHasPosterError] = React.useState(false);
  const [hasCatError, setHasCatError] = React.useState(false);

  React.useEffect(() => {
    setHasPosterError(false);
    setHasCatError(false);
  }, [movie.posterUrl]);

  const shouldShowPoster = Boolean(movie.posterUrl) && !hasPosterError;
  const catUrl = `https://cataas.com/cat/says/${encodeURIComponent(movie.title || 'No Poster')}?fontSize=18&width=400&height=600`;

  const metadataItems = [
    { label: 'Year', value: movie.year },
    { label: 'Runtime', value: movie.runtime },
    { label: 'Rating', value: movie.imdbRating ? `${movie.imdbRating} IMDb` : null },
    { label: 'Genre', value: movie.genre },
    { label: 'Director', value: movie.director },
    { label: 'Category', value: movie.category },
  ].filter(item => Boolean(item.value));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={movie.title}
      maxWidth={640}
      variant={isMobile ? 'fullscreen' : 'centered'}
    >
      <div style={{ padding: isMobile ? spacing.xl : spacing.lg, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? spacing.xl : spacing.lg }}>
        {/* Poster Section */}
        <div style={{ flexShrink: 0, width: isMobile ? '100%' : '200px', maxHeight: isMobile ? '50dvh' : undefined, display: 'flex', justifyContent: 'center' }}>
          {shouldShowPoster ? (
            <img
              src={movie.posterUrl}
              alt={`${movie.title} poster`}
              style={{
                width: '100%',
                borderRadius: radius.md,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                display: 'block'
              }}
              onError={() => setHasPosterError(true)}
            />
          ) : !hasCatError ? (
            <img
              src={catUrl}
              alt={`A cat representing ${movie.title}`}
              style={{
                width: '100%',
                borderRadius: radius.md,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                display: 'block',
                aspectRatio: '2/3',
                objectFit: 'cover',
              }}
              onError={() => setHasCatError(true)}
            />
          ) : (
            <div
              style={{
                width: '100%',
                aspectRatio: '2/3',
                backgroundColor: colors.surface1,
                borderRadius: radius.md,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${colors.borderSubtle}`,
                color: colors.textTertiary,
                fontSize: typography.fontSize.sm,
                textAlign: 'center',
                padding: spacing.md
              }}
            >
              No Poster Available
            </div>
          )}
        </div>

        {/* Content Section */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {/* Metadata Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: spacing.md }}>
            {metadataItems.map((item) => (
              <div key={item.label}>
                <div style={{ fontSize: typography.fontSize.xs, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: typography.fontSize.sm, color: colors.textPrimary, fontWeight: typography.fontWeight.medium }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Plot */}
          {movie.plot && (
            <div style={{ marginTop: spacing.sm }}>
              <div style={{ fontSize: typography.fontSize.xs, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Plot
              </div>
              <p style={{ 
                fontSize: typography.fontSize.base, 
                color: colors.textSecondary, 
                lineHeight: 1.6, 
                margin: 0,
                whiteSpace: 'pre-wrap'
              }}>
                {movie.plot}
              </p>
            </div>
          )}

          {/* Status info */}
          <div style={{ 
            marginTop: 'auto', 
            paddingTop: spacing.md, 
            borderTop: `1px solid ${colors.borderSecondary}20`,
            fontSize: typography.fontSize.xs,
            color: colors.textTertiary,
            display: 'flex',
            flexWrap: 'wrap',
            gap: spacing.md
          }}>
            <span>Added by <strong>{movie.addedBy}</strong></span>
            {movie.watchedBy.length > 0 && (
              <span>Watched by: <strong>{movie.watchedBy.join(', ')}</strong></span>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default MovieDetailsModal;
