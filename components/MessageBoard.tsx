import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useMessages } from '../hooks/useMessages';
import { useUser } from '../context/UserContext';
import { MessageIcon, SendIcon, Spinner, TrashIcon, CheckIcon, ChevronDownIcon } from './icons';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Textarea from './ui/Textarea';
import IconButton from './ui/IconButton';
import { spacing, typography, colors, shadows, radius, borders } from '../design-system/tokens';
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
    const [isMinimized, setIsMinimized] = useState(false); // New state for minimize
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
                const newHeight = Math.min(textarea.scrollHeight, 120); // * Max 120px (matches maxHeight)
                textarea.style.height = `${Math.max(newHeight, 44)}px`; // * Min 44px
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
                maxWidth: '64rem', // Wider for chat window
                margin: '0 auto', 
                padding: spacing.md,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
            }}
            className="message-board-container"
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
            
            {/* Retro Window Container */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                height: isMinimized ? 'auto' : '100%', // Auto height when minimized
                backgroundColor: '#c0c0c0', // Classic Windows Gray
                border: '2px solid #dfdfdf',
                borderRightColor: '#404040',
                borderBottomColor: '#404040',
                boxShadow: '4px 4px 10px rgba(0,0,0,0.5)',
                fontFamily: 'Tahoma, sans-serif', // Fallback for UI elements
                transition: 'height 0.3s ease',
            }}>
                {/* Title Bar */}
                <div 
                    onDoubleClick={() => setIsMinimized(!isMinimized)}
                    style={{
                        background: 'linear-gradient(90deg, #000080 0%, #1084d0 100%)', // Classic Blue Gradient
                        padding: `${spacing.xs} ${spacing.sm}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        color: '#ffffff',
                        height: '32px',
                        cursor: 'default',
                        userSelect: 'none',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                        <MessageIcon style={{ width: '16px', height: '16px', color: '#ffffff' }} />
                        <span style={{ 
                            fontWeight: 'bold', 
                            fontSize: '13px', 
                            letterSpacing: '0.5px',
                            textShadow: '1px 1px 0px rgba(0,0,0,0.5)'
                        }}>
                            Electra & Aaron's Chat Room v1.0
                        </span>
                    </div>
                    
                    {/* Window Controls */}
                    <div style={{ display: 'flex', gap: '2px' }}>
                        <button 
                            onClick={() => setIsMinimized(!isMinimized)}
                            aria-label={isMinimized ? "Restore" : "Minimize"}
                            style={{
                                width: '20px',
                                height: '20px',
                                backgroundColor: '#c0c0c0',
                                border: '1px solid #fff',
                                borderRightColor: '#404040',
                                borderBottomColor: '#404040',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                lineHeight: 1,
                                padding: 0,
                                cursor: 'pointer',
                                color: '#000',
                                boxShadow: 'inset 1px 1px 0px #fff',
                            }}
                        >
                            <span style={{ marginTop: '-6px' }}>_</span>
                        </button>
                        <button style={{
                            width: '20px',
                            height: '20px',
                            backgroundColor: '#c0c0c0',
                            border: '1px solid #fff',
                            borderRightColor: '#404040',
                            borderBottomColor: '#404040',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            lineHeight: 1,
                            padding: 0,
                            cursor: 'default',
                            color: '#808080', // Disabled look
                            boxShadow: 'inset 1px 1px 0px #fff',
                        }}>
                            <span>□</span>
                        </button>
                        <button style={{
                            width: '20px',
                            height: '20px',
                            backgroundColor: '#c0c0c0',
                            border: '1px solid #fff',
                            borderRightColor: '#404040',
                            borderBottomColor: '#404040',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            lineHeight: 1,
                            padding: 0,
                            cursor: 'default',
                            color: '#000',
                            boxShadow: 'inset 1px 1px 0px #fff',
                        }}>
                            <span>×</span>
                        </button>
                    </div>
                </div>

                {/* Window Body */}
                {!isMinimized && (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        padding: '2px',
                        gap: '2px',
                        overflow: 'hidden', // Contain children
                    }}>
                    {/* Main Chat Area */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: colors.background, // Keep dark theme for chat content
                        border: '2px solid #808080', // Inset border
                        borderRightColor: '#fff',
                        borderBottomColor: '#fff',
                        overflow: 'hidden',
                    }}>
                        {/* Messages Header (Inside Window) */}
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            padding: spacing.sm,
                            borderBottom: `1px solid ${colors.borderInset}`,
                            backgroundColor: colors.surface,
                        }}>
                            <h2 style={{
                                fontSize: typography.fontSize.lg,
                                fontWeight: typography.fontWeight.bold,
                                color: colors.textPrimary,
                                margin: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: spacing.xs,
                                textShadow: shadows.textGlowBlue,
                            }}>
                                #general
                            </h2>
                            <span style={{
                                fontSize: typography.fontSize.xs,
                                color: colors.textTertiary,
                            }}>
                                Topic: Movie Night Planning 🍿
                            </span>
                        </div>
            
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                            
                            {/* Messages Container - Scrollable */}
                            <div
                                ref={messagesContainerRef}
                                style={{
                                    flex: 1,
                                    overflowY: 'auto',
                                    overflowX: 'hidden',
                                    padding: spacing.md,
                                    position: 'relative',
                                    minHeight: 0,
                                    // * Custom scrollbar styling
                                    scrollbarWidth: 'thin',
                                    scrollbarColor: `${colors.secondary}40 transparent`,
                                }}
                                className="messages-container"
                            >
                                <style>{`
                                    .messages-container::-webkit-scrollbar {
                                        width: 12px;
                                    }
                                    .messages-container::-webkit-scrollbar-track {
                                        background: #1a1a2e;
                                        border-left: 1px solid #333;
                                    }
                                    .messages-container::-webkit-scrollbar-thumb {
                                        background: #404040;
                                        border: 1px solid #808080;
                                        border-radius: 0;
                                    }
                                    .messages-container::-webkit-scrollbar-thumb:hover {
                                        background: #505050;
                                    }
                                    @keyframes pulse-glow {
                                        0% { filter: drop-shadow(0 0 10px ${colors.secondary}40); transform: scale(1); }
                                        50% { filter: drop-shadow(0 0 20px ${colors.secondary}80); transform: scale(1.05); }
                                        100% { filter: drop-shadow(0 0 10px ${colors.secondary}40); transform: scale(1); }
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
                                                minWidth: '40px',
                                                minHeight: '40px',
                                                transition: 'all 0.2s ease',
                                            }}
                                        >
                                            <ChevronDownIcon style={{ width: '20px', height: '20px', color: '#ffffff' }} />
                                        </IconButton>
                                    </div>
                                )}

                                {/* Message List - Retro iMessage Style */}
                                <div 
                                    style={{ 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        gap: spacing.md,
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
                                                    opacity: 0,
                                                    transition: 'all 0.2s ease',
                                                    transform: 'scale(0.8)',
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
                                            
                                            {/* Show delete button on hover */}
                                            <style>{`
                                                .message-actions {
                                                    opacity: 0;
                                                }
                                                div[aria-label*="Message from"]:hover .message-actions {
                                                    opacity: 1;
                                                    transform: scale(1);
                                                }
                                            `}</style>
                                        </div>
                                    );
                                })}
                                {messages?.length === 0 && !isLoading && (
                                    <div style={{ 
                                        textAlign: 'center', 
                                        padding: spacing['2xl'], 
                                        color: colors.textTertiary,
                                        opacity: 0.8,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: '100%',
                                    }} role="status">
                                        <div style={{
                                            animation: 'pulse-glow 3s infinite ease-in-out',
                                        }}>
                                            <MessageIcon style={{ 
                                                width: '64px', 
                                                height: '64px', 
                                                marginBottom: spacing.md, 
                                                color: colors.secondary,
                                            }} />
                                        </div>
                                        <p style={{ 
                                            fontSize: typography.fontSize.lg, 
                                            margin: 0,
                                            color: colors.textSecondary,
                                            textShadow: shadows.textGlowBlue,
                                        }}>
                                            No messages yet...
                                        </p>
                                        <p style={{
                                            fontSize: typography.fontSize.sm,
                                            color: colors.textTertiary,
                                            marginTop: spacing.xs,
                                        }}>
                                            Be the first to start the conversation!
                                        </p>
                                    </div>
                                )}
                                <div ref={messagesEndRef} aria-hidden="true" />
                                </div>
                            </div>

                            {/* Post Message Form - Streamlined Chat Input */}
                            <div style={{
                                background: colors.surface,
                                padding: spacing.sm,
                                borderTop: `1px solid ${colors.borderInset}`,
                            }}>
                                <form 
                                    onSubmit={handleSubmit} 
                                    aria-label="Post a new message"
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: spacing.sm,
                                    }}
                                >
                                    {/* Author field - compact inline */}
                                    {!currentUser && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                                            <label htmlFor="message-author" style={{
                                                fontSize: typography.fontSize.xs,
                                                color: colors.textTertiary,
                                                whiteSpace: 'nowrap',
                                                fontWeight: typography.fontWeight.bold,
                                            }}>
                                                FROM:
                                            </label>
                                            <input
                                                id="message-author"
                                                type="text"
                                                value={author}
                                                onChange={(e) => {
                                                    const value = e.target.value.slice(0, MAX_AUTHOR_LENGTH);
                                                    setAuthor(value);
                                                    setSubmitError(null);
                                                }}
                                                placeholder="YOUR NAME"
                                                maxLength={MAX_AUTHOR_LENGTH}
                                                disabled={isSubmitting}
                                                aria-label="Your name"
                                                style={{
                                                    flex: 1,
                                                    padding: `${spacing.xs} ${spacing.sm}`,
                                                    backgroundColor: '#000',
                                                    border: borders.inputInset,
                                                    borderRadius: 0, // Retro sharp corners
                                                    color: colors.secondary,
                                                    fontSize: typography.fontSize.sm,
                                                    fontFamily: typography.fontFamily.mono.join(', '),
                                                    outline: 'none',
                                                    transition: 'all 0.2s ease',
                                                    letterSpacing: '0.05em',
                                                }}
                                                onFocus={(e) => {
                                                    e.currentTarget.style.borderColor = colors.secondary;
                                                    e.currentTarget.style.boxShadow = `0 0 8px ${colors.secondary}40`;
                                                }}
                                                onBlur={(e) => {
                                                    e.currentTarget.style.borderColor = colors.borderInset;
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }}
                                            />
                                        </div>
                                    )}
                                    
                                    {/* Message input and send button - chat bar style */}
                                    <div style={{
                                        display: 'flex',
                                        gap: spacing.sm,
                                        alignItems: 'flex-end',
                                    }}>
                                        <div style={{ flex: 1, position: 'relative' }}>
                                            <label htmlFor="message-content" className="sr-only">Message content</label>
                                            <textarea
                                                id="message-content"
                                                ref={contentTextareaRef}
                                                value={content}
                                                onChange={(e) => {
                                                    const value = e.target.value.slice(0, MAX_MESSAGE_LENGTH);
                                                    setContent(value);
                                                    setSubmitError(null);
                                                }}
                                                onKeyDown={handleKeyDown}
                                                placeholder="Type a message..."
                                                maxLength={MAX_MESSAGE_LENGTH}
                                                rows={1}
                                                disabled={isSubmitting}
                                                aria-label="Message content"
                                                aria-invalid={submitError ? 'true' : 'false'}
                                                style={{
                                                    width: '100%',
                                                    padding: `${spacing.sm} ${spacing.md}`,
                                                    backgroundColor: '#fff', // White background for classic chat feel
                                                    border: borders.inputInset,
                                                    borderRadius: 0, // Sharp corners
                                                    color: '#000', // Black text
                                                    fontSize: typography.fontSize.base,
                                                    fontFamily: 'Arial, sans-serif', // Classic chat font
                                                    lineHeight: typography.lineHeight.normal,
                                                    resize: 'none',
                                                    minHeight: '44px',
                                                    maxHeight: '120px',
                                                    outline: 'none',
                                                    transition: 'all 0.2s ease',
                                                    overflow: 'hidden',
                                                }}
                                                onFocus={(e) => {
                                                    e.currentTarget.style.borderColor = colors.accent;
                                                    e.currentTarget.style.boxShadow = `inset 0 0 4px rgba(0,0,0,0.2)`;
                                                }}
                                                onBlur={(e) => {
                                                    e.currentTarget.style.borderColor = colors.borderInset;
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }}
                                            />
                                            
                                            {/* Character count - subtle */}
                                            {content.length > 0 && (
                                                <div style={{
                                                    position: 'absolute',
                                                    bottom: spacing.xs,
                                                    right: spacing.sm,
                                                    fontSize: typography.fontSize.xs,
                                                    color: content.length > MAX_MESSAGE_LENGTH * 0.9 
                                                        ? (content.length >= MAX_MESSAGE_LENGTH ? colors.error : colors.warning)
                                                        : '#666',
                                                    pointerEvents: 'none',
                                                    opacity: 0.6,
                                                    fontFamily: typography.fontFamily.mono.join(', '),
                                                }}>
                                                    {content.length}/{MAX_MESSAGE_LENGTH}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Send button - Retro Windows Button */}
                                        <button
                                            type="submit"
                                            disabled={!content.trim() || isSubmitting || content.length > MAX_MESSAGE_LENGTH}
                                            aria-label="Send message"
                                            style={{
                                                width: '60px',
                                                height: '44px',
                                                borderRadius: 0, // Sharp corners
                                                backgroundColor: '#c0c0c0',
                                                border: '2px outset #fff',
                                                borderRightColor: '#404040',
                                                borderBottomColor: '#404040',
                                                color: '#000',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: (content.trim() && content.length <= MAX_MESSAGE_LENGTH && !isSubmitting) ? 'pointer' : 'not-allowed',
                                                boxShadow: '1px 1px 0px #000',
                                                transition: 'all 0.1s ease',
                                                fontWeight: 'bold',
                                                fontSize: '14px',
                                            }}
                                            onMouseDown={(e) => {
                                                if (!e.currentTarget.disabled) {
                                                    e.currentTarget.style.border = '2px inset #fff';
                                                    e.currentTarget.style.borderRightColor = '#dfdfdf';
                                                    e.currentTarget.style.borderBottomColor = '#dfdfdf';
                                                    e.currentTarget.style.transform = 'translate(1px, 1px)';
                                                }
                                            }}
                                            onMouseUp={(e) => {
                                                if (!e.currentTarget.disabled) {
                                                    e.currentTarget.style.border = '2px outset #fff';
                                                    e.currentTarget.style.borderRightColor = '#404040';
                                                    e.currentTarget.style.borderBottomColor = '#404040';
                                                    e.currentTarget.style.transform = 'translate(0, 0)';
                                                }
                                            }}
                                        >
                                            {isSubmitting ? (
                                                <Spinner style={{ width: '16px', height: '16px', color: '#000' }} />
                                            ) : (
                                                'Send'
                                            )}
                                        </button>
                                    </div>
                                    
                                    {/* Error message */}
                                    {submitError && (
                                        <div id="submit-error" style={{
                                            color: colors.error,
                                            fontSize: typography.fontSize.xs,
                                            padding: `${spacing.xs} ${spacing.sm}`,
                                            backgroundColor: colors.error + '20',
                                            borderRadius: radius.sm,
                                            border: `1px solid ${colors.error}40`,
                                        }} role="alert" aria-live="polite">
                                            {submitError}
                                        </div>
                                    )}
                                </form>
                            </div>
                        </div>
                    </div>
                    
                    {/* Online Users Sidebar - Hidden on very small screens if needed, but keeping simple for now */}
                    <div 
                        className="online-users-sidebar"
                        style={{
                        width: '180px',
                        backgroundColor: '#fff',
                        border: '2px inset #dfdfdf',
                        borderRightColor: '#fff',
                        borderBottomColor: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        fontFamily: 'Tahoma, sans-serif',
                        marginLeft: '2px',
                    }}>
                        <div style={{
                            padding: '4px',
                            backgroundColor: '#c0c0c0',
                            borderBottom: '1px solid #808080',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            color: '#000',
                        }}>
                            Online Users (3)
                        </div>
                        <div style={{ padding: '4px', overflowY: 'auto', flex: 1, backgroundColor: '#fff' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00ff00', border: '1px solid #008000' }}></span>
                                <span style={{ fontSize: '12px', color: '#000' }}>Electra (Admin)</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00ff00', border: '1px solid #008000' }}></span>
                                <span style={{ fontSize: '12px', color: '#000' }}>Aaron (Admin)</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00ff00', border: '1px solid #008000' }}></span>
                                <span style={{ fontSize: '12px', color: '#000' }}>Guest_123</span>
                            </div>
                        </div>
                    </div>
                    </div>

                )}
                </div>

            
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes toast-slide-in {
                    from { transform: translate(-50%, -100%); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }

                @media (max-width: 768px) {
                    .online-users-sidebar {
                        display: none !important;
                    }
                    .message-board-container {
                        padding: 0.5rem !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default MessageBoard;
