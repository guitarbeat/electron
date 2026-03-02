import React from 'react';
import { MainTab, Movie, Place } from '../../types';
import { useMovies } from '../../hooks/useMovies';
import { usePlaces } from '../../hooks/usePlaces';
import { useUser } from '../../context/UserContext';
import Button from '../ui/Button';
import Skeleton from '../ui/Skeleton';
import { colors, spacing, typography, radius, shadows } from '../../design-system/tokens';

interface DashboardProps {
  onNavigate: (tab: MainTab) => void;
}

const sectionCardStyle: React.CSSProperties = {
  padding: spacing.lg,
  borderRadius: radius.lg,
  border: `1px solid ${colors.accent}20`,
  borderTop: `2px solid ${colors.accent}35`,
  background:
    'radial-gradient(ellipse at 10% -10%, rgba(255, 105, 180, 0.06) 0%, transparent 40%), linear-gradient(165deg, rgba(23, 33, 58, 0.8) 0%, rgba(12, 18, 35, 0.85) 100%)',
  boxShadow: `${shadows.card}, inset 0 1px 0 rgba(255,255,255,0.05)`,
  position: 'relative' as const,
  overflow: 'hidden',
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  color: colors.textPrimary,
  fontFamily: typography.fontFamily.heading.join(', '),
  fontSize: typography.fontSize.lg,
  letterSpacing: '0.03em',
};

const itemStyle: React.CSSProperties = {
  padding: `${spacing.sm} ${spacing.md}`,
  borderRadius: radius.md,
  background: 'rgba(255,255,255,0.03)',
  border: `1px solid ${colors.borderSecondary}15`,
  borderLeft: `3px solid ${colors.accent}30`,
  color: colors.textSecondary,
  fontSize: typography.fontSize.sm,
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
  transition: 'background 0.2s ease, border-color 0.2s ease',
};

const MAX_PREVIEW = 5;

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { currentUser } = useUser();
  const { movies, isLoading: moviesLoading } = useMovies(currentUser, false);
  const { places, isLoading: placesLoading } = usePlaces(currentUser, false);

  const unwatchedMovies = movies.filter((m: Movie) => m.watchedBy.length < 2);
  const unvisitedPlaces = places.filter((p: Place) => !p.visitedAt);

  const sectionLabel: React.CSSProperties = {
    margin: 0,
    fontSize: typography.fontSize.xs,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    opacity: 0.6,
    marginBottom: spacing.xs,
  };

  return (
    <div
      className="animate-fade-in"
      style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}
    >
      {/* Movies Section */}
      <div style={sectionCardStyle} className="retro-card-shine">
        <p style={sectionLabel}>✦ Up Next</p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.md,
          }}
        >
          <h2 style={sectionTitleStyle}>
            <span style={{ marginRight: spacing.sm }}>🎬</span>
            What to watch
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('queue')}
            style={{ color: colors.accent, opacity: 0.8 }}
          >
            See all →
          </Button>
        </div>

        <hr className="retro-divider" />

        {moviesLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} style={{ height: '44px', borderRadius: radius.md }} />
            ))}
          </div>
        )}

        {!moviesLoading && unwatchedMovies.length === 0 && (
          <p
            style={{
              margin: 0,
              color: colors.textTertiary,
              fontSize: typography.fontSize.sm,
              textAlign: 'center',
              padding: spacing.lg,
            }}
          >
            ✧ Your queue is empty — add movies to get started! ✧
          </p>
        )}

        {!moviesLoading && unwatchedMovies.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            {unwatchedMovies.slice(0, MAX_PREVIEW).map((movie: Movie) => (
              <div key={movie.id} style={itemStyle}>
                {movie.posterUrl && (
                  <img
                    src={movie.posterUrl}
                    alt=""
                    style={{
                      width: 28,
                      height: 40,
                      objectFit: 'cover',
                      borderRadius: 4,
                      flexShrink: 0,
                      border: `1px solid ${colors.accent}20`,
                    }}
                  />
                )}
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {movie.title}
                </span>
                {movie.year && (
                  <span
                    style={{
                      color: colors.textTertiary,
                      fontSize: typography.fontSize.xs,
                      flexShrink: 0,
                      opacity: 0.7,
                    }}
                  >
                    {movie.year}
                  </span>
                )}
              </div>
            ))}
            {unwatchedMovies.length > MAX_PREVIEW && (
              <p
                style={{
                  margin: 0,
                  color: colors.accent,
                  fontSize: typography.fontSize.xs,
                  textAlign: 'center',
                  opacity: 0.5,
                }}
              >
                +{unwatchedMovies.length - MAX_PREVIEW} more
              </p>
            )}
          </div>
        )}
      </div>

      {/* Places Section */}
      <div
        style={{
          ...sectionCardStyle,
          borderTop: `2px solid ${colors.secondary}35`,
          background:
            'radial-gradient(ellipse at 90% -10%, rgba(135, 206, 250, 0.06) 0%, transparent 40%), linear-gradient(165deg, rgba(23, 33, 58, 0.8) 0%, rgba(12, 18, 35, 0.85) 100%)',
        }}
        className="retro-card-shine"
      >
        <p style={{ ...sectionLabel, color: colors.secondary }}>✦ Explore</p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.md,
          }}
        >
          <h2 style={sectionTitleStyle}>
            <span style={{ marginRight: spacing.sm }}>📍</span>
            Where to go
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('places')}
            style={{ color: colors.secondary, opacity: 0.8 }}
          >
            See all →
          </Button>
        </div>

        <hr className="retro-divider" />

        {placesLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} style={{ height: '44px', borderRadius: radius.md }} />
            ))}
          </div>
        )}

        {!placesLoading && unvisitedPlaces.length === 0 && (
          <p
            style={{
              margin: 0,
              color: colors.textTertiary,
              fontSize: typography.fontSize.sm,
              textAlign: 'center',
              padding: spacing.lg,
            }}
          >
            ✧ No places yet — add spots you want to visit! ✧
          </p>
        )}

        {!placesLoading && unvisitedPlaces.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            {unvisitedPlaces.slice(0, MAX_PREVIEW).map((place: Place) => (
              <div
                key={place.id}
                style={{
                  ...itemStyle,
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  gap: spacing.xs,
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, minWidth: 0 }}
                >
                  <span
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {place.name}
                  </span>
                  {place.addedBy && (
                    <span
                      style={{
                        color: colors.textTertiary,
                        fontSize: typography.fontSize.xs,
                        flexShrink: 0,
                      }}
                    >
                      by {place.addedBy}
                    </span>
                  )}
                </div>
                {place.notes && (
                  <span
                    style={{
                      color: colors.textTertiary,
                      fontSize: typography.fontSize.xs,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block',
                    }}
                  >
                    {place.notes}
                  </span>
                )}
              </div>
            ))}
            {unvisitedPlaces.length > MAX_PREVIEW && (
              <p
                style={{
                  margin: 0,
                  color: colors.secondary,
                  fontSize: typography.fontSize.xs,
                  textAlign: 'center',
                  opacity: 0.5,
                }}
              >
                +{unvisitedPlaces.length - MAX_PREVIEW} more
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
