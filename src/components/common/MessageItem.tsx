import React from 'react';
import { Message, User } from '@/types';
import { spacing, colors, radius, typography } from '@/design-system/tokens';

interface MessageItemProps {
  msg: Message;
  currentUser: User | null;
  showSenderName: boolean;
  onDelete: (id: string) => Promise<void>;
  onReaction: (messageId: string, emoji: string, username: string) => Promise<void>;
  isEditMode: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({
  msg,
  currentUser,
  showSenderName,
  onDelete,
  onReaction,
  isEditMode,
}) => {
  const isOwnMessage = currentUser === msg.author;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
        gap: spacing.sm,
        marginBottom: spacing.md,
      }}
    >
      {showSenderName && (
        <div
          style={{
            fontSize: typography.fontSize.xs,
            color: colors.textTertiary,
            marginLeft: isOwnMessage ? 0 : spacing.sm,
            marginRight: isOwnMessage ? spacing.sm : 0,
          }}
        >
          {msg.author} •{' '}
          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
      <div
        style={{
          maxWidth: '80%',
          padding: `${spacing.sm} ${spacing.md}`,
          borderRadius: radius.lg,
          borderTopRightRadius: isOwnMessage ? radius.sm : radius.lg,
          borderTopLeftRadius: isOwnMessage ? radius.lg : radius.sm,
          background: isOwnMessage ? colors.accent : colors.surface,
          color: isOwnMessage ? 'white' : colors.textPrimary,
          border: isOwnMessage ? 'none' : `1px solid ${colors.borderSecondary}50`,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          position: 'relative',
        }}
      >
        {msg.content}
        {isEditMode && isOwnMessage && (
          <button
            onClick={() => onDelete(msg.id)}
            style={{
              position: 'absolute',
              top: -8,
              right: -8,
              background: colors.error,
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            ×
          </button>
        )}
      </div>
      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
        <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.sm }}>
          {Object.entries(msg.reactions).map(([emoji, users]) => (
            <button
              key={emoji}
              onClick={() => currentUser && onReaction(msg.id, emoji, currentUser)}
              style={{
                background: colors.surface,
                border: `1px solid ${colors.borderSecondary}50`,
                borderRadius: radius.full,
                padding: '2px 6px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
              }}
            >
              <span>{emoji}</span>
              <span style={{ color: colors.textTertiary }}>{users.length}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageItem;
