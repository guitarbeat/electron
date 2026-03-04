import React from 'react';
import { colors, typography, layout, shadows, radius, spacing } from '../../design-system/tokens';
import { useMediaQuery, breakpoints } from '../../hooks/useMediaQuery';

interface AppHeaderProps {
  onProfileClick: () => void;
  currentUser: string | null;
}

const AppHeader: React.FC<AppHeaderProps> = ({ onProfileClick, currentUser }) => {
  const isMobile = useMediaQuery(breakpoints.sm);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header
      className="app-header"
      style={{
        height: layout.topBarHeight,
        background: colors.surface1,
        borderBottom: `1px solid ${colors.borderSubtle}`,
        boxShadow: shadows.card,
        position: 'relative',
        zIndex: 100,
      }}
    >
      <div
        className="app-header-inner"
        style={{
          maxWidth: layout.contentMaxWidth,
          padding: isMobile ? `0 ${spacing.md}` : `0 ${spacing.lg}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.heading.join(', '),
              fontSize: isMobile ? typography.fontSize.sm : typography.fontSize.lg,
              lineHeight: 1.2,
              letterSpacing: typography.letterSpacing.normal,
              fontWeight: 600,
            }}
          >
            Aaron &amp; Electra
          </h1>
          <p
            style={{
              margin: 0,
              color: colors.textTertiary,
              fontSize: isMobile ? typography.fontSize.xs : typography.fontSize.xs,
              marginTop: 2,
            }}
          >
            Movies & Places
          </p>
        </div>

        {isMobile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <button
              type="button"
              className="profile-chip-mobile"
              onClick={onProfileClick}
              aria-label="Open profile selector"
              title="Open profile selector"
              style={{
                borderRadius: radius.full,
                border: `1px solid ${colors.border}`,
                background: colors.surface2,
                color: colors.textPrimary,
                padding: `${spacing.xs} ${spacing.sm}`,
                fontSize: typography.fontSize.xs,
                minWidth: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                touchAction: 'manipulation',
              }}
            >
              <span aria-hidden style={{ fontSize: '16px' }}>
                {currentUser ? '👤' : '👥'}
              </span>
              <span style={{ display: isMobile && currentUser ? 'none' : 'inline' }}>
                {currentUser || 'Guest'}
              </span>
            </button>

            <button
              type="button"
              className="mobile-menu-toggle"
              onClick={toggleMenu}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
              style={{
                background: 'transparent',
                border: 'none',
                color: colors.textPrimary,
                padding: spacing.xs,
                borderRadius: radius.md,
                touchAction: 'manipulation',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isMenuOpen ? (
                <span style={{ fontSize: '24px' }}>✕</span>
              ) : (
                <span style={{ fontSize: '24px' }}>☰</span>
              )}
            </button>
          </div>
        ) : (
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
              padding: `${spacing.sm} ${spacing.md}`,
              fontSize: typography.fontSize.sm,
              touchAction: 'manipulation',
            }}
          >
            <span aria-hidden style={{ marginRight: spacing.xs }}>
              {currentUser ? '👤' : '👥'}
            </span>
            <span>{currentUser || 'Guest'}</span>
          </button>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {isMobile && isMenuOpen && (
        <div
          className="mobile-menu-overlay"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: colors.surface1,
            borderBottom: `1px solid ${colors.borderSubtle}`,
            boxShadow: shadows.cardElevated,
            zIndex: 99,
            transform: isMenuOpen ? 'translateY(0)' : 'translateY(-100%)',
            transition: 'transform 0.3s ease',
          }}
        >
          <div style={{ padding: `${spacing.md} ${spacing.md}` }}>
            <button
              type="button"
              className="mobile-menu-item"
              onClick={() => {
                onProfileClick();
                setIsMenuOpen(false);
              }}
              style={{
                width: '100%',
                padding: spacing.md,
                background: 'transparent',
                border: 'none',
                color: colors.textPrimary,
                textAlign: 'left',
                fontSize: typography.fontSize.sm,
                borderRadius: radius.md,
                touchAction: 'manipulation',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
              }}
            >
              <span>{currentUser ? '👤' : '👥'}</span>
              <span>Switch Profile</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default AppHeader;
