import React from 'react';
import { colors, typography, layout, shadows, radius } from '../../design-system/tokens';

interface AppHeaderProps {
  onProfileClick: () => void;
  currentUser: string | null;
}

const AppHeader: React.FC<AppHeaderProps> = ({ onProfileClick, currentUser }) => {
  return (
    <header
      className="app-header"
      style={{
        height: layout.topBarHeight,
        background: colors.surface1,
        borderBottom: `1px solid ${colors.borderSubtle}`,
        boxShadow: shadows.card,
      }}
    >
      <div className="app-header-inner" style={{ maxWidth: layout.contentMaxWidth }}>
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.heading.join(', '),
              fontSize: typography.fontSize.lg,
              lineHeight: 1.2,
              letterSpacing: typography.letterSpacing.normal,
            }}
          >
            Aaron &amp; Electra
          </h1>
          <p
            style={{
              margin: 0,
              color: colors.textTertiary,
              fontSize: typography.fontSize.xs,
            }}
          >
            Movies & Places
          </p>
        </div>

        <button
          type="button"
          className="profile-chip"
          onClick={onProfileClick}
          aria-label="Open profile selector"
          title="Open profile selector"
          style={{
            borderRadius: radius.full,
            border: `1px solid ${colors.border}`,
            background: colors.surface2,
            color: colors.textPrimary,
          }}
        >
          <span aria-hidden>{currentUser ? '👤' : '👥'}</span>
          <span>{currentUser || 'Guest'}</span>
        </button>
      </div>
    </header>
  );
};

export default AppHeader;
