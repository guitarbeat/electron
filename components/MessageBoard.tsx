import React, { useState, useEffect, useRef } from 'react';
import { useMessages } from '../hooks/useMessages';
import { useUser } from '../context/UserContext';
import { MessageIcon, SendIcon, Spinner, TrashIcon } from './icons';

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
        <div className="container mx-auto px-4 mt-12">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-4 mb-4">
                     <hr className="flex-grow border-blue-300 border-dashed" />
                    <h2 className="text-2xl font-heading text-blue-200 flex items-center gap-2" style={{textShadow: '2px 2px 4px #87cefa'}}>
                        <MessageIcon /> Message Board
                        {messages && messages.length > 0 && (
                            <span className="text-sm font-normal text-gray-400 ml-2">
                                ({messages.length} {messages.length === 1 ? 'message' : 'messages'})
                            </span>
                        )}
                    </h2>
                     <hr className="flex-grow border-blue-300 border-dashed" />
                </div>
                
                {/* Post Message Form */}
                <form onSubmit={handleSubmit} className="mb-8 cute-card p-4 space-y-3" aria-label="Post a new message">
                    <div className="flex flex-col gap-3">
                        <div>
                            <label htmlFor="message-author" className="sr-only">Your name</label>
                            <input
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
                                className="w-full bg-transparent focus:outline-none placeholder-gray-400 cute-input"
                                disabled={isSubmitting}
                                aria-label="Your name"
                                aria-describedby="author-length"
                            />
                            {author.length > 0 && (
                                <div id="author-length" className="text-xs text-gray-500 mt-1 text-right">
                                    {author.length}/{MAX_AUTHOR_LENGTH}
                                </div>
                            )}
                        </div>
                        <div>
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
                                placeholder="Leave a note for everyone... (Ctrl+Enter to submit)"
                                maxLength={MAX_MESSAGE_LENGTH}
                                rows={3}
                                className="w-full bg-transparent focus:outline-none placeholder-gray-400 cute-input resize-none overflow-y-auto"
                                disabled={isSubmitting}
                                aria-label="Message content"
                                aria-describedby="content-length content-help"
                                aria-invalid={submitError ? 'true' : 'false'}
                                aria-errormessage={submitError ? 'submit-error' : undefined}
                            />
                            <div className="flex justify-between items-center mt-1">
                                <div id="content-help" className="text-xs text-gray-500">
                                    {content.length > 0 && (
                                        <span className="text-gray-400">
                                            {content.length}/{MAX_MESSAGE_LENGTH} characters
                                        </span>
                                    )}
                                    {content.length === 0 && (
                                        <span>Press Ctrl+Enter or Cmd+Enter to submit</span>
                                    )}
                                </div>
                                {content.length > MAX_MESSAGE_LENGTH * 0.9 && (
                                    <div className={`text-xs ${content.length >= MAX_MESSAGE_LENGTH ? 'text-red-400' : 'text-yellow-400'}`}>
                                        {MAX_MESSAGE_LENGTH - content.length} remaining
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {submitError && (
                        <div id="submit-error" className="text-red-400 text-sm" role="alert" aria-live="polite">
                            {submitError}
                        </div>
                    )}
                    <button
                        type="submit"
                        className="w-full cute-button cute-button-blue flex items-center justify-center gap-2"
                        disabled={!content.trim() || isSubmitting || content.length > MAX_MESSAGE_LENGTH}
                        aria-label="Post message"
                    >
                        {isSubmitting ? <Spinner /> : <SendIcon />}
                        {isSubmitting ? 'Posting...' : 'Post Message'}
                    </button>
                </form>

                {/* Message List */}
                <div className="space-y-4" role="log" aria-label="Message board messages" aria-live="polite" aria-atomic="false">
                    {isLoading && !messages && (
                        <div className="text-center text-gray-400 cute-card p-8" role="status" aria-live="polite">
                            <Spinner className="mx-auto mb-2" />
                            <p>Loading messages...</p>
                        </div>
                    )}
                    {error && (
                        <div className="text-center text-red-400 cute-card p-4" role="alert" aria-live="assertive">
                            <p>Error loading messages. Please refresh the page.</p>
                        </div>
                    )}
                    
                    {messages && messages.map((msg, index) => (
                        <article 
                            key={msg.id} 
                            className="cute-card p-4 animate-fade-in flex justify-between items-start gap-4"
                            aria-label={`Message from ${msg.author}`}
                        >
                           <div className="flex-grow min-w-0">
                                <p className="text-white whitespace-pre-wrap break-words">{msg.content}</p>
                                <footer className="text-sm text-pink-300 mt-2 break-words">
                                    <span className="sr-only">Posted by </span>
                                    <strong>{msg.author || 'Anonymous'}</strong>
                                    <span className="text-gray-400 ml-2" aria-label={`Posted ${timeAgo(msg.createdAt)}`}>
                                        ({timeAgo(msg.createdAt)})
                                    </span>
                                </footer>
                           </div>
                           <button
                                onClick={() => handleDelete(msg.id)}
                                disabled={isSubmitting}
                                className="icon-button text-red-400 disabled:opacity-50 flex-shrink-0"
                                title="Delete message"
                                aria-label={`Delete message from ${msg.author}`}
                            >
                                <TrashIcon />
                            </button>
                        </article>
                    ))}
                     {messages?.length === 0 && !isLoading && (
                        <div className="text-center text-gray-400 cute-card p-8" role="status">
                            <MessageIcon className="mx-auto mb-4 opacity-50" />
                            <p className="text-lg mb-2">The message board is empty.</p>
                            <p>Be the first to leave a note!</p>
                        </div>
                    )}
                    <div ref={messagesEndRef} aria-hidden="true" />
                </div>
            </div>
        </div>
    );
};

export default MessageBoard;