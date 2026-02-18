import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useChatLogic } from '../hooks/useChatLogic';
import ChatWindow from './message-board/ChatWindow';
import MessageList from './message-board/MessageList';
import MessageInput from './message-board/MessageInput';
import Toast from './ui/Toast';
import { spacing, colors, shadows, radius, zIndex, motion } from '../design-system/tokens';
import { MessageIcon } from './icons';
import { useMediaQuery, breakpoints } from '../hooks/useMediaQuery';

const MessageBoard: React.FC = () => {
  const { currentUser } = useUser();
  const {
    messages,
    isLoading,
    error,
    isSubmitting,
    handleSend,
    handleDelete,
    handleReaction,
    toast,
  } = useChatLogic();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [lastViewedCount, setLastViewedCount] = useState(0);
  const isMobile = useMediaQuery(breakpoints.sm);

  const handleToggle = () => {
    if (isMinimized) {
      setLastViewedCount(messages?.length || 0);
    }
    setIsMinimized(!isMinimized);
  };

  const unreadCount = Math.max(0, (messages?.length || 0) - lastViewedCount);

  if (!currentUser) {
    return null;
  }

  if (isMinimized) {
    return (
      <button
        onClick={handleToggle}
        aria-label="Open messages"
        className="gel-bubble"
        style={{
          position: 'fixed',
          bottom: `max(${spacing.lg}, env(safe-area-inset-bottom))`,
          left: isMobile ? 'auto' : spacing.lg,
          right: isMobile ? spacing.md : 'auto',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: colors.accent,
          border: `3px solid ${colors.surfaceElevated}`,
          boxShadow: shadows.glow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: zIndex.overlay,
          transition: `all ${motion.duration.normal} ${motion.easing.ease}`,
          padding: 0,
        }}
      >
        <MessageIcon style={{ width: '30px', height: '30px', color: '#000' }} />
        {unreadCount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              backgroundColor: colors.error,
              color: '#fff',
              fontSize: '12px',
              fontWeight: 'bold',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              border: '2px solid white',
            }}
          >
            {unreadCount}
          </div>
        )}
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: `max(${spacing.lg}, env(safe-area-inset-bottom))`,
        left: isMobile ? spacing.md : spacing.lg,
        right: isMobile ? spacing.md : 'auto',
        width: isMobile ? 'auto' : 'min(420px, 90vw)',
        maxHeight: isMobile ? 'min(72vh, 640px)' : 'min(600px, 70vh)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: zIndex.overlay,
        backgroundColor: colors.surfaceElevated,
        borderRadius: radius.lg,
        boxShadow: shadows.cardElevated,
        border: `1px solid ${colors.accentMuted}`,
        overflow: 'hidden',
        animation: 'slide-up-fade 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
      className="message-board-container"
    >
      <div
        style={{
          padding: `${spacing.sm} ${spacing.md}`,
          backgroundColor: colors.surface,
          color: colors.textPrimary,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: 'bold',
          cursor: 'pointer',
          borderBottom: `1px solid ${colors.accentMuted}`,
        }}
        onClick={handleToggle}
      >
        <span>Messages</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px',
            lineHeight: 1,
            color: colors.textPrimary,
          }}
          aria-label="Minimize"
        >
          −
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Toast Notification */}
        {toast && <Toast message={toast.message} type={toast.type} />}

        <ChatWindow isEditMode={isEditMode} onToggleEditMode={() => setIsEditMode(!isEditMode)}>
          <MessageList
            messages={messages ?? null}
            isLoading={isLoading}
            error={error}
            currentUser={currentUser}
            onDelete={handleDelete}
            onReaction={handleReaction}
            isSubmitting={isSubmitting}
            isEditMode={isEditMode}
          />
          <MessageInput
            key={currentUser || 'anonymous'}
            currentUser={currentUser}
            isSubmitting={isSubmitting}
            onSend={handleSend}
            onError={(msg) => console.error(msg)}
          />
        </ChatWindow>
      </div>
    </div>
  );
};

export default MessageBoard;
