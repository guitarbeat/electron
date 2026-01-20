import React, { memo } from 'react';
import { Message } from '../types';
import { TrashIcon } from './icons';
import IconButton from './ui/IconButton';
import { spacing, typography, colors, shadows, radius } from '../design-system/tokens';

// * Retro iMessage-style color palette for different senders
const SENDER_COLORS = [
    '#007AFF', // iOS Blue
    '#34C759', // iOS Green
    '#FF9500', // iOS Orange
    '#FF2D55', // iOS Pink
    '#5856D6', // iOS Purple
    '#FF3B30', // iOS Red
    '#5AC8FA', // iOS Light Blue
    '#AF52DE', // iOS Purple Pink
    '#FF9500', // iOS Orange
    '#FFCC00', // iOS Yellow
];

// * Generate consistent color for a sender based on their name
const getSenderColor = (author: string, isCurrentUser: boolean): string => {
    if (isCurrentUser) {
        return '#007AFF'; // * Current user always gets blue (like iMessage)
    }

    // * Generate a consistent color based on the author's name
    let hash = 0;
    for (let i = 0; i < author.length; i++) {
        hash = author.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % SENDER_COLORS.length;
    return SENDER_COLORS[index];
};

// * Format time for display (simpler format for chat)
const formatTime = (date: string): string => {
    try {
        const dateObj = new Date(date);
        const now = new Date();

        if (isNaN(dateObj.getTime()) || isNaN(now.getTime())) {
            return "";
        }

        const seconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

        if (seconds < 0) {
            return "";
        }

        // * Show time if less than 24 hours, otherwise show date
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
        return "";
    }
};

interface MessageItemProps {
    msg: Message;
    currentUser: string | null;
    showSenderName: boolean;
    isSubmitting: boolean;
    onDelete: (id: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({
    msg,
    currentUser,
    showSenderName,
    isSubmitting,
    onDelete,
}) => {
    const authorName = msg.author || 'Anonymous';
    const isCurrentUser = currentUser && authorName.toLowerCase() === currentUser.toLowerCase();
    const senderColor = getSenderColor(authorName, !!isCurrentUser);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
                marginBottom: showSenderName ? spacing.sm : spacing.xs,
                maxWidth: '85%',
                marginLeft: isCurrentUser ? 'auto' : 0,
                marginRight: isCurrentUser ? 0 : 'auto',
            }}
        >
            {/* Sender name and time - only show if different sender */}
            {showSenderName && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.xs,
                    marginBottom: '2px',
                    paddingLeft: isCurrentUser ? 0 : spacing.sm,
                    paddingRight: isCurrentUser ? spacing.sm : 0,
                    alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
                }}>
                    <span style={{
                        fontSize: typography.fontSize.xs,
                        fontWeight: typography.fontWeight.bold,
                        color: senderColor,
                        textShadow: `0 0 8px ${senderColor}80`,
                        letterSpacing: '0.05em',
                    }}>
                        {authorName}
                    </span>
                    {formatTime(msg.createdAt) && (
                        <span style={{
                            fontSize: typography.fontSize.xs,
                            color: colors.textTertiary,
                            opacity: 0.7,
                            fontFamily: 'monospace',
                        }}>
                            [{formatTime(msg.createdAt)}]
                        </span>
                    )}
                </div>
            )}

            {/* Speech bubble */}
            <div
                style={{
                    position: 'relative',
                    background: isCurrentUser
                        ? senderColor
                        : `linear-gradient(135deg, ${senderColor}dd 0%, ${senderColor}cc 100%)`,
                    borderRadius: isCurrentUser
                        ? `${radius.lg} ${radius.lg} 2px ${radius.lg}`
                        : `${radius.lg} ${radius.lg} ${radius.lg} 2px`,
                    padding: `${spacing.sm} ${spacing.md}`,
                    paddingBottom: spacing.sm,
                    boxShadow: shadows.card,
                    border: `1px solid rgba(255,255,255,0.15)`,
                    maxWidth: '100%',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    transition: 'all 0.2s ease',
                }}
                aria-label={`Message from ${authorName}`}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02) translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 8px 16px rgba(0,0,0,0.3), 0 0 20px ${senderColor}60`;
                    e.currentTarget.style.zIndex = '1';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = shadows.card;
                    e.currentTarget.style.zIndex = 'auto';
                }}
            >
                {/* Speech bubble tail */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        [isCurrentUser ? 'right' : 'left']: '-6px',
                        width: 0,
                        height: 0,
                        borderStyle: 'solid',
                        ...(isCurrentUser ? {
                            borderWidth: '0 0 12px 12px',
                            borderColor: `transparent transparent ${senderColor} transparent`,
                        } : {
                            borderWidth: '0 12px 12px 0',
                            borderColor: `transparent ${senderColor}dd transparent transparent`,
                        }),
                        filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))',
                    }}
                />

                {/* Message content */}
                <p style={{
                    color: isCurrentUser
                        ? '#ffffff'
                        : (senderColor === '#FFCC00' || senderColor === '#FFEB3B' || senderColor === '#F0E68C')
                            ? '#000000'
                            : colors.textPrimary,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    margin: 0,
                    lineHeight: typography.lineHeight.normal,
                    fontSize: typography.fontSize.base,
                    textShadow: isCurrentUser
                        ? '0 1px 2px rgba(0,0,0,0.3)'
                        : (senderColor === '#FFCC00' || senderColor === '#FFEB3B' || senderColor === '#F0E68C')
                            ? '0 1px 1px rgba(255,255,255,0.3)'
                            : '0 1px 1px rgba(0,0,0,0.2)',
                }}>
                    {msg.content}
                </p>

                {/* Delete button - appears on hover */}
                <div style={{
                    position: 'absolute',
                    top: -spacing.xs,
                    [isCurrentUser ? 'left' : 'right']: -spacing.xs,
                    transition: 'all 0.2s ease',
                }}
                className="message-actions"
                >
                    <IconButton
                        onClick={() => onDelete(msg.id)}
                        disabled={isSubmitting}
                        variant="danger"
                        title={`Delete message from ${authorName}`}
                        aria-label={`Delete message from ${authorName}`}
                        style={{
                            padding: spacing.xs,
                            minWidth: '24px',
                            minHeight: '24px',
                            background: colors.error,
                            color: '#fff',
                            boxShadow: shadows.button,
                            borderRadius: radius.full,
                        }}
                    >
                        <TrashIcon style={{ width: '12px', height: '12px' }} />
                    </IconButton>
                </div>
            </div>

            {/* Show delete button on hover or when focused */}
            <style>{`
                .message-actions {
                    opacity: 0;
                    transform: scale(0.8);
                }
                div[aria-label*="Message from"]:hover .message-actions,
                .message-actions:focus-within {
                    opacity: 1;
                    transform: scale(1);
                }
            `}</style>
        </div>
    );
};

export default memo(MessageItem);
