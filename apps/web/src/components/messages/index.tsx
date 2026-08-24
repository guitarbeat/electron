
/* eslint-disable react-refresh/only-export-components */
export const IOS_BLUE = "#007aff";
export const IOS_GRAY = "#e5e5ea";
export const IOS_TIMESTAMP = "#8e8e93";

const AARON_BUBBLE_COLOR = "#c07842";
export const ELECTRA_BUBBLE_COLOR = "#5e8a78";

export const getBubbleColor = (author: string): string => {
  if (author === "Aaron") return AARON_BUBBLE_COLOR;
  if (author === "Electra") return ELECTRA_BUBBLE_COLOR;
  return IOS_GRAY;
};

export const getBubbleTextColor = (author: string): string => {
  if (author === "Aaron" || author === "Electra") return "#ffffff";
  return "#000000";
};

export const isMessageFromCurrentUser = (
  message: Message,
  currentUser: User | null,
): boolean => Boolean(currentUser) && message.author === currentUser;

export interface MessageKeydownState {
  key: string;
  shiftKey: boolean;
  metaKey?: boolean;
  ctrlKey?: boolean;
  isComposing?: boolean;
}

export const shouldSubmitMessageOnKeyDown = ({
  key,
  shiftKey,
  isComposing = false,
}: MessageKeydownState): boolean =>
  !isComposing && key === "Enter" && !shiftKey;

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Message, User } from "@/shared/types";
import { formatMessageTimestamp, MAX_MESSAGE_LENGTH, getErrorMessage } from "@/utils";

import { useMessages } from "@/hooks";
import { TrashIcon, Spinner } from "@/common/Icons";
import { SyncBanner, ConfirmDialog } from "@/components/ui";
import { colors, radius, spacing, typography } from "@/theme/tokens";
import { useToast } from "@/app/providerContexts";

interface MessageBubbleProps {
  message: Message;
  currentUser: User | null;
  showSenderName: boolean;
  canDelete: boolean;
  onDelete: (message: Message) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  currentUser,
  showSenderName,
  canDelete,
  onDelete,
}) => {
  const isCurrentUser = isMessageFromCurrentUser(message, currentUser);
  const timestamp = formatMessageTimestamp(message.createdAt);
  const bubbleColor = getBubbleColor(message.author);
  const bubbleTextColor = getBubbleTextColor(message.author);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isCurrentUser ? "flex-end" : "flex-start",
        marginBottom: showSenderName ? "8px" : "2px",
        maxWidth: "78%",
        marginLeft: isCurrentUser ? "auto" : 0,
        marginRight: isCurrentUser ? 0 : "auto",
      }}
    >
      {showSenderName ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: spacing.xs,
            marginBottom: "4px",
            paddingLeft: isCurrentUser ? 0 : "12px",
            paddingRight: isCurrentUser ? "12px" : 0,
          }}
        >
          {!isCurrentUser ? (
            <span
              style={{
                fontSize: "12px",
                fontWeight: typography.fontWeight.semibold,
                color: IOS_TIMESTAMP,
                fontFamily: typography.fontFamily.heading.join(", "),
              }}
            >
              {message.author}
            </span>
          ) : null}
          {timestamp ? (
            <span
              style={{
                fontSize: "11px",
                color: IOS_TIMESTAMP,
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
              }}
            >
              {timestamp}
            </span>
          ) : null}
        </div>
      ) : null}

      <div
        className={`msg-bubble ${isCurrentUser ? "msg-bubble-me" : "msg-bubble-them"}`}
        aria-label={`Message from ${message.author}`}
        style={{ ["--bubble-color" as string]: bubbleColor }}
      >
        <p
          style={{
            color: bubbleTextColor,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            overflowWrap: "break-word",
            margin: 0,
            lineHeight: 1.25,
            fontSize: "17px",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
          }}
        >
          {message.content}
        </p>

        {canDelete ? (
          <div
            className={"msg-actions"}
            style={{
              position: "absolute",
              top: "-8px",
              [isCurrentUser ? "left" : "right"]: "-8px",
            }}
          >
            <button
              type="button"
              onClick={() => onDelete(message)}
              aria-label={`Delete message from ${message.author}`}
              title={`Delete message from ${message.author}`}
              style={{
                width: "24px",
                height: "24px",
                padding: 0,
                border: "none",
                borderRadius: "999px",
                background: "#ff3b30",
                color: "#ffffff",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}
            >
              <TrashIcon style={{ width: "12px", height: "12px" }} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};




/* -------------------------------------------------------------------------- */
/* Sub-component: MessageBoardHeader                                          */
/* -------------------------------------------------------------------------- */

interface MessageBoardHeaderProps {
  currentUser: User | null;
  messageCount: number;
}

export const MessageBoardHeader: React.FC<MessageBoardHeaderProps> = ({
  currentUser,
  messageCount,
}) => (
  <header className={"msg-board-header"}>
    <div className={"msg-board-side"} aria-hidden="true" />
    
    <div className={"msg-board-center"}>
      <h2 className={"msg-board-title"}>Messages</h2>
      <div className={"msg-board-user-badge"}>
        <span
          className={`msg-board-user-dot${!currentUser ? ` msg-board-user-dot-guest` : ""}`}
          aria-hidden="true"
        />
        <span>{currentUser ? currentUser : "Guest mode"}</span>
      </div>
    </div>

    <div className="msg-board-side msg-board-side-right">
      <span className={"msg-board-count-pill"} aria-label={`${messageCount} total messages`}>
        {messageCount} total
      </span>
    </div>
  </header>
);

/* -------------------------------------------------------------------------- */
/* Sub-component: MessageBoardGuestFooter                                     */
/* -------------------------------------------------------------------------- */

export const MessageBoardGuestFooter: React.FC = () => (
  <footer className={"msg-board-guest-prompt"} role="status">
    <svg
      className={"msg-board-guest-icon"}
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
/* Main Component_MessageBoard: MessageBoard                                               */
/* -------------------------------------------------------------------------- */

export const MessageBoard: React.FC = () => {
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
        className={"msg-board"}
        aria-label="Shared Message Board"
      >
        <div className={"msg-board-surface"}>
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
            <div className={"msg-board-banner-wrap"}>
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




interface MessageListProps {
  messages: Message[];
  currentUser: User | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: Error | null;
  onDelete: (message: Message) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUser,
  isLoading,
  isSubmitting,
  error,
  onDelete,
}) => {
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const previousLengthRef = useRef(0);
  const scrollTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const checkScrollPosition = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollToBottom(!isNearBottom);
    };

    container.addEventListener("scroll", checkScrollPosition);
    checkScrollPosition();

    return () => container.removeEventListener("scroll", checkScrollPosition);
  }, [messages]);

  useEffect(() => {
    if (messages.length > previousLengthRef.current) {
      const container = containerRef.current;
      if (container) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;

        if (isNearBottom) {
          if (scrollTimeoutRef.current !== null) {
            window.clearTimeout(scrollTimeoutRef.current);
          }
          scrollTimeoutRef.current = window.setTimeout(() => {
            scrollTimeoutRef.current = null;
            const el = containerRef.current;
            if (el) {
              el.scrollTo({
                top: el.scrollHeight,
                behavior: "smooth",
              });
            }
          }, 50);
        }
      }
    }

    previousLengthRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const scrollToBottom = () => {
    const container = containerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
      return;
    }

    endRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  };

  const groupedMessages = useMemo(
    () =>
      messages.map((message, index) => {
        const previous = index > 0 ? messages[index - 1] : null;
        const showSenderName = !previous || previous.author !== message.author;
        return { message, showSenderName };
      }),
    [messages],
  );

  return (
    <div
      style={{
        position: "relative",
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: spacing.md,
          minHeight: 0,
          backgroundColor: "#ffffff",
          WebkitOverflowScrolling: "touch",
        }}
        className="ios-message-list"
      >
        <style>{`
          .ios-message-list {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .ios-message-list::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            opacity: isSubmitting ? 0.72 : 1,
            pointerEvents: isSubmitting ? "none" : "auto",
            transition: "opacity 0.2s ease",
            minHeight: "100%",
          }}
          role="log"
          aria-label="Messages"
          aria-live="polite"
          aria-atomic="false"
        >
          {isLoading && messages.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: spacing.xs,
              }}
            >
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  style={{
                    padding: `${spacing.sm} ${spacing.md}`,
                    height: "40px",
                    background: "#e5e5ea",
                    borderRadius: "18px",
                    opacity: 0.45,
                    maxWidth: "60%",
                    marginLeft: item % 2 === 0 ? "auto" : 0,
                  }}
                />
              ))}
            </div>
          ) : null}

          {error ? (
            <div
              role="alert"
              style={{
                textAlign: "center",
                padding: spacing.lg,
                color: "#ff3b30",
                backgroundColor: "rgba(255, 59, 48, 0.1)",
                borderRadius: "12px",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
                }}
              >
                Couldn&apos;t load messages right now. Try again in a few
                seconds.
              </p>
            </div>
          ) : null}

          {!error && messages.length === 0 && !isLoading ? (
            <div
              role="status"
              style={{
                textAlign: "center",
                padding: spacing["2xl"],
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  backgroundColor: "#007aff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: spacing.md,
                  color: "#ffffff",
                  fontSize: "1.6rem",
                }}
              >
                <span aria-hidden="true">💬</span>
              </div>
              <p
                style={{
                  fontFamily: typography.fontFamily.heading.join(", "),
                  fontSize: typography.fontSize.lg,
                  margin: 0,
                  color: "#000000",
                }}
              >
                No messages yet
              </p>
            </div>
          ) : null}

          {groupedMessages.map(({ message, showSenderName }) => (
            <MessageBubble
              key={message.id}
              message={message}
              currentUser={currentUser}
              showSenderName={showSenderName}
              canDelete={Boolean(currentUser && message.author === currentUser)}
              onDelete={onDelete}
            />
          ))}
          <div ref={endRef} aria-hidden="true" />
        </div>
      </div>

      {showScrollToBottom ? (
        <div
          style={{
            position: "absolute",
            bottom: spacing.md,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            pointerEvents: "auto",
          }}
        >
          <button
            type="button"
            onClick={scrollToBottom}
            aria-label="Scroll to latest messages"
            style={{
              width: "44px",
              height: "44px",
              border: "none",
              borderRadius: "999px",
              background: "rgba(0, 0, 0, 0.55)",
              color: "#ffffff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
            }}
          >
            <span
              aria-hidden="true"
              style={{ fontSize: "20px", lineHeight: 1 }}
            >
              ↓
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
};




interface MessageInputProps {
  currentUser: User | null;
  isSubmitting: boolean;
  onSend: (content: string) => Promise<void>;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  currentUser,
  isSubmitting,
  onSend,
}) => {
  const [content, setContent] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    requestAnimationFrame(() => {
      textarea.style.height = "auto";
      const nextHeight = Math.min(textarea.scrollHeight, 100);
      textarea.style.height = `${Math.max(nextHeight, 36)}px`;
    });
  }, [content]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    if (!currentUser) {
      setSubmitError("Choose Aaron or Electra to send a message.");
      return;
    }

    if (!content.trim()) {
      setSubmitError("Please enter a message.");
      return;
    }

    if (content.length > MAX_MESSAGE_LENGTH) {
      setSubmitError(
        `Message is too long (max ${MAX_MESSAGE_LENGTH} characters).`,
      );
      return;
    }

    try {
      await onSend(content);
      setContent("");
      window.setTimeout(() => textareaRef.current?.focus(), 250);
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Failed to send message."));
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      shouldSubmitMessageOnKeyDown({
        key: event.key,
        shiftKey: event.shiftKey,
        isComposing: event.nativeEvent.isComposing,
      })
    ) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  const showSendButton = content.trim().length > 0;

  return (
    <div
      style={{
        background: colors.surface2,
        padding: `${spacing.sm} ${spacing.md}`,
        borderTop: `0.5px solid ${colors.borderSecondary}`,
        paddingBottom: "max(env(safe-area-inset-bottom), 12px)",
      }}
    >
      <form
        onSubmit={handleSubmit}
        aria-label="Send a new message"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: spacing.xs,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: spacing.sm,
            alignItems: "flex-end",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: "44px",
              height: "44px",
              borderRadius: radius.full,
              backgroundColor: "transparent",
              color: colors.textTertiary,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>+</span>
          </span>

          <div style={{ flex: 1, position: "relative" }}>
            <label htmlFor="message-content" className="sr-only">
              Message content
            </label>
            <textarea
              id="message-content"
              ref={textareaRef}
              value={content}
              onChange={(event) => {
                setContent(event.target.value.slice(0, MAX_MESSAGE_LENGTH));
                setSubmitError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Message"
              rows={1}
              maxLength={MAX_MESSAGE_LENGTH}
              disabled={isSubmitting || !currentUser}
              aria-invalid={submitError ? "true" : "false"}
              style={{
                width: "100%",
                padding: "8px 40px 8px 16px",
                backgroundColor: colors.surface,
                border: `1px solid ${colors.borderSubtle}`,
                borderRadius: radius.lg,
                color: colors.textPrimary,
                fontSize: typography.fontSize.base,
                fontFamily: typography.fontFamily.body.join(", "),
                lineHeight: 1.25,
                resize: "none",
                minHeight: "44px",
                maxHeight: "100px",
                outline: "none",
                transition: "border-color 0.2s ease",
                overflow: "hidden",
              }}
            />

            <div
              style={{
                marginTop: "6px",
                fontSize: typography.fontSize.xs,
                color: colors.textTertiary,
                fontFamily: typography.fontFamily.body.join(", "),
              }}
            >
              Enter to send. Shift+Enter for a new line.
            </div>

            {content.length > MAX_MESSAGE_LENGTH * 0.8 ? (
              <div
                style={{
                  position: "absolute",
                  bottom: "8px",
                  right: "12px",
                  fontSize: "11px",
                  color:
                    content.length >= MAX_MESSAGE_LENGTH
                      ? colors.error
                      : colors.textTertiary,
                  pointerEvents: "none",
                  fontFamily: typography.fontFamily.body.join(", "),
                }}
              >
                {MAX_MESSAGE_LENGTH - content.length}
              </div>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={
              !currentUser ||
              !content.trim() ||
              isSubmitting ||
              content.length > MAX_MESSAGE_LENGTH
            }
            aria-label="Send message"
            style={{
              width: "44px",
              height: "44px",
              borderRadius: radius.full,
              backgroundColor:
                showSendButton && currentUser ? colors.accent : "transparent",
              border: "none",
              color: showSendButton && currentUser ? colors.textPrimary : colors.textTertiary,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor:
                currentUser &&
                content.trim() &&
                content.length <= MAX_MESSAGE_LENGTH &&
                !isSubmitting
                  ? "pointer"
                  : "default",
              transition: "all 0.2s ease",
              flexShrink: 0,
              opacity: showSendButton && currentUser ? 1 : 0.5,
              transform:
                showSendButton && currentUser ? "scale(1)" : "scale(0.9)",
            }}
          >
            {isSubmitting ? (
              <Spinner
                style={{ width: "18px", height: "18px", color: colors.textPrimary }}
              />
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                  stroke={showSendButton && currentUser ? colors.textPrimary : colors.textTertiary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>

        {submitError ? (
          <div
            role="alert"
            aria-live="polite"
            style={{
              color: colors.error,
              fontSize: typography.fontSize.sm,
              padding: `${spacing.xs} ${spacing.sm}`,
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              borderRadius: radius.sm,
              fontFamily: typography.fontFamily.body.join(", "),
            }}
          >
            {submitError}
          </div>
        ) : null}
      </form>
    </div>
  );
};


