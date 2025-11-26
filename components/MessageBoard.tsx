import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useMessages } from '../hooks/useMessages';
import { useUser } from '../context/UserContext';
import { MessageIcon, SendIcon, Spinner, TrashIcon, CheckIcon, ChevronDownIcon } from './icons';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Textarea from './ui/Textarea';
import IconButton from './ui/IconButton';
import { spacing, typography, colors, shadows, radius } from '../design-system/tokens';
import { Message } from '../types';

const MAX_MESSAGE_LENGTH = 500;
const MAX_AUTHOR_LENGTH = 50;

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


const MessageBoard: React.FC = () => {
    const { currentUser } = useUser();
    const { messages, isLoading, error, isSubmitting, addMessage, deleteMessage } = useMessages();
    const [author, setAuthor] = useState('');
    const [content, setContent] = useState('');
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
    const previousMessagesLengthRef = useRef<number>(0);
    
    useEffect(() => {
        setAuthor(currentUser || '');
    }, [currentUser]);

    // * Auto-hide toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

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
                const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
                
                if (isNearBottom) {
                    // * Use requestAnimationFrame for better iOS compatibility
                    requestAnimationFrame(() => {
                        setTimeout(() => {
                            container.scrollTo({
                                top: container.scrollHeight,
                                behavior: 'smooth',
                            });
                        }, 100);
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
                inline: 'nearest'
            });
        }
    };

    // * Auto-resize textarea based on content
    useEffect(() => {
        const textarea = contentTextareaRef.current;
        if (textarea) {
            // * Use requestAnimationFrame to prevent layout shifts on iOS
            requestAnimationFrame(() => {
                textarea.style.height = 'auto';
                textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
            });
        }
    }, [content]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        
        // * Blur active element to dismiss iOS keyboard before validation
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement.blur) {
            activeElement.blur();
        }
        
        if (!content.trim()) {
            setSubmitError('Please enter a message');
            // * Delay focus to allow keyboard to dismiss on iOS
            setTimeout(() => {
                contentTextareaRef.current?.focus();
            }, 100);
            return;
        }
        
        if (content.length > MAX_MESSAGE_LENGTH) {
            setSubmitError(`Message is too long (max ${MAX_MESSAGE_LENGTH} characters)`);
            return;
        }
        
        if (author.length > MAX_AUTHOR_LENGTH) {
            setSubmitError(`Name is too long (max ${MAX_AUTHOR_LENGTH} characters)`);
            return;
        }
        
        if (!isSubmitting) {
            try {
                await addMessage(author, content);
                setContent('');
                setToast({ message: 'Message posted successfully!', type: 'success' });
                // * Scroll to bottom after posting
                setTimeout(() => {
                    scrollToBottom();
                }, 200);
                // * Delay focus to allow keyboard to dismiss on iOS after submission
                setTimeout(() => {
                    contentTextareaRef.current?.focus();
                }, 300);
            } catch (err: any) {
                const errorMessage = err.message || 'Failed to post message. Please try again.';
                setSubmitError(errorMessage);
                setToast({ message: errorMessage, type: 'error' });
            }
        }
    };
    
    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this message?")) return;
        try {
            await deleteMessage(id);
            setToast({ message: 'Message deleted', type: 'success' });
        } catch (err: any) {
            setToast({ message: `Error deleting message: ${err.message}`, type: 'error' });
        }
    }
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // * Allow submitting with Ctrl+Enter or Cmd+Enter
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            const form = e.currentTarget.form;
            if (form) {
                form.requestSubmit();
            }
        }
    };

    return (
        <div 
            style={{ 
                maxWidth: '48rem', 
                margin: '0 auto', 
                marginTop: spacing.lg,
                paddingBottom: 'env(safe-area-inset-bottom)',
                paddingLeft: spacing.md,
                paddingRight: spacing.md,
            }}
        >
            {/* Toast Notification */}
            {toast && (
                <Card 
                    variant="elevated" 
                    style={{ 
                        position: 'fixed',
                        top: spacing.lg,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 1000,
                        maxWidth: '90%',
                        padding: spacing.lg,
                        backgroundColor: toast.type === 'error' ? colors.error + '30' : colors.success + '30',
                        borderColor: toast.type === 'error' ? colors.error : colors.success,
                        borderWidth: '2px',
                        animation: 'toast-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                        boxShadow: toast.type === 'error' 
                          ? `0 4px 12px ${colors.error}40, ${shadows.card}` 
                          : `0 4px 12px ${colors.success}40, ${shadows.card}`,
                    }}
                >
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: spacing.md, 
                        color: colors.textPrimary,
                        justifyContent: 'center',
                    }}>
                        {toast.type === 'success' && (
                          <CheckIcon style={{ 
                            color: colors.success, 
                            flexShrink: 0,
                            filter: 'drop-shadow(0 0 4px rgba(74, 222, 128, 0.6))',
                          }} />
                        )}
                        {toast.type === 'error' && (
                          <span style={{ fontSize: '20px', flexShrink: 0 }}>⚠️</span>
                        )}
                        <span style={{ 
                            fontSize: typography.fontSize.base, 
                            textAlign: 'center',
                            fontWeight: typography.fontWeight.medium,
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            hyphens: 'auto',
                            maxWidth: '100%',
                            flex: '1 1 auto', // * Allow flex item to grow and shrink
                            minWidth: 0, // * Allow shrinking below content size for proper wrapping
                        }}>
                            {toast.message}
                        </span>
                    </div>
                </Card>
            )}
            
            <div>
                <div className="flex items-center gap-4 mb-4" style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
                    <hr className="flex-grow border-blue-300 border-dashed" style={{ 
                        flex: 1, 
                        height: '2px', 
                        borderColor: colors.borderSecondary, 
                        borderStyle: 'dashed',
                        opacity: 0.5,
                    }} />
                    <h2 className="text-2xl font-heading text-blue-200 flex items-center gap-2 message-board-title" style={{
                        fontSize: typography.fontSize['2xl'],
                        fontWeight: typography.fontWeight.semibold,
                        color: colors.secondary, // * Fallback for browsers without gradient support
                        background: shadows.textGradientBlue,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.sm,
                        margin: 0,
                        textShadow: '0 2px 8px rgba(0, 0, 0, 0.5), 0 0 20px rgba(135, 206, 250, 0.3)',
                        letterSpacing: '0.02em',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))',
                    }}>
                        <MessageIcon style={{ width: '28px', height: '28px', filter: 'drop-shadow(0 0 4px rgba(135, 206, 250, 0.6))' }} />
                        Message Board
                        {messages && messages.length > 0 && (
                            <span style={{
                                fontSize: typography.fontSize.base,
                                fontWeight: typography.fontWeight.medium,
                                color: colors.textSecondary,
                                marginLeft: spacing.xs,
                                backgroundColor: colors.secondaryMuted,
                                padding: `${spacing.xs} ${spacing.sm}`,
                                borderRadius: radius.full,
                                border: `1px solid ${colors.secondary}40`,
                            }}>
                                {messages.length}
                            </span>
                        )}
                    </h2>
                    <hr className="flex-grow border-blue-300 border-dashed" style={{ 
                        flex: 1, 
                        height: '2px', 
                        borderColor: colors.borderSecondary, 
                        borderStyle: 'dashed',
                        opacity: 0.5,
                    }} />
                </div>
                
                {/* Messages Container - Scrollable */}
                <div
                    ref={messagesContainerRef}
                    style={{
                        maxHeight: '60vh',
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        paddingRight: spacing.xs,
                        marginBottom: spacing.md,
                        position: 'relative',
                        // * Custom scrollbar styling
                        scrollbarWidth: 'thin',
                        scrollbarColor: `${colors.secondary}40 transparent`,
                    }}
                    className="messages-container"
                >
                    <style>{`
                        .messages-container::-webkit-scrollbar {
                            width: 8px;
                        }
                        .messages-container::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        .messages-container::-webkit-scrollbar-thumb {
                            background: ${colors.secondary}40;
                            border-radius: ${radius.full};
                        }
                        .messages-container::-webkit-scrollbar-thumb:hover {
                            background: ${colors.secondary}60;
                        }
                    `}</style>
                    {/* Scroll to Bottom Button */}
                    {showScrollToBottom && (
                        <div style={{
                            position: 'absolute',
                            bottom: spacing.md,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 10,
                            display: 'flex',
                            justifyContent: 'center',
                        }}>
                            <IconButton
                                onClick={scrollToBottom}
                                aria-label="Scroll to bottom"
                                style={{
                                    background: colors.secondary,
                                    boxShadow: shadows.card,
                                    borderRadius: radius.full,
                                    padding: spacing.sm,
                                    minWidth: '48px',
                                    minHeight: '48px',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.1)';
                                    e.currentTarget.style.boxShadow = shadows.glowBlue;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = shadows.card;
                                }}
                            >
                                <ChevronDownIcon style={{ width: '24px', height: '24px', color: '#ffffff' }} />
                            </IconButton>
                        </div>
                    )}

                    {/* Message List - Retro iMessage Style */}
                    <div 
                        style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: spacing.xs,
                            paddingBottom: spacing.md,
                        }} 
                        role="log" 
                        aria-label="Message board messages" 
                        aria-live="polite" 
                        aria-atomic="false"
                    >
                    {isLoading && !messages && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
                            {[1, 2, 3].map((i) => (
                                <div key={i} style={{ 
                                    padding: `${spacing.sm} ${spacing.md}`,
                                    height: '50px',
                                    background: colors.surface,
                                    borderRadius: radius.lg,
                                    opacity: 0.5,
                                }} />
                            ))}
                        </div>
                    )}
                    {error && (
                        <Card variant="default">
                            <div style={{ textAlign: 'center', padding: spacing.lg, color: colors.error }} role="alert" aria-live="assertive">
                                <p style={{ margin: 0 }}>Error loading messages. Please refresh the page.</p>
                            </div>
                        </Card>
                    )}
                    
                    {messages && [...messages].reverse().map((msg, index, reversedArray) => {
                        const authorName = msg.author || 'Anonymous';
                        const isCurrentUser = currentUser && authorName.toLowerCase() === currentUser.toLowerCase();
                        const senderColor = getSenderColor(authorName, !!isCurrentUser);
                        const prevMsg = index > 0 ? reversedArray[index - 1] : null;
                        const isSameSender = prevMsg && (prevMsg.author || 'Anonymous') === authorName;
                        const showSenderName = !isSameSender || index === 0;
                        
                        return (
                            <div
                                key={msg.id}
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
                                        marginBottom: spacing.xs / 2,
                                        paddingLeft: isCurrentUser ? 0 : spacing.sm,
                                        paddingRight: isCurrentUser ? spacing.sm : 0,
                                        alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
                                    }}>
                                        <span style={{
                                            fontSize: typography.fontSize.xs,
                                            fontWeight: typography.fontWeight.medium,
                                            color: senderColor,
                                            textShadow: `0 0 8px ${senderColor}40`,
                                        }}>
                                            {authorName}
                                        </span>
                                        {formatTime(msg.createdAt) && (
                                            <span style={{
                                                fontSize: typography.fontSize.xs,
                                                color: colors.textTertiary,
                                                opacity: 0.7,
                                            }}>
                                                {formatTime(msg.createdAt)}
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
                                            ? `${radius.lg} ${radius.lg} ${radius.xs} ${radius.lg}` 
                                            : `${radius.lg} ${radius.lg} ${radius.lg} ${radius.xs}`,
                                        padding: `${spacing.sm} ${spacing.md}`,
                                        paddingBottom: spacing.sm,
                                        boxShadow: `0 2px 4px rgba(0,0,0,0.2), 0 0 12px ${senderColor}30`,
                                        maxWidth: '100%',
                                        wordWrap: 'break-word',
                                        overflowWrap: 'break-word',
                                        transition: 'all 0.2s ease',
                                    }}
                                    aria-label={`Message from ${authorName}`}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'scale(1.02)';
                                        e.currentTarget.style.boxShadow = `0 4px 8px rgba(0,0,0,0.3), 0 0 16px ${senderColor}50`;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.boxShadow = `0 2px 4px rgba(0,0,0,0.2), 0 0 12px ${senderColor}30`;
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
                                        top: spacing.xs,
                                        [isCurrentUser ? 'left' : 'right']: spacing.xs,
                                        opacity: 0,
                                        transition: 'opacity 0.2s ease',
                                    }}
                                    className="message-actions"
                                    >
                                        <IconButton
                                            onClick={() => handleDelete(msg.id)}
                                            disabled={isSubmitting}
                                            variant="danger"
                                            title={`Delete message from ${authorName}`}
                                            aria-label={`Delete message from ${authorName}`}
                                            style={{
                                                padding: spacing.xs,
                                                minWidth: '24px',
                                                minHeight: '24px',
                                                background: 'rgba(0,0,0,0.3)',
                                                backdropFilter: 'blur(4px)',
                                            }}
                                        >
                                            <TrashIcon style={{ width: '10px', height: '10px' }} />
                                        </IconButton>
                                    </div>
                                </div>
                                
                                {/* Show delete button on hover */}
                                <style>{`
                                    .message-actions {
                                        opacity: 0;
                                    }
                                    div[aria-label*="Message from"]:hover .message-actions {
                                        opacity: 1;
                                    }
                                `}</style>
                            </div>
                        );
                    })}
                    {messages?.length === 0 && !isLoading && (
                        <Card variant="elevated">
                            <div style={{ textAlign: 'center', padding: spacing.xl, color: colors.textSecondary }} role="status">
                                <MessageIcon style={{ 
                                    width: '60px', 
                                    height: '60px', 
                                    margin: '0 auto', 
                                    marginBottom: spacing.md, 
                                    opacity: 0.6, 
                                    color: colors.secondary,
                                    filter: 'drop-shadow(0 0 10px rgba(135, 206, 250, 0.3))',
                                }} />
                                <p style={{ 
                                    fontSize: typography.fontSize.lg, 
                                    margin: 0, 
                                    marginBottom: spacing.sm,
                                    color: colors.textPrimary,
                                    fontWeight: typography.fontWeight.semibold,
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                                }}>
                                    The message board is empty
                                </p>
                                <p style={{ 
                                    margin: 0,
                                    fontSize: typography.fontSize.sm,
                                    color: colors.textSecondary,
                                    lineHeight: typography.lineHeight.normal,
                                }}>
                                    Be the first to leave a note for everyone!
                                </p>
                            </div>
                        </Card>
                    )}
                    <div ref={messagesEndRef} aria-hidden="true" />
                    </div>
                </div>

                {/* Post Message Form - At Bottom */}
                <Card variant="elevated">
                    <form onSubmit={handleSubmit} aria-label="Post a new message" style={{ padding: spacing.md }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                            <div>
                                <label htmlFor="message-author" className="sr-only">Your name</label>
                                <Input
                                    id="message-author"
                                    type="text"
                                    value={author}
                                    onChange={(e) => {
                                        const value = e.target.value.slice(0, MAX_AUTHOR_LENGTH);
                                        setAuthor(value);
                                        setSubmitError(null);
                                    }}
                                    placeholder="Your name (optional)"
                                    maxLength={MAX_AUTHOR_LENGTH}
                                    disabled={isSubmitting}
                                    aria-label="Your name"
                                    aria-describedby="author-length"
                                    style={{ margin: 0 }}
                                />
                                {author.length > 0 && (
                                    <div id="author-length" style={{
                                        fontSize: typography.fontSize.xs,
                                        color: colors.textTertiary,
                                        marginTop: spacing.xs,
                                        textAlign: 'right',
                                    }}>
                                        {author.length}/{MAX_AUTHOR_LENGTH}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label htmlFor="message-content" className="sr-only">Message content</label>
                                <Textarea
                                    id="message-content"
                                    ref={contentTextareaRef}
                                    value={content}
                                    onChange={(e) => {
                                        const value = e.target.value.slice(0, MAX_MESSAGE_LENGTH);
                                        setContent(value);
                                        setSubmitError(null);
                                    }}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Share your thoughts, suggestions, or just say hello..."
                                    maxLength={MAX_MESSAGE_LENGTH}
                                    rows={4}
                                    disabled={isSubmitting}
                                    aria-label="Message content"
                                    aria-describedby="content-help"
                                    aria-invalid={submitError ? 'true' : 'false'}
                                    aria-errormessage={submitError ? 'submit-error' : undefined}
                                    error={submitError || undefined}
                                    style={{ margin: 0 }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs }}>
                                    <div id="content-help" style={{ fontSize: typography.fontSize.xs, color: colors.textTertiary }}>
                                        {content.length > 0 && (
                                            <span style={{ color: colors.textSecondary }}>
                                                {content.length}/{MAX_MESSAGE_LENGTH} characters
                                            </span>
                                        )}
                                        {content.length === 0 && (
                                            <span>Tip: Press Ctrl+Enter or Cmd+Enter to submit quickly</span>
                                        )}
                                    </div>
                                    {content.length > MAX_MESSAGE_LENGTH * 0.9 && (
                                        <div style={{
                                            fontSize: typography.fontSize.xs,
                                            color: content.length >= MAX_MESSAGE_LENGTH ? colors.error : colors.warning,
                                            fontWeight: typography.fontWeight.medium,
                                        }}>
                                            {MAX_MESSAGE_LENGTH - content.length} remaining
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        {submitError && (
                            <div id="submit-error" style={{
                                color: colors.error,
                                fontSize: typography.fontSize.sm,
                                marginTop: spacing.sm,
                                padding: spacing.xs,
                                backgroundColor: colors.error + '20',
                                borderRadius: radius.sm,
                                border: `1px solid ${colors.error}40`,
                            }} role="alert" aria-live="polite">
                                {submitError}
                            </div>
                        )}
                        <Button
                            type="submit"
                            variant="secondary"
                            isLoading={isSubmitting}
                            disabled={!content.trim() || isSubmitting || content.length > MAX_MESSAGE_LENGTH}
                            aria-label="Post message"
                            style={{ 
                                width: '100%', 
                                marginTop: spacing.md, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                gap: spacing.sm,
                                fontSize: typography.fontSize.base,
                            }}
                        >
                            {!isSubmitting && <SendIcon style={{ width: '22px', height: '22px' }} />}
                            {isSubmitting ? 'Posting...' : 'Post Message'}
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default MessageBoard;
