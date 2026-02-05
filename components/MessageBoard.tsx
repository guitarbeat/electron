import React from 'react';
import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useChatLogic } from '../hooks/useChatLogic';
import ChatWindow from './message-board/ChatWindow';
import MessageList from './message-board/MessageList';
import MessageInput from './message-board/MessageInput';
import Toast from './ui/Toast';
import { spacing } from '../design-system/tokens';

const MessageBoard: React.FC = () => {
  const { currentUser } = useUser();
  const { messages, isLoading, error, isSubmitting, handleSend, handleDelete, handleReaction, toast } =
    useChatLogic();
  const [isEditMode, setIsEditMode] = useState(false);

  return (
    <div
      style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: spacing.md,
        height: '500px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        marginBottom: spacing.xl,
      }}
      className="message-board-container"
    >
      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} />}

      <ChatWindow isEditMode={isEditMode} onToggleEditMode={() => setIsEditMode(!isEditMode)}>
        <MessageList
          messages={messages}
          isLoading={isLoading}
          error={error}
          currentUser={currentUser}
          onDelete={handleDelete}
          onReaction={handleReaction}
          isSubmitting={isSubmitting}
          isEditMode={isEditMode}
        />
        <MessageInput
          key={currentUser || 'anonymous'}
          currentUser={currentUser}
          isSubmitting={isSubmitting}
          onSend={handleSend}
          onError={(msg) => console.error(msg)}
        />
      </ChatWindow>
    </div>
  );
};

export default MessageBoard;
