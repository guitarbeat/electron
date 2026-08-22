import React, { useState } from "react";
import { useToast } from "@/app/useProviders";
import type { Message, User } from "@/shared/types";
import ConfirmDialog from "@/ui/ConfirmDialog";
import SyncBanner from "@/ui/SyncBanner";
import { useMessages } from "@/hooks/useMessages";
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";

/* -------------------------------------------------------------------------- */
/* Sub-component: MessageBoardHeader                                          */
/* -------------------------------------------------------------------------- */

interface MessageBoardHeaderProps {
  currentUser: User | null;
  messageCount: number;
}

const MessageBoardHeader: React.FC<MessageBoardHeaderProps> = ({
  currentUser,
  messageCount,
}) => (
  <header className="message-board__header">
    <div className="message-board__header-side" aria-hidden="true" />
    
    <div className="message-board__header-center">
      <h2 className="message-board__title">Messages</h2>
      <div className="message-board__user-badge">
        <span
          className={`message-board__user-dot${!currentUser ? " message-board__user-dot--guest" : ""}`}
          aria-hidden="true"
        />
        <span>{currentUser ? currentUser : "Guest mode"}</span>
      </div>
    </div>

    <div className="message-board__header-side message-board__header-side--right">
      <span className="message-board__count-pill" aria-label={`${messageCount} total messages`}>
        {messageCount} total
      </span>
    </div>
  </header>
);

/* -------------------------------------------------------------------------- */
/* Sub-component: MessageBoardGuestFooter                                     */
/* -------------------------------------------------------------------------- */

const MessageBoardGuestFooter: React.FC = () => (
  <footer className="message-board__guest-prompt" role="status">
    <svg
      className="message-board__guest-prompt-icon"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
    <span>Select a profile above to join the conversation</span>
  </footer>
);

/* -------------------------------------------------------------------------- */
/* Main Component: MessageBoard                                               */
/* -------------------------------------------------------------------------- */

const MessageBoard: React.FC = () => {
  const { showToast } = useToast();
  const {
    currentUser,
    messages,
    error,
    isLoading,
    isSubmitting,
    isDegraded,
    isSyncBlocked,
    syncWarning,
    addMessage,
    deleteMessage,
    retrySync,
  } = useMessages();
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);

  const handleSend = async (content: string) => {
    try {
      await addMessage(content);
      showToast({
        message: "Message sent.",
        type: "success",
        duration: 2500,
      });
    } catch (sendError) {
      showToast({
        message:
          sendError instanceof Error
            ? sendError.message
            : "Failed to send message.",
        type: "error",
        duration: 3000,
      });
    }
  };

  const confirmDelete = async () => {
    if (!messageToDelete) {
      return;
    }

    try {
      await deleteMessage(messageToDelete);
      showToast({
        message: "Message deleted.",
        type: "info",
        duration: 2500,
      });
      setMessageToDelete(null);
    } catch (deleteError) {
      showToast({
        message:
          deleteError instanceof Error
            ? deleteError.message
            : "Failed to delete message.",
        type: "error",
        duration: 3000,
      });
    }
  };

  return (
    <>
      <section
        className="message-board"
        aria-label="Shared Message Board"
      >
        <div className="message-board__surface">
          <MessageBoardHeader
            currentUser={currentUser}
            messageCount={messages.length}
          />

          <MessageList
            messages={messages}
            currentUser={currentUser}
            isLoading={isLoading}
            isSubmitting={isSubmitting}
            error={error}
            onDelete={setMessageToDelete}
          />

          {isDegraded && (
            <div className="message-board__banner-wrap">
              <SyncBanner
                isBlocked={isSyncBlocked}
                onRetry={retrySync}
                label={
                  isSyncBlocked
                    ? undefined
                    : syncWarning ||
                      "Messages are being kept locally until shared sync recovers."
                }
              />
            </div>
          )}

          {currentUser ? (
            <MessageInput
              currentUser={currentUser}
              isSubmitting={isSubmitting}
              onSend={handleSend}
            />
          ) : (
            <MessageBoardGuestFooter />
          )}
        </div>
      </section>

      <ConfirmDialog
        isOpen={Boolean(messageToDelete)}
        title="Delete Message"
        message={`Delete this message from ${messageToDelete?.author || "Unknown"}?`}
        confirmText="Delete message"
        onConfirm={confirmDelete}
        onCancel={() => setMessageToDelete(null)}
      />
    </>
  );
};

export default MessageBoard;
