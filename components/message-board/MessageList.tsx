import React, { useRef, useEffect, useState, useMemo } from 'react';
import { spacing, typography, colors, radius } from '../../design-system/tokens';
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

  // Check scroll position to show/hide scroll-to-bottom button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const checkScrollPosition = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollToBottom(!isNearBottom);
    };

    container.addEventListener('scroll', checkScrollPosition);
    checkScrollPosition();

    return () => container.removeEventListener('scroll', checkScrollPosition);
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive (only if already near bottom)
  useEffect(() => {
    if (messages && messages.length > previousMessagesLengthRef.current) {
      const container = messagesContainerRef.current;
      if (container) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;

        if (isNearBottom) {
          requestAnimationFrame(() => {
            setTimeout(() => {
              container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth',
              });
            }, 50);
          });
        }
      }
    }
    previousMessagesLengthRef.current = messages?.length || 0;
  }, [messages]);

  // Scroll to bottom function
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

  // Memoize the reversed messages array
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
        backgroundColor: '#ffffff',
        WebkitOverflowScrolling: 'touch',
      }}
      className="messages-container-ios"
    >
      <style>{`
        .messages-container-ios {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .messages-container-ios::-webkit-scrollbar {
          display: none;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Scroll to Bottom Button - iOS style */}
      {showScrollToBottom && (
        <div
          style={{
            position: 'absolute',
            bottom: spacing.md,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
          }}
        >
          <button
            onClick={scrollToBottom}
            aria-label="Scroll to bottom"
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
              borderRadius: '50%',
              padding: spacing.sm,
              width: '40px',
              height: '40px',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <ChevronDownIcon style={{ width: '20px', height: '20px', color: '#ffffff' }} />
          </button>
        </div>
      )}

      {/* Message List */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          opacity: isSubmitting ? 0.7 : 1,
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
                  height: '40px',
                  background: '#e5e5ea',
                  borderRadius: '18px',
                  opacity: 0.5,
                  maxWidth: '60%',
                  marginLeft: i % 2 === 0 ? 'auto' : 0,
                  animation: 'fadeIn 0.3s ease-out',
                }}
              />
            ))}
          </div>
        )}
        
        {error && (
          <div
            style={{
              textAlign: 'center',
              padding: spacing.lg,
              color: '#ff3b30',
              backgroundColor: 'rgba(255, 59, 48, 0.1)',
              borderRadius: '12px',
            }}
            role="alert"
            aria-live="assertive"
          >
            <p style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
              Error loading messages. Please refresh the page.
            </p>
          </div>
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
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#007AFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: spacing.md,
              }}
            >
              <MessageIcon
                style={{
                  width: '32px',
                  height: '32px',
                  color: '#ffffff',
                }}
              />
            </div>
            <p
              style={{
                fontFamily: typography.fontFamily.heading.join(', '),
                fontSize: typography.fontSize.lg,
                margin: 0,
                color: '#000000',
              }}
            >
              No messages yet
            </p>
            <p
              style={{
                fontSize: '15px',
                color: '#8e8e93',
                marginTop: spacing.xs,
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
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
