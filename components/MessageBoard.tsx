import React from 'react';
import { useUser } from '../context/UserContext';
import { useChatLogic } from '../hooks/useChatLogic';
import ChatWindow from './message-board/ChatWindow';
import MessageList from './message-board/MessageList';
import MessageInput from './message-board/MessageInput';
import Toast from './ui/Toast';
import { spacing, colors, typography, shadows } from '../design-system/tokens';

const MessageBoard: React.FC = () => {
  const { currentUser } = useUser();
  const { messages, isLoading, error, isSubmitting, handleSend, handleDelete, toast } =
    useChatLogic();

  return (
    <div
      style={{
        maxWidth: '64rem', // Wider for chat window
        margin: '0 auto',
        padding: spacing.md,
        height: '400px', // Fixed height for chat room
        maxHeight: '70vh', // Responsive max height
        display: 'flex',
        flexDirection: 'column',
        marginBottom: spacing.xl,
      }}
      className="message-board-container"
    >
      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} />}

      <ChatWindow>
        {/* Messages Header (Inside Window) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: spacing.sm,
            borderBottom: `1px solid ${colors.borderInset}`,
            backgroundColor: colors.surface,
          }}
        >
          <h2
            style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              color: colors.textPrimary,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              textShadow: shadows.textGlowBlue,
            }}
          >
            #general
          </h2>
          <span
            style={{
              fontSize: typography.fontSize.xs,
              color: colors.textTertiary,
            }}
          >
            Topic: Movie Night Planning 🍿
          </span>
        </div>

        <MessageList
          messages={messages}
          isLoading={isLoading}
          error={error}
          currentUser={currentUser}
          onDelete={handleDelete}
          isSubmitting={isSubmitting}
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
  );
};

export default MessageBoard;
