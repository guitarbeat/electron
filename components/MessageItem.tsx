import React, { memo, useState, useEffect, useRef } from 'react';
import { Message, User } from '../types';
import { TrashIcon } from './icons';
import { spacing, typography, colors, radius } from '../design-system/tokens';

// Available styles
const STYLE_VARIANTS = [
  {
    gradient: colors.gradientBlue,
    tailLeft: '#87cefa',
    tailRight: '#a0d8ff',
  },
  {
    gradient: colors.gradientPink,
    tailLeft: '#ff69b4',
    tailRight: '#ff8bb3',
  },
  {
    gradient: colors.gradientPurple,
    tailLeft: '#9370db',
    tailRight: '#ab87e8',
  },
];

const getStyleForUser = (username: string) => {
  // Explicit overrides for main users
  if (username.toLowerCase() === 'aaron') return STYLE_VARIANTS[0]; // Blue
  if (username.toLowerCase() === 'electra') return STYLE_VARIANTS[1]; // Pink

  // Deterministic selection for others based on username hash
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % STYLE_VARIANTS.length;
  return STYLE_VARIANTS[index];
};

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
    } else {
      return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  } catch {
    return '';
  }
};

interface MessageItemProps {
  msg: Message;
  currentUser: User | null;
  showSenderName: boolean;
  onDelete: (id: string) => void;
  isEditMode?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({
  msg,
  currentUser,
  showSenderName,
  onDelete,
  isEditMode = false,
}) => {
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const authorName = msg.author || 'Anonymous';
  const isCurrentUser = currentUser && authorName.toLowerCase() === currentUser.toLowerCase();

  // Determine styles based on author
  const userStyle = getStyleForUser(authorName);

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
    // Toggle off if same reaction selected
    if (selectedReaction === reaction) {
      setSelectedReaction(null);
    } else {
      setSelectedReaction(reaction);
    }
    setShowReactionMenu(false);
  };

  const handleDoubleClick = () => {
    // Quick heart reaction on double-click (iOS style)
    setSelectedReaction(selectedReaction === '❤️' ? null : '❤️');
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
          backgroundImage: userStyle.gradient,
          backgroundColor: userStyle.tailRight,
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

        {/* Reaction Badge - iOS style */}
        {selectedReaction && (
          <div
            className="reaction-badge"
            style={{
              position: 'absolute',
              bottom: '-12px',
              [isCurrentUser ? 'left' : 'right']: '-4px',
              background: '#ffffff',
              borderRadius: '12px',
              padding: '2px 6px',
              fontSize: '16px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
              border: '1px solid rgba(0,0,0,0.08)',
              zIndex: 5,
              cursor: 'pointer',
            }}
            onClick={(e) => {
              e.stopPropagation();
              setShowReactionMenu(true);
            }}
          >
            {selectedReaction}
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
                  background: selectedReaction === reaction ? 'rgba(0,0,0,0.1)' : 'transparent',
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

export default memo(MessageItem);
