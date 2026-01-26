import React, { useState } from 'react';
import { spacing, colors, shadows } from '../../design-system/tokens';
import { MessageIcon } from '../icons';

interface ChatWindowProps {
  children: React.ReactNode;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ children }) => {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: isMinimized ? 'auto' : '100%', // Auto height when minimized
        backgroundColor: '#c0c0c0', // Classic Windows Gray
        border: '2px solid #dfdfdf',
        borderRightColor: '#404040',
        borderBottomColor: '#404040',
        boxShadow: '4px 4px 10px rgba(0,0,0,0.5)',
        fontFamily: 'Tahoma, sans-serif', // Fallback for UI elements
        transition: 'height 0.3s ease',
      }}
    >
      {/* Title Bar */}
      <div
        onDoubleClick={() => setIsMinimized(!isMinimized)}
        style={{
          background: 'linear-gradient(90deg, #000080 0%, #1084d0 100%)', // Classic Blue Gradient
          padding: `${spacing.xs} ${spacing.sm}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#ffffff',
          height: '32px',
          cursor: 'default',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
          <MessageIcon style={{ width: '16px', height: '16px', color: '#ffffff' }} />
          <span
            style={{
              fontWeight: 'bold',
              fontSize: '13px',
              letterSpacing: '0.5px',
              textShadow: '1px 1px 0px rgba(0,0,0,0.5)',
            }}
          >
            Electra & Aaron's Chat Room v1.0
          </span>
        </div>

        {/* Window Controls */}
        <div style={{ display: 'flex', gap: '2px' }}>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            aria-label={isMinimized ? 'Restore' : 'Minimize'}
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: '#c0c0c0',
              border: '1px solid #fff',
              borderRightColor: '#404040',
              borderBottomColor: '#404040',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              lineHeight: 1,
              padding: 0,
              cursor: 'pointer',
              color: '#000',
              boxShadow: 'inset 1px 1px 0px #fff',
            }}
          >
            <span style={{ marginTop: '-6px' }}>_</span>
          </button>
          <button
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: '#c0c0c0',
              border: '1px solid #fff',
              borderRightColor: '#404040',
              borderBottomColor: '#404040',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 'bold',
              lineHeight: 1,
              padding: 0,
              cursor: 'default',
              color: '#808080', // Disabled look
              boxShadow: 'inset 1px 1px 0px #fff',
            }}
          >
            <span>□</span>
          </button>
          <button
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: '#c0c0c0',
              border: '1px solid #fff',
              borderRightColor: '#404040',
              borderBottomColor: '#404040',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 'bold',
              lineHeight: 1,
              padding: 0,
              cursor: 'default',
              color: '#000',
              boxShadow: 'inset 1px 1px 0px #fff',
            }}
          >
            <span>×</span>
          </button>
        </div>
      </div>

      {/* Window Body */}
      {!isMinimized && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            padding: '2px',
            gap: '2px',
            overflow: 'hidden', // Contain children
          }}
        >
          {/* Main Chat Area */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: colors.background, // Keep dark theme for chat content
              border: '2px solid #808080', // Inset border
              borderRightColor: '#fff',
              borderBottomColor: '#fff',
              overflow: 'hidden',
            }}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
