import React from 'react';
import { spacing, typography, colors } from '@/design-system/tokens;

interface ChatWindowProps {
  children: React.ReactNode;
  isEditMode?: boolean;
  onToggleEditMode?: () => void;
  onClose?: () => void;
  showHeader?: boolean;
}

const linkStyle: React.CSSProperties = {
  color: colors.secondary,
  fontSize: '15px',
  fontWeight: 400,
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  padding: 0,
  fontFamily: typography.fontFamily.body.join(', '),
};

const ChatWindow: React.FC<ChatWindowProps> = ({
  children,
  isEditMode = false,
  onToggleEditMode,
  onClose,
  showHeader = true,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: colors.surfaceElevated,
        overflow: 'hidden',
        fontFamily: typography.fontFamily.body.join(', '),
      }}
    >
      {showHeader && (
        <div
          style={{
            background: 'rgba(27, 40, 69, 0.9)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: `${spacing.sm} ${spacing.md}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '44px',
            borderBottom: `1px solid ${colors.accentMuted}`,
            position: 'relative',
          }}
        >
          <span
            style={{
              fontFamily: typography.fontFamily.heading.join(', '),
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontSize: '14px',
              color: colors.textPrimary,
            }}
          >
            Messages
          </span>

          {onToggleEditMode && (
            <button
              type="button"
              onClick={onToggleEditMode}
              style={{ ...linkStyle, position: 'absolute', right: onClose ? '70px' : spacing.md }}
            >
              {isEditMode ? 'Done' : 'Edit'}
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{ ...linkStyle, position: 'absolute', right: spacing.md }}
            >
              Close
            </button>
          )}
        </div>
      )}

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: colors.surfaceElevated,
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default ChatWindow;
