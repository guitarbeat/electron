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

  if (variant === 'inline') {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          gap: spacing.sm,
          alignItems: 'center'
        }}
      >
        {users.map(user => (
          <div
            key={user}
            onClick={() => onSelect?.(user)}
            style={{
              padding: `${spacing.xs} ${spacing.sm}`,
              borderRadius: radius.full,
              fontSize: typography.fontSize.xs,
              background: currentUser === user ? colors.accent : 'transparent',
              color: currentUser === user ? 'white' : colors.textSecondary,
              border: `1px solid ${currentUser === user ? colors.accent : colors.borderSecondary}`,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {user}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`user-selection ${className}`} style={{ padding: spacing.md }}>
      <h3 style={{
        color: colors.textPrimary,
        fontSize: typography.fontSize.sm,
        marginBottom: spacing.sm
      }}>
        Who are you?
      </h3>
      <div style={{ display: 'flex', gap: spacing.md }}>
        {users.map(user => (
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
