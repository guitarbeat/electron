import React, { useEffect, useRef, useState } from "react";
import { Spinner } from "@/common/Icons";
import { MAX_MESSAGE_LENGTH, getErrorMessage } from "@/utils";
import type { User } from "@/shared/types";
import { spacing } from "@/theme/tokens";
import { shouldSubmitMessageOnKeyDown } from "./lib/messageKeyboard";

interface MessageInputProps {
  currentUser: User | null;
  isSubmitting: boolean;
  onSend: (content: string) => Promise<void>;
}

const MessageInput: React.FC<MessageInputProps> = ({
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
        metaKey: event.metaKey,
        ctrlKey: event.ctrlKey,
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
        background: "#f5f5f5",
        padding: `${spacing.sm} ${spacing.md}`,
        borderTop: "0.5px solid rgba(0, 0, 0, 0.1)",
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
              borderRadius: "50%",
              backgroundColor: "transparent",
              color: "#8e8e93",
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
                backgroundColor: "#ffffff",
                border: "1px solid #e5e5ea",
                borderRadius: "18px",
                color: "#000000",
                fontSize: "17px",
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
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
                fontSize: "12px",
                color: "#8e8e93",
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
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
                      ? "#ff3b30"
                      : "#8e8e93",
                  pointerEvents: "none",
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
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
              borderRadius: "50%",
              backgroundColor:
                showSendButton && currentUser ? "#007aff" : "transparent",
              border: "none",
              color: showSendButton && currentUser ? "#ffffff" : "#8e8e93",
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
                style={{ width: "18px", height: "18px", color: "#ffffff" }}
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
                  stroke={showSendButton && currentUser ? "#ffffff" : "#8e8e93"}
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
              color: "#ff3b30",
              fontSize: "13px",
              padding: `${spacing.xs} ${spacing.sm}`,
              backgroundColor: "rgba(255, 59, 48, 0.1)",
              borderRadius: "8px",
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
            }}
          >
            {submitError}
          </div>
        ) : null}
      </form>
    </div>
  );
};

export default MessageInput;
