import React, { memo, useState, useEffect, useRef } from 'react';
import { Message, User } from '../../types';
import { TrashIcon } from './icons';
import { spacing, typography, colors, radius } from '../../design-system/tokens';
import { getMessageBubbleStyle } from '../../hooks/useUserColors';

// iOS-style reactions
const REACTIONS = ['❤️', '👍', '👎', '😂', '‼️', '❓'];

// Format time for display (iOS style)
const formatTime = (date: string): string => {
  try {
    const dateObj = new Date(date);
    const now = new Date();

    if (isNaN(dateObj.getTime()) || isNaN(now.getTime())) {
      return '';
    }

    const seconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    if (seconds < 0) {
      return '';
    }

    // Show time if less than 24 hours, otherwise show date
    if (seconds < 86400) {
      const hours = dateObj.getHours();
      const minutes = dateObj.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

interface MessageItemProps {
  msg: Message;
  currentUser: User | null;
  showSenderName: boolean;
  onDelete: (id: string) => void;
  onReaction: (messageId: string, emoji: string, username: string) => void;
  isEditMode?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({
  msg,
  currentUser,
  showSenderName,
  onDelete,
  onReaction,
  isEditMode = false,
}) => {
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const authorName = msg.author || 'Anonymous';
  const isCurrentUser = currentUser && authorName.toLowerCase() === currentUser.toLowerCase();
  const currentUsername = currentUser || 'Anonymous';

  // Determine styles based on author (from centralized color system)
  const userStyle = getMessageBubbleStyle(authorName);

  // Get user's current reaction from persisted data
  const getUserReaction = (): string | null => {
    if (!msg.reactions) return null;
    for (const [emoji, users] of Object.entries(msg.reactions) as [string, string[]][]) {
      if (users.includes(currentUsername)) return emoji;
    }
    return null;
  };

  // Get all reactions with counts
  const getReactionSummary = (): { emoji: string; count: number; hasUserReacted: boolean }[] => {
    if (!msg.reactions) return [];
    return (Object.entries(msg.reactions) as [string, string[]][])
      .filter(([, users]) => users.length > 0)
      .map(([emoji, users]) => ({
        emoji,
        count: users.length,
        hasUserReacted: users.includes(currentUsername),
      }));
  };

  const reactionSummary = getReactionSummary();
  const userReaction = getUserReaction();

  const handleLongPressStart = () => {
    longPressTimer.current = setTimeout(() => {
      setShowReactionMenu(true);
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleSelectReaction = (reaction: string) => {
    onReaction(msg.id, reaction, currentUsername);
    setShowReactionMenu(false);
  };

  const handleDoubleClick = () => {
    // Quick heart reaction on double-click (iOS style)
    onReaction(msg.id, '❤️', currentUsername);
  };

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowReactionMenu(false);
      }
    };

    if (showReactionMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showReactionMenu]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
        marginBottom: showSenderName ? '8px' : '2px',
        maxWidth: '75%',
        marginLeft: isCurrentUser ? 'auto' : 0,
        marginRight: isCurrentUser ? 0 : 'auto',
      }}
    >
      {/* Sender name and time - iOS style */}
      {showSenderName && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            marginBottom: '4px',
            paddingLeft: isCurrentUser ? 0 : '12px',
            paddingRight: isCurrentUser ? '12px' : 0,
          }}
        >
          {!isCurrentUser && (
            <span
              style={{
                fontFamily: typography.fontFamily.heading.join(', '),
                fontSize: '12px',
                fontWeight: typography.fontWeight.semibold,
                color: userStyle.tailLeft, // Use user's color for name
              }}
            >
              {authorName}
            </span>
          )}
          {formatTime(msg.createdAt) && (
            <span
              style={{
                fontSize: '11px',
                color: colors.textTertiary,
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
              }}
            >
              {formatTime(msg.createdAt)}
            </span>
          )}
        </div>
      )}

      {/* iMessage Bubble */}
      <div
        className={`imessage-bubble ${isCurrentUser ? 'from-me' : 'from-them'}`}
        aria-label={`Message from ${authorName}`}
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
        style={{
          position: 'relative',
          borderRadius: '18px',
          padding: '8px 14px',
          maxWidth: '100%',
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          cursor: 'default',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          transition: 'transform 0.1s ease',
          background: `${userStyle.gradient}`,
          borderBottomRightRadius: isCurrentUser ? '4px' : '18px',
          borderBottomLeftRadius: isCurrentUser ? '18px' : '4px',
        }}
      >
        {/* Bubble tail */}
        <div
          style={{
            content: '""',
            position: 'absolute',
            bottom: 0,
            ...(isCurrentUser
              ? {
                  right: '-6px',
                  width: 0,
                  height: 0,
                  borderStyle: 'solid',
                  borderWidth: '0 0 12px 10px',
                  borderColor: `transparent transparent ${userStyle.tailRight} transparent`,
                }
              : {
                  left: '-6px',
                  width: 0,
                  height: 0,
                  borderStyle: 'solid',
                  borderWidth: '0 10px 12px 0',
                  borderColor: `transparent ${userStyle.tailLeft} transparent transparent`,
                }),
          }}
        />

        {/* Message content */}
        <p
          style={{
            color: '#ffffff',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            margin: 0,
            lineHeight: 1.25,
            fontSize: '17px',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
          }}
        >
          {msg.content}
        </p>

        {/* Reaction Badges - iOS style (show all reactions) */}
        {reactionSummary.length > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: '-12px',
              [isCurrentUser ? 'left' : 'right']: '-4px',
              display: 'flex',
              gap: '2px',
              zIndex: 5,
            }}
          >
            {reactionSummary.map(({ emoji, count, hasUserReacted }) => (
              <div
                key={emoji}
                className="reaction-badge"
                style={{
                  background: hasUserReacted ? '#e8f4fd' : '#ffffff',
                  borderRadius: '12px',
                  padding: '2px 6px',
                  fontSize: '14px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                  border: hasUserReacted ? '1px solid #007AFF' : '1px solid rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onReaction(msg.id, emoji, currentUsername);
                }}
              >
                <span>{emoji}</span>
                {count > 1 && (
                  <span style={{ fontSize: '11px', color: '#666', fontWeight: 500 }}>{count}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Reaction Menu - iOS style popup */}
        {showReactionMenu && (
          <div
            ref={menuRef}
            className="reaction-menu"
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '28px',
              padding: '6px 8px',
              display: 'flex',
              gap: '4px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
              zIndex: 100,
              animation: 'reactionMenuPop 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
          >
            {REACTIONS.map((reaction) => (
              <button
                key={reaction}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectReaction(reaction);
                }}
                style={{
                  background: userReaction === reaction ? 'rgba(0,122,255,0.15)' : 'transparent',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  fontSize: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.15s ease, background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                aria-label={`React with ${reaction}`}
              >
                {reaction}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Delete button - only visible in edit mode */}
      {isEditMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(msg.id);
          }}
          aria-label={`Delete message from ${authorName}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            background: '#ff3b30',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            marginTop: '4px',
            marginLeft: isCurrentUser ? 'auto' : 0,
            marginRight: isCurrentUser ? 0 : 'auto',
            transition: 'transform 0.15s ease',
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.9)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <TrashIcon style={{ width: '14px', height: '14px', color: '#fff' }} />
        </button>
      )}

      {/* iOS iMessage bubble styles */}
      <style>{`
        .imessage-bubble {
          /* Base styles handled by inline styles for per-user colors */
        }

        .imessage-bubble:active {
          transform: scale(0.98);
        }

        /* Reaction menu pop animation */
        @keyframes reactionMenuPop {
          0% {
            opacity: 0;
            transform: translateX(-50%) scale(0.5);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
        }

        /* Reaction badge bounce on appear */
        .reaction-badge {
          animation: badgePop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes badgePop {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* Message slide-in animation */
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .imessage-bubble.from-me {
          animation: slideInRight 0.2s ease-out;
        }

        .imessage-bubble.from-them {
          animation: slideInLeft 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

// Deep comparison to prevent re-renders when polling returns new object references
// We use JSON.stringify for the message object as it is a small, plain object without circular references.
// This is more robust than manual field comparison as it handles future schema changes automatically.
const arePropsEqual = (prevProps: MessageItemProps, nextProps: MessageItemProps) => {
  return (
    prevProps.currentUser === nextProps.currentUser &&
    prevProps.showSenderName === nextProps.showSenderName &&
    prevProps.isEditMode === nextProps.isEditMode &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onReaction === nextProps.onReaction &&
    JSON.stringify(prevProps.msg) === JSON.stringify(nextProps.msg)
  );
};

export default memo(MessageItem, arePropsEqual);
