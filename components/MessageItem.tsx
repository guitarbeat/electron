import React, { memo } from 'react';
import { Message, User } from '../types';
import { TrashIcon } from './icons';
import IconButton from './ui/IconButton';
import { spacing, typography, colors, radius } from '../design-system/tokens';

// iOS iMessage colors
const IOS_BLUE = '#007AFF';
const IOS_GRAY = '#e5e5ea';
const IOS_TIMESTAMP = '#8e8e93';

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
  const authorName = msg.author || 'Anonymous';
  const isCurrentUser = currentUser && authorName.toLowerCase() === currentUser.toLowerCase();

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
                color: IOS_TIMESTAMP,
              }}
            >
              {authorName}
            </span>
          )}
          {formatTime(msg.createdAt) && (
            <span
              style={{
                fontSize: '11px',
                color: IOS_TIMESTAMP,
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
      >
        {/* Message content */}
        <p
          style={{
            color: isCurrentUser ? '#ffffff' : '#000000',
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

        {/* Delete button - appears on hover */}
        <div
          className="message-actions"
          style={{
            position: 'absolute',
            top: '-8px',
            [isCurrentUser ? 'left' : 'right']: '-8px',
          }}
        >
          <IconButton
            onClick={() => onDelete(msg.id)}
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
          position: relative;
          border-radius: 18px;
          padding: 8px 14px;
          max-width: 100%;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        .imessage-bubble.from-me {
          background-color: ${IOS_BLUE};
          border-bottom-right-radius: 4px;
        }

        .imessage-bubble.from-them {
          background-color: ${IOS_GRAY};
          border-bottom-left-radius: 4px;
        }

        /* Bubble tails using pseudo-elements */
        .imessage-bubble.from-me::before {
          content: "";
          position: absolute;
          bottom: 0;
          right: -6px;
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 0 0 12px 10px;
          border-color: transparent transparent ${IOS_BLUE} transparent;
        }

        .imessage-bubble.from-them::before {
          content: "";
          position: absolute;
          bottom: 0;
          left: -6px;
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 0 10px 12px 0;
          border-color: transparent ${IOS_GRAY} transparent transparent;
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
