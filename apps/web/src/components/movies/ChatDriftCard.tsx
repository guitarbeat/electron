import React, { useCallback, useMemo } from "react";
import {
  CardTiltShell,
  CardTiltSheen,
  Card,
  MediaCardPosterWrap,
} from "@/components/ui";
import { useMessages } from "@/hooks";
import type { User } from "@/shared/types";

export interface ChatDriftCardProps {
  currentUser?: User | null;
  isCompact?: boolean;
  onOpenChat?: () => void;
  className?: string;
}

export const ChatDriftCard: React.FC<ChatDriftCardProps> = ({
  isCompact = false,
  onOpenChat,
  className = "",
}) => {
  const { messages } = useMessages();

  const handleOpen = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
      }
      if (onOpenChat) {
        onOpenChat();
      } else if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("open-chat-experience"));
      }
    },
    [onOpenChat],
  );

  const accentColor = "#06b6d4"; // Vibrant cyan/teal neon accent
  const messageCount = messages?.length || 0;
  const latestMessage = useMemo(() => {
    if (!messages || messages.length === 0) return null;
    return messages[messages.length - 1];
  }, [messages]);

  return (
    <div
      className={`movie-item-container chat-drift-card-container ${className}`.trim()}
      data-chat-card="true"
      data-height-ratio="1"
    >
      <CardTiltShell disabled={isCompact}>
        <Card
          variant="default"
          className="movie-item-card chroma-card chat-drift-card"
          style={{
            padding: 0,
            overflow: "hidden",
            borderColor: `${accentColor}55`,
          }}
        >
          <CardTiltSheen />
          <MediaCardPosterWrap className="movie-item-poster-wrap">
            {/* Background art poster for chat */}
            <div
              className="chat-drift-card__art"
              style={{
                backgroundImage: "url(/movie-chat-cover.svg)",
              }}
            />

            {/* Cinematic gradient overlay */}
            <div className="chat-drift-card__vignette" />

            {/* Dynamic Content Overlay */}
            <div className="chat-drift-card__content">
              <div className="chat-drift-card__top-badge">
                <span
                  className="chat-drift-card__pill"
                  style={{
                    borderColor: `${accentColor}88`,
                    color: "#ffffff",
                    backgroundColor: `${accentColor}33`,
                  }}
                >
                  💬 CHAT
                </span>
                <span className="chat-drift-card__live-pill">
                  {messageCount > 0 ? `${messageCount}` : "LIVE"}
                </span>
              </div>

              <div className="chat-drift-card__bottom-info">
                <div className="chat-drift-card__title">
                  Movie Chat &amp; Lobby
                </div>
                <div className="chat-drift-card__subtitle">
                  {latestMessage
                    ? `${latestMessage.author}: "${latestMessage.content.slice(0, 28)}${latestMessage.content.length > 28 ? "…" : ""}"`
                    : "Share hot takes, picks & banter"}
                </div>

                <div
                  className="chat-drift-card__cta"
                  style={{
                    backgroundColor: `${accentColor}28`,
                    borderColor: `${accentColor}77`,
                  }}
                >
                  <span
                    className="chat-drift-card__cta-dot"
                    style={{ backgroundColor: accentColor }}
                  />
                  <span>Open Chat</span>
                </div>
              </div>
            </div>

            {/* Click Hit Area */}
            <button
              type="button"
              className="movie-item-details-hit-area"
              onClick={handleOpen}
              aria-label="Open movie chat discussion board"
            />
          </MediaCardPosterWrap>
        </Card>
      </CardTiltShell>
    </div>
  );
};

export default ChatDriftCard;
