import React, { useCallback } from "react";
import {
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
  isChatCard?: boolean;
  "data-chat-card"?: boolean;
}

export const ChatDriftCard: React.FC<ChatDriftCardProps> = ({
  onOpenChat,
  className = "",
}) => {
  const { messages } = useMessages();

  const handleOpen = useCallback(
    (e?: React.MouseEvent | React.KeyboardEvent) => {
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

  const messageCount = messages?.length || 0;

  return (
    <div
      className={`movie-item-container promo-drift-card-wrap chat-drift-card-container ${className}`.trim()}
      data-chat-card="true"
      data-height-ratio="1"
      onClick={handleOpen}
      role="button"
      tabIndex={0}
      aria-label="Open movie chat experience"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleOpen(e);
        }
      }}
      style={{ cursor: "pointer" }}
    >
      <Card
        variant="default"
        className="movie-item-card promo-drift-card chat-drift-card"
        onClick={handleOpen}
        style={{
          padding: 0,
          overflow: "hidden",
          cursor: "pointer",
        }}
      >
        <MediaCardPosterWrap className="movie-item-poster-wrap">
          <div className="promo-drift-card__body promo-drift-card__body--chat">
            <div className="promo-drift-card__icon-wrap">
              <span className="promo-drift-card__emoji" aria-hidden="true">
                💬
              </span>
            </div>
            <div className="promo-drift-card__text-block">
              <span className="promo-drift-card__badge">
                {messageCount > 0 ? `${messageCount} msgs` : "Chat"}
              </span>
              <div className="promo-drift-card__title">Movie Chat</div>
              <div className="promo-drift-card__hint">Room banter & picks</div>
            </div>
          </div>

          <button
            type="button"
            className="movie-item-details-hit-area"
            onClick={handleOpen}
            aria-label="Open movie chat discussion board"
          />
        </MediaCardPosterWrap>
      </Card>
    </div>
  );
};

export default ChatDriftCard;
