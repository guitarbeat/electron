import React from 'react';
import type { Message, User } from '@/shared/types';
import { TrashIcon } from '@/common/Icons';
import { spacing, typography } from '@/theme/tokens';
import { formatMessageTimestamp } from '@/utils';
import { getBubbleColor, getBubbleTextColor, IOS_TIMESTAMP, isMessageFromCurrentUser } from './lib/messageUtils';

interface MessageBubbleProps {
  message: Message;
  currentUser: User | null;
  showSenderName: boolean;
  canDelete: boolean;
  onDelete: (message: Message) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  currentUser,
  showSenderName,
  canDelete,
  onDelete,
}) => {
  const isCurrentUser = isMessageFromCurrentUser(message, currentUser);
  const timestamp = formatMessageTimestamp(message.createdAt);
  const bubbleColor = getBubbleColor(message.author);
  const bubbleTextColor = getBubbleTextColor(message.author);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
        marginBottom: showSenderName ? '8px' : '2px',
        maxWidth: '78%',
        marginLeft: isCurrentUser ? 'auto' : 0,
        marginRight: isCurrentUser ? 0 : 'auto',
      }}
    >
      {showSenderName ? (
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
          {!isCurrentUser ? (
            <span
              style={{
                fontSize: '12px',
                fontWeight: typography.fontWeight.semibold,
                color: IOS_TIMESTAMP,
                fontFamily: typography.fontFamily.heading.join(', '),
              }}
            >
              {message.author}
            </span>
          ) : null}
          {timestamp ? (
            <span
              style={{
                fontSize: '11px',
                color: IOS_TIMESTAMP,
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
              }}
            >
              {timestamp}
            </span>
          ) : null}
        </div>
      ) : null}

      <div
        className={`ios-message-bubble${isCurrentUser ? ' ios-message-bubble--me' : ' ios-message-bubble--them'}`}
        aria-label={`Message from ${message.author}`}
        style={{ ['--bubble-color' as string]: bubbleColor }}
      >
        <p
          style={{
            color: bubbleTextColor,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            margin: 0,
            lineHeight: 1.25,
            fontSize: '17px',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
          }}
        >
          {message.content}
        </p>

        {canDelete ? (
          <div
            className="ios-message-bubble__actions"
            style={{
              position: 'absolute',
              top: '-8px',
              [isCurrentUser ? 'left' : 'right']: '-8px',
            }}
          >
            <button
              type="button"
              onClick={() => onDelete(message)}
              aria-label={`Delete message from ${message.author}`}
              title={`Delete message from ${message.author}`}
              style={{
                width: '24px',
                height: '24px',
                padding: 0,
                border: 'none',
                borderRadius: '999px',
                background: '#ff3b30',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
            >
              <TrashIcon style={{ width: '12px', height: '12px' }} />
            </button>
          </div>
        ) : null}
      </div>

      <style>{`
        .ios-message-bubble {
          position: relative;
          border-radius: 18px;
          padding: 8px 14px;
          max-width: 100%;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        .ios-message-bubble--me {
          background-color: var(--bubble-color);
          border-bottom-right-radius: 4px;
          animation: ios-message-slide-right 0.2s ease-out;
        }

        .ios-message-bubble--them {
          background-color: var(--bubble-color);
          border-bottom-left-radius: 4px;
          animation: ios-message-slide-left 0.2s ease-out;
        }

        .ios-message-bubble--me::before {
          content: "";
          position: absolute;
          bottom: 0;
          right: -6px;
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 0 0 12px 10px;
          border-color: transparent transparent var(--bubble-color) transparent;
        }

        .ios-message-bubble--them::before {
          content: "";
          position: absolute;
          bottom: 0;
          left: -6px;
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 0 10px 12px 0;
          border-color: transparent var(--bubble-color) transparent transparent;
        }

        .ios-message-bubble__actions {
          opacity: 0;
          transform: scale(0.84);
          transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .ios-message-bubble:hover .ios-message-bubble__actions,
        .ios-message-bubble:focus-within .ios-message-bubble__actions {
          opacity: 1;
          transform: scale(1);
        }

        @keyframes ios-message-slide-right {
          from {
            opacity: 0;
            transform: translateX(18px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes ios-message-slide-left {
          from {
            opacity: 0;
            transform: translateX(-18px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default MessageBubble;
