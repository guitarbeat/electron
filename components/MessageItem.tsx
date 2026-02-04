import React, { memo, useState, useEffect, useRef } from 'react';
import { Message, User } from '../types';
import { TrashIcon } from './icons';
import IconButton from './ui/IconButton';
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
}

const MessageItem: React.FC<MessageItemProps> = ({
  msg,
  currentUser,
  showSenderName,
  onDelete,
}) => {
  const [showHeart, setShowHeart] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const authorName = msg.author || 'Anonymous';
  const isCurrentUser = currentUser && authorName.toLowerCase() === currentUser.toLowerCase();

  // Determine styles based on author
  const userStyle = getStyleForUser(authorName);

  const handleHeart = () => {
    setShowHeart(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => setShowHeart(false), 1000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
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
        onClick={handleHeart}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleHeart();
          }
        }}
        style={{
          position: 'relative',
          borderRadius: '18px',
          padding: '8px 14px',
          maxWidth: '100%',
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          cursor: 'pointer',
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
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
          }}
        >
          {msg.content}
        </p>

        {/* Heart Reaction */}
        {showHeart && (
          <div className="heart-reaction">
            ❤️
          </div>
        )}

        {/* Delete button - appears on hover */}
        <div
          className="message-actions"
          style={{
            position: 'absolute',
            top: '-8px',
            [isCurrentUser ? 'left' : 'right']: '-8px',
            zIndex: 10,
          }}
        >
          <IconButton
            onClick={(e) => {
              e.stopPropagation(); // Prevent heart reaction
              onDelete(msg.id);
            }}
            variant="danger"
            title={`Delete message from ${authorName}`}
            aria-label={`Delete message from ${authorName}`}
            style={{
              padding: '4px',
              minWidth: '24px',
              minHeight: '24px',
              background: colors.error,
              color: '#fff',
              borderRadius: radius.full,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            <TrashIcon style={{ width: '12px', height: '12px' }} />
          </IconButton>
        </div>
      </div>

      {/* iOS iMessage bubble styles */}
      <style>{`
        .imessage-bubble {
          /* Base styles handled by inline styles for per-user colors */
        }

        .imessage-bubble:active {
          transform: scale(0.98);
        }

        /* Heart Animation */
        .heart-reaction {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 24px;
          pointer-events: none;
          animation: floatUp 1s ease-out forwards;
          z-index: 20;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        @keyframes floatUp {
          0% {
            opacity: 0;
            transform: translate(-50%, 10px) scale(0.5);
          }
          20% {
            opacity: 1;
            transform: translate(-50%, -10px) scale(1.2);
          }
          40% {
            transform: translate(-50%, -15px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50px);
          }
        }

        /* Hide actions by default, show on hover */
        .message-actions {
          opacity: 0;
          transform: scale(0.8);
          transition: all 0.2s ease;
        }

        .imessage-bubble:hover .message-actions {
          opacity: 1;
          transform: scale(1);
        }

        /* Show actions on focus for keyboard users */
        .imessage-bubble:focus-within .message-actions {
            opacity: 1;
            transform: scale(1);
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
