import React from 'react';
import { spacing, typography, colors } from '../../design-system/tokens';

interface ChatWindowProps {
  children: React.ReactNode;
  isEditMode?: boolean;
  onToggleEditMode?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  children,
  isEditMode = false,
  onToggleEditMode,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: colors.surfaceElevated,
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
        fontFamily: typography.fontFamily.body.join(', '),
      }}
    >
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
        <div style={{ textAlign: 'center' }}>
          <span
            style={{
              fontFamily: typography.fontFamily.heading.join(', '),
              fontWeight: typography.fontWeight.semibold,
              fontSize: '17px',
              color: colors.textPrimary,
              letterSpacing: '-0.01em',
            }}
          >
            Messages
          </span>
        </div>

        {onToggleEditMode && (
          <button
            onClick={onToggleEditMode}
            style={{
              position: 'absolute',
              right: spacing.md,
              color: colors.secondary,
              fontSize: '15px',
              fontWeight: 400,
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: 0,
              fontFamily: typography.fontFamily.body.join(', '),
            }}
          >
            {isEditMode ? 'Done' : 'Edit'}
          </button>
        )}
      </div>

      {/* Chat Content Area */}
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
