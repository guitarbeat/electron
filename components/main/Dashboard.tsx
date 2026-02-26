import React from 'react';
import { MainTab, User, Movie, Place } from '../../types';
import { useMovies } from '../../hooks/useMovies';
import { usePlaces } from '../../hooks/usePlaces';
import { useUser } from '../../context/UserContext';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Skeleton from '../ui/Skeleton';
import { colors, spacing, typography, radius, shadows } from '../../design-system/tokens';

interface DashboardProps {
  onNavigate: (tab: MainTab) => void;
}

const sectionCardStyle: React.CSSProperties = {
  padding: spacing.lg,
  borderRadius: radius.lg,
  border: `1px solid ${colors.borderSecondary}35`,
  background: `linear-gradient(145deg, ${colors.surfaceElevated}, ${colors.surface})`,
  boxShadow: shadows.card,
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
  background: 'rgba(255,255,255,0.04)',
  border: `1px solid ${colors.borderSecondary}20`,
  color: colors.textSecondary,
  fontSize: typography.fontSize.sm,
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
};

const MAX_PREVIEW = 5;

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { currentUser } = useUser();
  const { movies, isLoading: moviesLoading } = useMovies(currentUser, false);
  const { places, isLoading: placesLoading } = usePlaces(currentUser, false);

  const unwatchedMovies = movies.filter((m: Movie) => m.watchedBy.length < 2);
  const unvisitedPlaces = places.filter((p: Place) => !p.visitedAt);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
      {/* Movies Section */}
      <div style={sectionCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
          <h2 style={sectionTitleStyle}>
            <span style={{ marginRight: spacing.sm }}>🎬</span>
            What to watch
          </h2>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('queue')}>
            See all →
          </Button>
        </div>

        {moviesLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} style={{ height: '40px', borderRadius: radius.md }} />
            ))}
          </div>
        ) : unwatchedMovies.length === 0 ? (
          <p style={{ margin: 0, color: colors.textTertiary, fontSize: typography.fontSize.sm }}>
            Your queue is empty — add movies to get started!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            {unwatchedMovies.slice(0, MAX_PREVIEW).map((movie: Movie) => (
              <div key={movie.id} style={itemStyle}>
                {movie.posterUrl && (
                  <img
                    src={movie.posterUrl}
                    alt=""
                    style={{ width: 28, height: 40, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                  />
                )}
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {movie.title}
                </span>
                {movie.year && (
                  <span style={{ color: colors.textTertiary, fontSize: typography.fontSize.xs, flexShrink: 0 }}>
                    {movie.year}
                  </span>
                )}
              </div>
            ))}
            {unwatchedMovies.length > MAX_PREVIEW && (
              <p style={{ margin: 0, color: colors.textTertiary, fontSize: typography.fontSize.xs, textAlign: 'center' }}>
                +{unwatchedMovies.length - MAX_PREVIEW} more
              </p>
            )}
          </div>
        )}
      </div>

      {/* Places Section */}
      <div style={sectionCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
          <h2 style={sectionTitleStyle}>
            <span style={{ marginRight: spacing.sm }}>📍</span>
            Where to go
          </h2>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('places')}>
            See all →
          </Button>
        </div>

        {placesLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} style={{ height: '40px', borderRadius: radius.md }} />
            ))}
          </div>
        ) : unvisitedPlaces.length === 0 ? (
          <p style={{ margin: 0, color: colors.textTertiary, fontSize: typography.fontSize.sm }}>
            No places yet — add spots you want to visit!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            {unvisitedPlaces.slice(0, MAX_PREVIEW).map((place: Place) => (
              <div key={place.id} style={{ ...itemStyle, flexDirection: 'column', alignItems: 'stretch', gap: spacing.xs }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, minWidth: 0 }}>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {place.name}
                  </span>
                  {place.addedBy && (
                    <span style={{ color: colors.textTertiary, fontSize: typography.fontSize.xs, flexShrink: 0 }}>
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
              <p style={{ margin: 0, color: colors.textTertiary, fontSize: typography.fontSize.xs, textAlign: 'center' }}>
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
