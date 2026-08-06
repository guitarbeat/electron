import React, { useState } from "react";
import { useToast } from "@/app/useProviders";
import type { Message } from "@/shared/types";
import { colors, radius, spacing, typography } from "@/theme/tokens";
import ConfirmDialog from "@/ui/ConfirmDialog";
import SyncBanner from "@/ui/SyncBanner";
import { useMessages } from "@/hooks/useMessages";
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";

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
      <div
        className="message-board"
        style={{
          maxWidth: "720px",
          width: "100%",
          margin: "0 auto",
          padding: spacing.md,
          height: "min(680px, calc(100dvh - 9rem))",
          minHeight: "min(520px, calc(100dvh - 9rem))",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          className="message-board__surface"
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            overflow: "hidden",
            boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
            fontFamily: typography.fontFamily.body.join(", "),
          }}
        >
          <div
            style={{
              background: colors.surface0,
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              padding: `${spacing.sm} ${spacing.md}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              minHeight: "52px",
              borderBottom: `0.5px solid ${colors.borderSecondary}`,
              gap: spacing.sm,
            }}
          >
            <div style={{ minWidth: "52px" }} />
            <div style={{ textAlign: "center", flex: 1 }}>
              <div
                style={{
                  fontFamily: typography.fontFamily.heading.join(", "),
                  fontWeight: typography.fontWeight.semibold,
                  fontSize: typography.fontSize.base,
                  color: colors.textPrimary,
                  letterSpacing: "-0.01em",
                }}
              >
                Messages
              </div>
              <div
                style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.textTertiary,
                }}
              >
                {currentUser ?? "Guest mode"}
              </div>
            </div>
            <div
              style={{
                minWidth: "52px",
                textAlign: "right",
                fontSize: typography.fontSize.sm,
                color: colors.textTertiary,
              }}
            >
              {messages.length} total
            </div>
          </div>

          <MessageList
            messages={messages}
            currentUser={currentUser}
            isLoading={isLoading}
            isSubmitting={isSubmitting}
            error={error}
            onDelete={setMessageToDelete}
          />
          {isDegraded ? (
            <div style={{ padding: `${spacing.sm} ${spacing.md}` }}>
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
          ) : null}
          {currentUser ? (
            <MessageInput
              currentUser={currentUser}
              isSubmitting={isSubmitting}
              onSend={handleSend}
            />
          ) : (
            <div
              style={{
                background: colors.surface2,
                padding: "10px 20px",
                borderTop: `0.5px solid ${colors.borderSecondary}`,
                paddingBottom: "max(env(safe-area-inset-bottom), 12px)",
                textAlign: "center",
                fontSize: typography.fontSize.sm,
                color: colors.textTertiary,
                fontFamily: typography.fontFamily.body.join(", "),
              }}
            >
              Select a profile above to send a message
            </div>
          )}
        </div>
      </div>

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
