import React, { useState, useEffect, useRef } from 'react';
import { useMessages } from '../hooks/useMessages';
import { useUser } from '../context/UserContext';
import { MessageIcon, SendIcon, Spinner, TrashIcon, CheckIcon } from './icons';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Textarea from './ui/Textarea';
import IconButton from './ui/IconButton';
import { spacing, typography, colors, shadows, radius } from '../design-system/tokens';

const MAX_MESSAGE_LENGTH = 500;
const MAX_AUTHOR_LENGTH = 50;

const timeAgo = (date: string) => {
    try {
        const dateObj = new Date(date);
        const now = new Date();
        
        // * Handle invalid dates
        if (isNaN(dateObj.getTime()) || isNaN(now.getTime())) {
            return "Recently";
        }
        
        const seconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
        
        // * Handle future dates (shouldn't happen, but safety check)
        if (seconds < 0) {
            return "Just now";
        }
        
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return "Just now";
    } catch {
        return "Recently";
    }
};


const MessageBoard: React.FC = () => {
    const { currentUser } = useUser();
    const { messages, isLoading, error, isSubmitting, addMessage, deleteMessage } = useMessages();
    const [author, setAuthor] = useState('');
    const [content, setContent] = useState('');
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
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

    // * Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages && messages.length > previousMessagesLengthRef.current) {
            // * Use requestAnimationFrame for better iOS compatibility
            requestAnimationFrame(() => {
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'nearest',
                        inline: 'nearest'
                    });
                }, 100);
            });
        }
        previousMessagesLengthRef.current = messages?.length || 0;
    }, [messages]);

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
                marginTop: spacing.xl, // * Reduced from 3xl for more condensed feel
                paddingBottom: 'env(safe-area-inset-bottom)', // * Safe area for iPhone home indicator
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
                
                {/* Post Message Form */}
                <Card variant="elevated" style={{ marginBottom: spacing.lg }}>
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

                {/* Message List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }} role="log" aria-label="Message board messages" aria-live="polite" aria-atomic="false">
                    {isLoading && !messages && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                            {[1, 2, 3].map((i) => (
                                <Card key={i} variant="default" className="skeleton" style={{ 
                                    padding: `${spacing.sm} ${spacing.md}`,
                                    height: '60px',
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
                    
                    {messages && messages.map((msg, index) => (
                        <div
                            key={msg.id}
                            className="message-bubble slide-up"
                            style={{
                                animationDelay: `${index * 0.05}s`,
                                marginBottom: 0,
                            }}
                        >
                            {/* Author and time header - above bubble */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: spacing.xs,
                                marginBottom: spacing.xs,
                                paddingLeft: spacing.xs,
                                flexWrap: 'wrap',
                            }}>
                                <strong style={{
                                    fontWeight: typography.fontWeight.semibold,
                                    color: colors.secondary,
                                    fontSize: typography.fontSize.sm,
                                }}>
                                    {msg.author || 'Anonymous'}
                                </strong>
                                <span
                                    style={{
                                        color: colors.textTertiary,
                                        fontSize: typography.fontSize.xs,
                                    }}
                                    aria-label={`Posted ${timeAgo(msg.createdAt)}`}
                                >
                                    · {timeAgo(msg.createdAt)}
                                </span>
                            </div>
                            
                            {/* Message bubble */}
                            <div
                                style={{
                                    background: colors.surface,
                                    borderRadius: radius.lg, // * More rounded like iMessage bubbles
                                    padding: `${spacing.md} ${spacing.lg}`,
                                    border: `1px solid ${colors.borderSecondary}40`, // * Subtle border
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1), 0 0 8px rgba(135, 206, 250, 0.1)', // * Softer shadow
                                    position: 'relative',
                                    transition: 'all 0.2s ease',
                                    wordWrap: 'break-word',
                                    overflowWrap: 'break-word',
                                    wordBreak: 'break-word',
                                }}
                                aria-label={`Message from ${msg.author}`}
                            >
                                {/* Message content */}
                                <p style={{
                                    color: colors.textPrimary,
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                    hyphens: 'auto',
                                    margin: 0,
                                    marginBottom: spacing.xs,
                                    lineHeight: typography.lineHeight.normal,
                                    textShadow: '0 1px 1px rgba(0,0,0,0.2)',
                                    letterSpacing: '0.01em',
                                    fontSize: typography.fontSize.base,
                                }}>
                                    {msg.content}
                                </p>
                                
                                {/* Delete button - subtle, inline */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    marginTop: spacing.xs,
                                    opacity: 0.6,
                                    transition: 'opacity 0.2s ease',
                                }}
                                className="message-actions"
                                >
                                    <IconButton
                                        onClick={() => handleDelete(msg.id)}
                                        disabled={isSubmitting}
                                        variant="danger"
                                        title={`Delete message from ${msg.author}`}
                                        aria-label={`Delete message from ${msg.author}`}
                                        style={{
                                            flexShrink: 0,
                                            padding: spacing.xs,
                                            minWidth: '28px',
                                            minHeight: '28px',
                                            opacity: 0.7,
                                        }}
                                    >
                                        <TrashIcon style={{ width: '12px', height: '12px' }} />
                                    </IconButton>
                                </div>
                            </div>
                        </div>
                    ))}
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
        </div>
    );
};

export default MessageBoard;
