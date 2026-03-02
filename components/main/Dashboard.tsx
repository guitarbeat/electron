import React, { useState } from 'react';
import { MainTab, Movie, Place } from '../../types';
import { useMovies } from '../../hooks/useMovies';
import { usePlaces } from '../../hooks/usePlaces';
import { useUser } from '../../context/UserContext';
import Skeleton from '../ui/Skeleton';
import { colors, spacing, typography, radius, shadows } from '../../design-system/tokens';
import { ChevronDownIcon, ChevronUpIcon } from '../common/icons';

interface MiniPreviewProps {
  title: string;
  icon: string;
  items: React.ReactNode[];
  onNavigate: () => void;
  isLoading: boolean;
  accentColor: string;
}

const MiniPreview: React.FC<MiniPreviewProps> = ({ 
  title, 
  icon, 
  items, 
  onNavigate, 
  isLoading, 
  accentColor 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      style={{
        borderRadius: radius.lg,
        border: `1px solid ${accentColor}20`,
        borderTop: `2px solid ${accentColor}35`,
        background: `radial-gradient(ellipse at 10% -10%, ${accentColor}10 0%, transparent 40%), linear-gradient(165deg, rgba(23, 33, 58, 0.8) 0%, rgba(12, 18, 35, 0.85) 100%)`,
        boxShadow: `${shadows.card}, inset 0 1px 0 rgba(255,255,255,0.05)`,
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: spacing.md,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <span style={{ fontSize: '1.2rem' }}>{icon}</span>
          <h3 style={{ 
            margin: 0, 
            fontSize: typography.fontSize.base, 
            color: colors.textPrimary,
            fontFamily: typography.fontFamily.heading.join(', '),
            letterSpacing: '0.03em'
          }}>
            {title}
          </h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate();
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: accentColor,
              fontSize: typography.fontSize.xs,
              fontWeight: 600,
              cursor: 'pointer',
              opacity: 0.8,
              padding: spacing.xs,
            }}
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

      <div
        style={{
          maxHeight: isExpanded ? '500px' : '0px',
          opacity: isExpanded ? 1 : 0,
          overflow: 'hidden',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          padding: isExpanded ? `0 ${spacing.md} ${spacing.md}` : `0 ${spacing.md}`,
        }}
      >
        <hr style={{ 
          border: 'none', 
          height: '1px', 
          background: `linear-gradient(to right, ${accentColor}40, transparent)`,
          margin: `0 0 ${spacing.md} 0`
        }} />
        
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {[1, 2].map((i) => (
              <Skeleton key={i} style={{ height: '40px', borderRadius: radius.md }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p style={{ 
            margin: 0, 
            fontSize: typography.fontSize.xs, 
            color: colors.textTertiary,
            textAlign: 'center',
            padding: spacing.md,
            fontStyle: 'italic'
          }}>
            Nothing here yet!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            {items}
          </div>
        )}
      </div>
    </div>
  );
};

interface DashboardProps {
  onNavigate: (tab: MainTab) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { currentUser } = useUser();
  const { movies, isLoading: moviesLoading } = useMovies(currentUser, false);
  const { places, isLoading: placesLoading } = usePlaces(currentUser, false);

  const unwatchedMovies = movies.filter((m: Movie) => m.watchedBy.length < 2).slice(0, 3);
  const unvisitedPlaces = places.filter((p: Place) => !p.visitedAt).slice(0, 3);

  const itemStyle: React.CSSProperties = {
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: radius.md,
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${colors.borderSecondary}10`,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      <header style={{ textAlign: 'center', marginBottom: spacing.xs }}>
        <h2 style={{ 
          margin: 0, 
          fontSize: typography.fontSize.xl, 
          color: colors.textPrimary,
          fontFamily: typography.fontFamily.heading.join(', ')
        }}>
          Quick Preview
        </h2>
        <p style={{ margin: 0, fontSize: typography.fontSize.xs, color: colors.textTertiary }}>
          Tap to expand details or navigate to sections
        </p>
      </header>

      <MiniPreview
        title="Movies to Watch"
        icon="🎬"
        isLoading={moviesLoading}
        accentColor={colors.accent}
        onNavigate={() => onNavigate('queue')}
        items={unwatchedMovies.map(movie => (
          <div key={movie.id} style={itemStyle}>
             {movie.posterUrl && (
              <img src={movie.posterUrl} alt="" style={{ width: 24, height: 36, objectFit: 'cover', borderRadius: 4 }} />
            )}
            <span style={{ flex: 1, fontSize: typography.fontSize.sm, color: colors.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
        items={unvisitedPlaces.map(place => (
          <div key={place.id} style={{ ...itemStyle, borderLeft: `2px solid ${colors.secondary}40` }}>
            <span style={{ flex: 1, fontSize: typography.fontSize.sm, color: colors.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {place.name}
            </span>
          </div>
        ))}
      />

      <div style={{ 
        marginTop: spacing.sm, 
        padding: spacing.md, 
        textAlign: 'center',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: radius.md,
        border: `1px dashed ${colors.borderSecondary}20`
      }}>
        <p style={{ margin: 0, fontSize: typography.fontSize.xs, color: colors.textTertiary }}>
          More shortcuts coming soon...
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
