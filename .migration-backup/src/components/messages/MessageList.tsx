import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Message, User } from "@/shared/types";
import { spacing, typography } from "@/theme/tokens";
import MessageBubble from "./MessageBubble";

interface MessageListProps {
  messages: Message[];
  currentUser: User | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: Error | null;
  onDelete: (message: Message) => void;
}

const MessageList: React.FC<MessageListProps> = ({
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

export default MessageList;
