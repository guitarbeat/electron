import React from "react";
import {
  MediaCardActions,
  MediaCardBadge,
  MediaCardCover,
  MediaCardInfo,
  MediaCardOverlay,
  MediaCardPosterWrap,
  MediaCardRatingBadge,
  MediaCardStatusBadge,
  MediaCardSubtext,
  MediaCardSuccessBadge,
  MediaCardTitle,
  MediaCardTypeBadge,
} from "./MediaCardParts";

interface MediaCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "visited" | "highlighted" | "watched";
  hover?: boolean;
}

const MediaCard: React.FC<MediaCardProps> = ({
  children,
  variant = "default",
  hover = true,
  className = "",
  ...props
}) => {
  const classes = [
    "media-card",
    variant !== "default" && `media-card--${variant}`,
    hover && "media-card--hover",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default MediaCard;
export {
  MediaCardPosterWrap,
  MediaCardCover,
  MediaCardOverlay,
  MediaCardTitle,
  MediaCardBadge,
  MediaCardActions,
  MediaCardInfo,
  MediaCardSubtext,
  MediaCardRatingBadge,
  MediaCardSuccessBadge,
  MediaCardStatusBadge,
  MediaCardTypeBadge,
};
