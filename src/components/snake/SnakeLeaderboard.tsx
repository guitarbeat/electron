import React from 'react';
import Button from '@/ui/Button';
import { colors, radius, spacing, typography } from '@/design-system/tokens';
import { SnakeLeaderboardEntry } from './useSnakeLeaderboard';

interface SnakeLeaderboardProps {
  entries: SnakeLeaderboardEntry[];
  onClear: () => void;
}

const SnakeLeaderboard: React.FC<SnakeLeaderboardProps> = ({ entries, onClear }) => {
  return (
    <div
      style={{
        marginTop: spacing.sm,
        marginBottom: spacing.sm,
        borderTop: `1px solid ${colors.borderInset}`,
        paddingTop: spacing.sm,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.xs,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: typography.fontSize.sm,
            color: colors.textPrimary,
            fontFamily: typography.fontFamily.heading.join(', '),
            letterSpacing: typography.letterSpacing.normal,
          }}
        >
          Snake Leaderboard
        </h3>
        {entries.length > 0 && (
          <Button size="sm" variant="ghost" onClick={onClear}>
            Clear
          </Button>
        )}
      </div>

      {entries.length === 0 ? (
        <p
          style={{
            margin: 0,
            color: colors.textSecondary,
            fontSize: typography.fontSize.xs,
          }}
        >
          No scores yet. Finish a run to claim the top spot.
        </p>
      ) : (
        <ol
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.xs,
          }}
        >
          {entries.map((entry, index) => (
            <li
              key={entry.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '28px 1fr auto',
                alignItems: 'center',
                gap: spacing.sm,
                padding: `${spacing.xs} ${spacing.sm}`,
                borderRadius: radius.md,
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: `1px solid ${colors.borderSecondary}25`,
              }}
            >
              <span
                style={{
                  color: colors.textTertiary,
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.bold,
                }}
              >
                #{index + 1}
              </span>
              <span
                style={{
                  color: colors.textPrimary,
                  fontSize: typography.fontSize.sm,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={entry.name}
              >
                {entry.name}
              </span>
              <span
                style={{
                  color: colors.accent,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.bold,
                }}
              >
                {entry.score}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};

export default SnakeLeaderboard;
