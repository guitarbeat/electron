import React, { useMemo, useState } from 'react';
import { useUser } from '@/app/useProviders';
import { useMovies } from '@/hooks/movies/useMovies';
import { usePlaces } from '@/hooks/places/usePlaces';
import { useFavorites, type FavoriteKind } from '@/hooks/useFavorites';
import { spacing, radius } from '@/theme/tokens';

type Tab = 'movies' | 'places';
type Filter = 'all' | 'favorites';

const StarGlyph: React.FC<{ size?: number; filled?: boolean }> = ({
  size = 18,
  filled = true,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
  padding: spacing.lg,
  height: '100%',
};

const headerRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing.md,
  flexWrap: 'wrap',
};

const tabBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: spacing.sm,
};

const filterBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: spacing.xs,
  padding: spacing.xs,
  borderRadius: radius.lg,
  background: 'color-mix(in srgb, var(--color-surface-2, rgba(0,0,0,0.3)) 60%, transparent)',
};

const tabButtonBase: React.CSSProperties = {
  appearance: 'none',
  border: 'none',
  background: 'transparent',
  color: 'var(--color-text-secondary, #ccc)',
  fontSize: '0.95rem',
  fontWeight: 600,
  padding: `${spacing.sm} ${spacing.md}`,
  borderRadius: radius.md,
  cursor: 'pointer',
  transition: 'background 0.18s ease, color 0.18s ease',
};

const tabButtonActive: React.CSSProperties = {
  ...tabButtonBase,
  background: 'color-mix(in srgb, var(--color-accent) 22%, transparent)',
  color: 'var(--color-text-primary, #fff)',
};

const filterButtonBase: React.CSSProperties = {
  appearance: 'none',
  border: 'none',
  background: 'transparent',
  color: 'var(--color-text-secondary, #ccc)',
  fontSize: '0.78rem',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  padding: `${spacing.xs} ${spacing.sm}`,
  borderRadius: radius.md,
  cursor: 'pointer',
};

const filterButtonActive: React.CSSProperties = {
  ...filterButtonBase,
  background: 'var(--color-surface-1, rgba(255,255,255,0.08))',
  color: 'var(--color-text-primary, #fff)',
  boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--color-accent) 30%, transparent)',
};

const listStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: spacing.md,
  flex: 1,
  overflowY: 'auto',
  padding: `${spacing.sm} 0`,
  listStyle: 'none',
  margin: 0,
};

const cardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.xs,
  padding: spacing.md,
  borderRadius: radius.lg,
  border: '1px solid color-mix(in srgb, var(--color-border-subtle, rgba(255,255,255,0.12)) 80%, transparent)',
  background: 'color-mix(in srgb, var(--color-surface-1, rgba(0,0,0,0.4)) 80%, transparent)',
};

const titleRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: spacing.sm,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '1rem',
  fontWeight: 600,
  color: 'var(--color-text-primary, #fff)',
};

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '0.85rem',
  color: 'var(--color-text-secondary, #ccc)',
};

const starButtonStyle = (active: boolean): React.CSSProperties => ({
  appearance: 'none',
  border: 'none',
  background: 'transparent',
  color: active ? '#ffc857' : 'var(--color-text-tertiary, #888)',
  cursor: 'pointer',
  padding: spacing.xs,
  borderRadius: radius.sm,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'color 0.18s ease, transform 0.18s ease',
});

const emptyStateStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing.sm,
  padding: spacing.xl,
  textAlign: 'center',
  color: 'var(--color-text-secondary, #ccc)',
  flex: 1,
};

const FavoritesPanel: React.FC = () => {
  const { currentUser } = useUser();
  const { movies } = useMovies(currentUser, false);
  const { places } = usePlaces(currentUser, false);
  const {
    movieFavorites,
    placeFavorites,
    toggleFavorite,
    isFavorite,
    movieCount,
    placeCount,
  } = useFavorites(currentUser);

  const [tab, setTab] = useState<Tab>(movieCount >= placeCount ? 'movies' : 'places');
  const [filter, setFilter] = useState<Filter>('favorites');

  const visibleMovies = useMemo(
    () => (filter === 'favorites' ? movies.filter((m) => movieFavorites.has(m.id)) : movies),
    [movies, movieFavorites, filter]
  );

  const visiblePlaces = useMemo(
    () => (filter === 'favorites' ? places.filter((p) => placeFavorites.has(p.id)) : places),
    [places, placeFavorites, filter]
  );

  const items = tab === 'movies' ? visibleMovies : visiblePlaces;
  const activeKind: FavoriteKind = tab === 'movies' ? 'movie' : 'place';
  const totalCount = tab === 'movies' ? movies.length : places.length;
  const favCount = tab === 'movies' ? movieCount : placeCount;

  return (
    <div style={containerStyle}>
      <div style={headerRowStyle}>
        <div style={tabBarStyle} role="tablist" aria-label="Favorites categories">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'movies'}
            style={tab === 'movies' ? tabButtonActive : tabButtonBase}
            onClick={() => setTab('movies')}
          >
            Movies <span aria-hidden="true">({movieCount})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'places'}
            style={tab === 'places' ? tabButtonActive : tabButtonBase}
            onClick={() => setTab('places')}
          >
            Places <span aria-hidden="true">({placeCount})</span>
          </button>
        </div>

        <div
          style={filterBarStyle}
          role="group"
          aria-label={`Show all ${tab} or only favorites`}
        >
          <button
            type="button"
            style={filter === 'favorites' ? filterButtonActive : filterButtonBase}
            onClick={() => setFilter('favorites')}
            aria-pressed={filter === 'favorites'}
          >
            Starred ({favCount})
          </button>
          <button
            type="button"
            style={filter === 'all' ? filterButtonActive : filterButtonBase}
            onClick={() => setFilter('all')}
            aria-pressed={filter === 'all'}
          >
            All ({totalCount})
          </button>
        </div>
      </div>

      {items.length > 0 ? (
        <ul style={listStyle}>
          {tab === 'movies'
            ? (items as typeof movies).map((movie) => {
                const fav = isFavorite('movie', movie.id);
                return (
                  <li key={movie.id} style={cardStyle}>
                    <div style={titleRowStyle}>
                      <h3 style={titleStyle}>{movie.title}</h3>
                      <button
                        type="button"
                        style={starButtonStyle(fav)}
                        onClick={() => toggleFavorite(activeKind, movie.id)}
                        aria-label={
                          fav
                            ? `Remove ${movie.title} from favorites`
                            : `Add ${movie.title} to favorites`
                        }
                        aria-pressed={fav}
                        title={fav ? 'Starred' : 'Add to favorites'}
                      >
                        <StarGlyph filled={fav} />
                      </button>
                    </div>
                    {movie.year && <p style={subtitleStyle}>{movie.year}</p>}
                    {movie.genre && <p style={subtitleStyle}>{movie.genre}</p>}
                  </li>
                );
              })
            : (items as typeof places).map((place) => {
                const fav = isFavorite('place', place.id);
                return (
                  <li key={place.id} style={cardStyle}>
                    <div style={titleRowStyle}>
                      <h3 style={titleStyle}>{place.name}</h3>
                      <button
                        type="button"
                        style={starButtonStyle(fav)}
                        onClick={() => toggleFavorite(activeKind, place.id)}
                        aria-label={
                          fav
                            ? `Remove ${place.name} from favorites`
                            : `Add ${place.name} to favorites`
                        }
                        aria-pressed={fav}
                        title={fav ? 'Starred' : 'Add to favorites'}
                      >
                        <StarGlyph filled={fav} />
                      </button>
                    </div>
                    {place.category && <p style={subtitleStyle}>{place.category}</p>}
                    {place.notes && <p style={subtitleStyle}>{place.notes}</p>}
                  </li>
                );
              })}
        </ul>
      ) : (
        <div style={emptyStateStyle}>
          <StarGlyph size={36} filled={false} />
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text-primary, #fff)' }}>
            {filter === 'favorites'
              ? `No starred ${tab} yet`
              : `No ${tab} to show`}
          </p>
          <p style={{ margin: 0, maxWidth: '36ch' }}>
            {filter === 'favorites'
              ? `Switch to "All" and tap the star on any ${tab === 'movies' ? 'movie' : 'place'} to favorite it.`
              : `Add ${tab === 'movies' ? 'movies to your watchlist' : 'places to your map'} first, then come back to star them.`}
          </p>
          {filter === 'favorites' && totalCount > 0 && (
            <button
              type="button"
              style={{ ...filterButtonActive, marginTop: spacing.sm }}
              onClick={() => setFilter('all')}
            >
              Show all {tab}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FavoritesPanel;
