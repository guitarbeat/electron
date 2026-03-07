import React from 'react';
import { User } from '@/types';
import { spacing, colors, radius, typography } from '@/design-system/tokens';

interface UserSelectionProps {
  className?: string;
  variant?: 'default' | 'inline' | 'compact';
  onSelect?: (user: User) => void;
  currentUser?: User | null;
}

const UserSelection: React.FC<UserSelectionProps> = ({
  className = '',
  variant = 'default',
  onSelect,
  currentUser,
}) => {
  const users: User[] = ['Aaron', 'Electra'];
  const userMeta: Record<User, { icon: string; role: string; background: string }> = {
    Aaron: {
      icon: '👨‍💻',
      role: 'Movie Curator',
      background: 'linear-gradient(140deg, #ff7da8 0%, #ffd9a0 100%)',
    },
    Electra: {
      icon: '👩‍🎨',
      role: 'Date Architect',
      background: 'linear-gradient(140deg, #ff8f6b 0%, #ffd8bf 100%)',
    },
  };

  if (variant === 'inline') {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          gap: spacing.xs,
          alignItems: 'center',
        }}
        aria-label="Select active pilot"
      >
        {users.map((user) => (
          <button
            key={user}
            onClick={() => onSelect?.(user)}
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: spacing.xs,
              minHeight: '42px',
              minWidth: '112px',
              padding: `${spacing.xs} ${spacing.sm}`,
              borderRadius: radius.full,
              fontSize: typography.fontSize.xs,
              background: currentUser === user ? userMeta[user].background : colors.surface,
              color: currentUser === user ? '#0f1115' : colors.textSecondary,
              border: `1px solid ${currentUser === user ? '#ffffff99' : colors.borderSecondary}`,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow:
                currentUser === user
                  ? '0 10px 20px rgba(0, 0, 0, 0.22)'
                  : '0 2px 6px rgba(0, 0, 0, 0.14)',
              fontWeight: 700,
            }}
            aria-pressed={currentUser === user}
            title={`${user} ${currentUser === user ? '(active)' : '(switch pilot)'}`}
          >
            <span aria-hidden style={{ fontSize: '18px', lineHeight: 1 }}>
              {userMeta[user].icon}
            </span>
            <span
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                lineHeight: 1.1,
              }}
            >
              <span>{user}</span>
              <span
                style={{
                  fontSize: '0.62rem',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  opacity: currentUser === user ? 0.75 : 0.9,
                }}
              >
                {userMeta[user].role}
              </span>
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`user-selection ${className}`} style={{ padding: spacing.md }}>
      <h3
        style={{
          color: colors.textPrimary,
          fontSize: typography.fontSize.sm,
          marginBottom: spacing.sm,
        }}
      >
        Who are you?
      </h3>
      <div style={{ display: 'flex', gap: spacing.md }}>
        {users.map((user) => (
          <button
            key={user}
            onClick={() => onSelect?.(user)}
            style={{
              padding: spacing.md,
              borderRadius: radius.md,
              flex: 1,
              background: currentUser === user ? `${colors.accent}20` : colors.surface,
              border: `2px solid ${currentUser === user ? colors.accent : colors.borderSecondary}`,
              color: currentUser === user ? colors.accent : colors.textPrimary,
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            {user}
          </button>
        ))}
      </div>
    </div>
  );
};

export default UserSelection;
