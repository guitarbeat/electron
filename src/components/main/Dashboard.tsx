import React, { useState } from 'react';
import { MainTab, Movie, Place } from '@/types';
import { useMovies } from '@/hooks/useMovies';
import { usePlaces } from '@/hooks/usePlaces';
import { useUser } from '@/context/UserContext';
import Skeleton from '@/ui/Skeleton';
import { colors, spacing, typography, radius, shadows } from '@/design-system/tokens';
import './Dashboard.css';
import { ChevronDownIcon, ChevronUpIcon } from '@/common/icons';

/* ── Reusable accordion card ── */

interface MiniPreviewProps {
  title: string;
  icon: string;
  items: React.ReactNode[];
  onNavigate: () => void;
  isLoading: boolean;
  accentColor: string;
  defaultExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
}

const MiniPreview: React.FC<MiniPreviewProps> = ({
  title,
  icon,
  items,
  onNavigate,
  isLoading,
  accentColor,
  defaultExpanded = false,
  onToggle,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    onToggle?.(next);
  };

  return (
    <div className="y2k-card retro-card-shine">
      {/* Header (click to expand/collapse) */}
      <div className="y2k-card-header" onClick={handleToggle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <span style={{ fontSize: '1.2rem' }}>{icon}</span>
          <div>
            <h3
              className="y2k-header"
              style={{
                margin: 0,
                fontSize: typography.fontSize.base,
                fontFamily: typography.fontFamily.heading.join(', '),
                letterSpacing: '0.03em',
              }}
            >
              ✦ {title} ✦
            </h3>
            {!isExpanded && items.length > 0 && (
              <p
                style={{
                  margin: '2px 0 0 0',
                  fontSize: typography.fontSize.xs,
                  color: colors.textTertiary,
                }}
              >
                {items.length} item{items.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate();
            }}
            className="y2k-link"
          >
            Open Full →
          </button>
          {isExpanded ? (
            <ChevronUpIcon style={{ width: 16, height: 16, color: colors.textTertiary }} />
          ) : (
            <ChevronDownIcon style={{ width: 16, height: 16, color: colors.textTertiary }} />
          )}
        </div>
      </div>

      {/* Collapsible body */}
      <div
        className="y2k-card-body"
        style={{
          maxHeight: isExpanded ? '500px' : '0px',
          opacity: isExpanded ? 1 : 0,
          padding: isExpanded ? `0 ${spacing.md} ${spacing.md}` : `0 ${spacing.md}`,
        }}
      >
        <hr className="retro-divider" style={{ margin: `0 0 ${spacing.sm} 0` }} />

        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing.sm }}>
            {[1, 2].map((i) => (
              <Skeleton key={i} style={{ height: '40px', borderRadius: radius.md }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p
            style={{
              margin: 0,
              fontSize: typography.fontSize.xs,
              color: colors.textTertiary,
              textAlign: 'center',
              padding: spacing.md,
              fontStyle: 'italic',
            }}
          >
            ✧ Nothing here yet! ✧
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing.sm }}>
            {items}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Dashboard ── */

interface DashboardProps {
  onNavigate: (tab: MainTab) => void;
}

const itemBase: React.CSSProperties = {
  padding: spacing.sm,
  borderRadius: radius.md,
  background: 'rgba(255,255,255,0.03)',
  border: `1px solid ${colors.borderSecondary}15`,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: spacing.xs,
  transition: 'all 0.2s ease',
  cursor: 'pointer',
};

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { currentUser } = useUser();
  const { movies, isLoading: moviesLoading } = useMovies(currentUser, false);
  const { places, isLoading: placesLoading } = usePlaces(currentUser, false);
  const [moviesExpanded, setMoviesExpanded] = useState(true);
  const [placesExpanded, setPlacesExpanded] = useState(true);

  const unwatchedMovies = movies.filter((m: Movie) => m.watchedBy.length < 2).slice(0, 3);
  const unvisitedPlaces = places.filter((p: Place) => !p.visitedAt).slice(0, 3);

  return (
    <div
      className="animate-fade-in"
      style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}
    >
      <header style={{ textAlign: 'center', marginBottom: spacing.xs }}>
        <h2
          className="y2k-header"
          style={{
            margin: 0,
            fontSize: typography.fontSize.xl,
            fontFamily: typography.fontFamily.heading.join(', '),
          }}
        >
          ★ Quick Access ★
        </h2>
        <p style={{ margin: 0, fontSize: typography.fontSize.xs, color: colors.textTertiary }}>
          Click sections to expand or collapse
        </p>
      </header>

      <MiniPreview
        title="Movies to Watch"
        icon="🎬"
        isLoading={moviesLoading}
        accentColor={colors.accent}
        onNavigate={() => onNavigate('queue')}
        defaultExpanded={moviesExpanded}
        onToggle={setMoviesExpanded}
        items={unwatchedMovies.map((movie) => (
          <div key={movie.id} style={itemBase} className="y2k-item">
            {movie.posterUrl && (
              <img
                src={movie.posterUrl}
                alt=""
                style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: 4 }}
              />
            )}
            <span
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.textSecondary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '100%',
              }}
            >
              {movie.title}
            </span>
          </div>
        ))}
      />

      <MiniPreview
        title="Places to Visit"
        icon="📍"
        isLoading={placesLoading}
        accentColor={colors.secondary}
        onNavigate={() => onNavigate('places')}
        defaultExpanded={placesExpanded}
        onToggle={setPlacesExpanded}
        items={unvisitedPlaces.map((place) => (
          <div
            key={place.id}
            style={{ ...itemBase, borderLeft: `3px solid ${colors.secondary}50` }}
            className="y2k-item"
          >
            <span
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.textSecondary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '100%',
              }}
            >
              {place.name}
            </span>
          </div>
        ))}
      />
    </div>
  );
};

export default Dashboard;
