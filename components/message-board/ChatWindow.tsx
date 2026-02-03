import React from 'react';
import { spacing, typography, colors } from '../../design-system/tokens';

interface ChatWindowProps {
  children: React.ReactNode;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ children }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* iOS Navigation Bar */}
      <div
        style={{
          background: 'rgba(249, 249, 249, 0.94)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: `${spacing.sm} ${spacing.md}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '44px',
          borderBottom: '0.5px solid rgba(0, 0, 0, 0.1)',
          position: 'relative',
        }}
      >
        {/* Back button */}
        <div
          style={{
            position: 'absolute',
            left: spacing.md,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            color: '#007AFF',
            cursor: 'pointer',
          }}
        >
          <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
            <path d="M10 2L2 10L10 18" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: '17px', fontWeight: 400 }}>Back</span>
        </div>

        {/* Title - Keep Papyrus for brand */}
        <div style={{ textAlign: 'center' }}>
          <span
            style={{
              fontFamily: typography.fontFamily.heading.join(', '),
              fontWeight: typography.fontWeight.semibold,
              fontSize: '17px',
              color: '#000',
              letterSpacing: '-0.01em',
            }}
          >
            Messages
          </span>
        </div>

        {/* Edit button */}
        <div
          style={{
            position: 'absolute',
            right: spacing.md,
            color: '#007AFF',
            fontSize: '17px',
            fontWeight: 400,
            cursor: 'pointer',
          }}
        >
          Edit
        </div>
      </div>

      {/* Chat Content Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default ChatWindow;
