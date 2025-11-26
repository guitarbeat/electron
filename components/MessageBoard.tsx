import React, { useState, useEffect, useRef } from 'react';
import { useMessages } from '../hooks/useMessages';
import { useUser } from '../context/UserContext';
import { MessageIcon, SendIcon, Spinner, TrashIcon } from './icons';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Textarea from './ui/Textarea';
import IconButton from './ui/IconButton';
import { spacing, typography, colors, shadows } from '../design-system/tokens';

const MAX_MESSAGE_LENGTH = 500;
const MAX_AUTHOR_LENGTH = 50;

const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
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
};


const MessageBoard: React.FC = () => {
    const { currentUser } = useUser();
    const { messages, isLoading, error, isSubmitting, addMessage, deleteMessage } = useMessages();
    const [author, setAuthor] = useState('');
    const [content, setContent] = useState('');
    const [submitError, setSubmitError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
    const previousMessagesLengthRef = useRef<number>(0);
    
    useEffect(() => {
        setAuthor(currentUser || '');
    }, [currentUser]);

    // * Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages && messages.length > previousMessagesLengthRef.current) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
        previousMessagesLengthRef.current = messages?.length || 0;
    }, [messages]);

    // * Auto-resize textarea based on content
    useEffect(() => {
        const textarea = contentTextareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
        }
    }, [content]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        
        if (!content.trim()) {
            setSubmitError('Please enter a message');
            contentTextareaRef.current?.focus();
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
                contentTextareaRef.current?.focus();
            } catch (err: any) {
                setSubmitError(err.message || 'Failed to post message. Please try again.');
            }
        }
    };
    
    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this message?")) return;
        try {
            await deleteMessage(id);
        } catch (err: any) {
            alert(`Error deleting message: ${err.message}`);
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
        <div style={{ maxWidth: '48rem', margin: '0 auto', marginTop: spacing['3xl'] }}>
            <div>
                <div className="flex items-center gap-4 mb-4" style={{ display: 'flex', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.xl }}>
                    <hr className="flex-grow border-blue-300 border-dashed" style={{ flex: 1, height: '1px', borderColor: colors.borderSecondary, borderStyle: 'dashed' }} />
                    <h2 className="text-2xl font-heading text-blue-200 flex items-center gap-2" style={{
                        fontSize: typography.fontSize['2xl'],
                        fontWeight: typography.fontWeight.semibold,
                        color: colors.secondary,
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.sm,
                        margin: 0,
                        textShadow: shadows.textGlowBlue,
                        letterSpacing: '0.02em',
                    }}>
                        <MessageIcon style={{ width: '24px', height: '24px' }} />
                        Message Board
                        {messages && messages.length > 0 && (
                            <span style={{
                                fontSize: typography.fontSize.sm,
                                fontWeight: typography.fontWeight.normal,
                                color: colors.textSecondary,
                                marginLeft: spacing.sm,
                            }}>
                                ({messages.length} {messages.length === 1 ? 'message' : 'messages'})
                            </span>
                        )}
                    </h2>
                    <hr className="flex-grow border-blue-300 border-dashed" style={{ flex: 1, height: '1px', borderColor: colors.borderSecondary, borderStyle: 'dashed' }} />
                </div>
                
                {/* Post Message Form */}
                <Card variant="elevated" style={{ marginBottom: spacing['2xl'] }}>
                    <form onSubmit={handleSubmit} aria-label="Post a new message" style={{ padding: spacing.lg }}>
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
                                    placeholder="Leave a note for everyone... (Ctrl+Enter to submit)"
                                    maxLength={MAX_MESSAGE_LENGTH}
                                    rows={3}
                                    disabled={isSubmitting}
                                    aria-label="Message content"
                                    aria-describedby="content-length content-help"
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
                                            <span>Press Ctrl+Enter or Cmd+Enter to submit</span>
                                        )}
                                    </div>
                                    {content.length > MAX_MESSAGE_LENGTH * 0.9 && (
                                        <div style={{
                                            fontSize: typography.fontSize.xs,
                                            color: content.length >= MAX_MESSAGE_LENGTH ? colors.error : colors.warning,
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
                                marginTop: spacing.md,
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
                            style={{ width: '100%', marginTop: spacing.md, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing.sm }}
                        >
                            {!isSubmitting && <SendIcon style={{ width: '20px', height: '20px' }} />}
                            {isSubmitting ? 'Posting...' : 'Post Message'}
                        </Button>
                    </form>
                </Card>

                {/* Message List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }} role="log" aria-label="Message board messages" aria-live="polite" aria-atomic="false">
                    {isLoading && !messages && (
                        <Card variant="default">
                            <div style={{ textAlign: 'center', padding: spacing['2xl'], color: colors.textSecondary }} role="status" aria-live="polite">
                                <Spinner style={{ width: '24px', height: '24px', margin: '0 auto', marginBottom: spacing.sm, color: colors.accent }} />
                                <p style={{ margin: 0 }}>Loading messages...</p>
                            </div>
                        </Card>
                    )}
                    {error && (
                        <Card variant="default">
                            <div style={{ textAlign: 'center', padding: spacing.lg, color: colors.error }} role="alert" aria-live="assertive">
                                <p style={{ margin: 0 }}>Error loading messages. Please refresh the page.</p>
                            </div>
                        </Card>
                    )}
                    
                    {messages && messages.map((msg, index) => (
                        <Card 
                            key={msg.id} 
                            variant="default"
                            className="animate-fade-in"
                            style={{ 
                              padding: spacing.lg,
                              animationDelay: `${index * 0.05}s`,
                            }}
                        >
                            <article 
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.lg }}
                                aria-label={`Message from ${msg.author}`}
                            >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{
                                        color: colors.textPrimary,
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        margin: 0,
                                        marginBottom: spacing.sm,
                                        lineHeight: typography.lineHeight.relaxed,
                                        textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                                    }}>
                                        {msg.content}
                                    </p>
                                    <footer style={{
                                        fontSize: typography.fontSize.sm,
                                        color: colors.accent,
                                        wordBreak: 'break-word',
                                    }}>
                                        <span className="sr-only">Posted by </span>
                                        <strong>{msg.author || 'Anonymous'}</strong>
                                        <span style={{ color: colors.textSecondary, marginLeft: spacing.sm }} aria-label={`Posted ${timeAgo(msg.createdAt)}`}>
                                            ({timeAgo(msg.createdAt)})
                                        </span>
                                    </footer>
                                </div>
                                <IconButton
                                    onClick={() => handleDelete(msg.id)}
                                    disabled={isSubmitting}
                                    variant="danger"
                                    title="Delete message"
                                    aria-label={`Delete message from ${msg.author}`}
                                >
                                    <TrashIcon />
                                </IconButton>
                            </article>
                        </Card>
                    ))}
                    {messages?.length === 0 && !isLoading && (
                        <Card variant="default">
                            <div style={{ textAlign: 'center', padding: spacing['2xl'], color: colors.textSecondary }} role="status">
                                <MessageIcon style={{ width: '48px', height: '48px', margin: '0 auto', marginBottom: spacing.lg, opacity: 0.5, color: colors.textTertiary }} />
                                <p style={{ fontSize: typography.fontSize.lg, margin: 0, marginBottom: spacing.sm }}>The message board is empty.</p>
                                <p style={{ margin: 0 }}>Be the first to leave a note!</p>
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
