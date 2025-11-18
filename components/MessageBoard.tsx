import React, { useState, useEffect } from 'react';
import { useMessages } from '../hooks/useMessages';
import { useUser } from '../context/UserContext';
import { MessageIcon, SendIcon, Spinner, TrashIcon } from './icons';

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
    
    useEffect(() => {
        setAuthor(currentUser || '');
    }, [currentUser]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (content.trim() && !isSubmitting) {
            try {
                await addMessage(author, content);
                setContent('');
            } catch (err: any) {
                alert(`Error posting message: ${err.message}`);
            }
        }
    };
    
    const handleDelete = async (id: string) => {
        try {
            await deleteMessage(id);
        } catch (err: any) {
            alert(`Error deleting message: ${err.message}`);
        }
    }

    return (
        <div className="container mx-auto px-4 mt-12">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-4 mb-4">
                     <hr className="flex-grow border-blue-300 border-dashed" />
                    <h2 className="text-2xl font-heading text-blue-200 flex items-center gap-2" style={{textShadow: '2px 2px 4px #87cefa'}}>
                        <MessageIcon /> Message Board
                    </h2>
                     <hr className="flex-grow border-blue-300 border-dashed" />
                </div>
                
                {/* Post Message Form */}
                <form onSubmit={handleSubmit} className="mb-8 cute-card p-4 space-y-3">
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            placeholder="Your name"
                            className="w-1/3 bg-transparent focus:outline-none placeholder-gray-400 cute-input"
                            disabled={isSubmitting}
                        />
                         <input
                            type="text"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Leave a note for everyone..."
                            className="flex-grow bg-transparent focus:outline-none placeholder-gray-400 cute-input"
                            disabled={isSubmitting}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full cute-button cute-button-blue flex items-center justify-center gap-2"
                        disabled={!content.trim() || isSubmitting}
                    >
                        {isSubmitting ? <Spinner /> : <SendIcon />}
                        Post Message
                    </button>
                </form>

                {/* Message List */}
                <div className="space-y-4">
                    {isLoading && !messages && <div className="text-center text-gray-400"><Spinner /></div>}
                    {error && <div className="text-center text-red-400">Error loading messages.</div>}
                    
                    {messages && messages.map(msg => (
                        <div key={msg.id} className="cute-card p-4 animate-fade-in flex justify-between items-start gap-4">
                           <div>
                                <p className="text-white whitespace-pre-wrap break-words">{msg.content}</p>
                                <p className="text-sm text-pink-300 mt-2">
                                    &mdash; {msg.author} <span className="text-gray-400">({timeAgo(msg.createdAt)})</span>
                                </p>
                           </div>
                           <button
                                onClick={() => handleDelete(msg.id)}
                                disabled={isSubmitting}
                                className="icon-button text-red-400 disabled:opacity-50 flex-shrink-0"
                                title="Delete message"
                            >
                                <TrashIcon />
                            </button>
                        </div>
                    ))}
                     {messages?.length === 0 && !isLoading && (
                        <div className="text-center text-gray-400 cute-card p-8">
                            <p>The message board is empty.</p>
                             <p>Be the first to leave a note!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageBoard;
