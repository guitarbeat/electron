import React, { useRef, useEffect, useState, useMemo } from 'react';
import { colors, spacing, typography, shadows, radius } from '../../design-system/tokens';
import { MessageIcon, ChevronDownIcon } from '../icons';
import Card from '../ui/Card';
import IconButton from '../ui/IconButton';
import MessageItem from '../MessageItem';
import { Message, User } from '../../types';

interface MessageListProps {
  messages: Message[] | null;
  isLoading: boolean;
  error: any;
  currentUser: User | null;
  onDelete: (id: string) => Promise<void>;
  isSubmitting: boolean;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  error,
  currentUser,
  onDelete,
  isSubmitting,
}) => {
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousMessagesLengthRef = useRef<number>(0);

  // * Check scroll position to show/hide scroll-to-bottom button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const checkScrollPosition = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100; // * 100px threshold
      setShowScrollToBottom(!isNearBottom);
    };

    container.addEventListener('scroll', checkScrollPosition);
    checkScrollPosition(); // * Initial check

    return () => container.removeEventListener('scroll', checkScrollPosition);
  }, [messages]);

  // * Auto-scroll to bottom when new messages arrive (only if already near bottom)
  useEffect(() => {
    if (messages && messages.length > previousMessagesLengthRef.current) {
      const container = messagesContainerRef.current;
      if (container) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        // Increased threshold slightly and added a small delay to ensure DOM is ready
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;

        if (isNearBottom) {
          requestAnimationFrame(() => {
            setTimeout(() => {
              container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth',
              });
            }, 50); // Faster response
          });
        }
      }
    }
    previousMessagesLengthRef.current = messages?.length || 0;
  }, [messages]);

  // * Scroll to bottom function
  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    } else {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  };

  // * Memoize the reversed messages array to avoid re-reversing on every render
  const reversedMessages = useMemo(() => {
    return messages ? [...messages].reverse() : [];
  }, [messages]);

  return (
    <div
      ref={messagesContainerRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: spacing.md,
        position: 'relative',
        minHeight: 0,
        // * Custom scrollbar styling
        scrollbarWidth: 'thin',
        scrollbarColor: `${colors.secondary}40 transparent`,
      }}
      className="messages-container"
    >
      <style>{`
          .messages-container::-webkit-scrollbar {
              width: 12px;
          }
          .messages-container::-webkit-scrollbar-track {
              background: #1a1a2e;
              border-left: 1px solid #333;
          }
          .messages-container::-webkit-scrollbar-thumb {
              background: #404040;
              border: 1px solid #808080;
              border-radius: 0;
          }
          .messages-container::-webkit-scrollbar-thumb:hover {
              background: #505050;
          }
          @keyframes pulse-glow {
              0% { filter: drop-shadow(0 0 10px ${colors.secondary}40); transform: scale(1); }
              50% { filter: drop-shadow(0 0 20px ${colors.secondary}80); transform: scale(1.05); }
              100% { filter: drop-shadow(0 0 10px ${colors.secondary}40); transform: scale(1); }
          }
      `}</style>
      {/* Scroll to Bottom Button */}
      {showScrollToBottom && (
        <div
          style={{
            position: 'absolute',
            bottom: spacing.md,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <IconButton
            onClick={scrollToBottom}
            aria-label="Scroll to bottom"
            style={{
              background: colors.secondary,
              boxShadow: shadows.card,
              borderRadius: radius.full,
              padding: spacing.sm,
              minWidth: '40px',
              minHeight: '40px',
              transition: 'all 0.2s ease',
            }}
          >
            <ChevronDownIcon style={{ width: '20px', height: '20px', color: '#ffffff' }} />
          </IconButton>
        </div>
      )}

      {/* Message List - Retro iMessage Style */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.md,
          opacity: isSubmitting ? 0.5 : 1,
          pointerEvents: isSubmitting ? 'none' : 'auto',
          transition: 'opacity 0.2s ease',
        }}
        role="log"
        aria-label="Message board messages"
        aria-live="polite"
        aria-atomic="false"
      >
        {isLoading && !messages && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  padding: `${spacing.sm} ${spacing.md}`,
                  height: '50px',
                  background: colors.surface,
                  borderRadius: radius.lg,
                  opacity: 0.5,
                }}
              />
            ))}
          </div>
        )}
        {error && (
          <Card variant="default">
            <div
              style={{ textAlign: 'center', padding: spacing.lg, color: colors.error }}
              role="alert"
              aria-live="assertive"
            >
              <p style={{ margin: 0 }}>Error loading messages. Please refresh the page.</p>
            </div>
          </Card>
        )}

        {reversedMessages.map((msg, index) => {
          const authorName = msg.author || 'Anonymous';
          const prevMsg = index > 0 ? reversedMessages[index - 1] : null;
          const isSameSender = prevMsg && (prevMsg.author || 'Anonymous') === authorName;
          const showSenderName = !isSameSender || index === 0;

          return (
            <MessageItem
              key={msg.id}
              msg={msg}
              currentUser={currentUser}
              showSenderName={showSenderName}
              onDelete={onDelete}
            />
          );
        })}
        {messages?.length === 0 && !isLoading && (
          <div
            style={{
              textAlign: 'center',
              padding: spacing['2xl'],
              color: colors.textTertiary,
              opacity: 0.8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
            role="status"
          >
            <div
              style={{
                animation: 'pulse-glow 3s infinite ease-in-out',
              }}
            >
              <MessageIcon
                style={{
                  width: '64px',
                  height: '64px',
                  marginBottom: spacing.md,
                  color: colors.secondary,
                }}
              />
            </div>
            <p
              style={{
                fontSize: typography.fontSize.lg,
                margin: 0,
                color: colors.textSecondary,
                textShadow: shadows.textGlowBlue,
              }}
            >
              No messages yet...
            </p>
            <p
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.textTertiary,
                marginTop: spacing.xs,
              }}
            >
              Be the first to start the conversation!
            </p>
          </div>
        )}
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>
    </div>
  );
};

export default MessageList;
