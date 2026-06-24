import React from "react";
import { cn } from "@/components/ui/lib/utils";
import { USER_PHOTOS } from "./userPhotos.ts";

interface WatcherBadgePhotoProps {
  user: string;
}

const WatcherBadgePhoto: React.FC<WatcherBadgePhotoProps> = ({ user }) => {
  const [index, setIndex] = React.useState(0);
  const [hasImageError, setHasImageError] = React.useState(false);
  const sources = USER_PHOTOS[user] ?? [];

  React.useEffect(() => {
    setIndex(0);
    setHasImageError(false);
  }, [user]);

  const handleError = () => {
    if (index < sources.length - 1) {
      setIndex((current) => current + 1);
      return;
    }

    setHasImageError(true);
  };

  if (hasImageError || sources.length === 0 || index >= sources.length) {
    return (
      <span className="watcher-badge__avatar-initial">
        {user.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={sources[index]}
      alt={user}
      className="watcher-badge__avatar-photo"
      onError={handleError}
      draggable={false}
    />
  );
};

export interface WatcherBadgeProps {
  user: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "text";
  showLabel?: boolean;
  className?: string;
}

export const WatcherBadge: React.FC<WatcherBadgeProps> = ({
  user,
  size = "md",
  variant = "default",
  showLabel = false,
  className = "",
}) => {
  const badgeClassName = cn(
    "watcher-badge",
    `watcher-badge--${variant}`,
    `watcher-badge--${size}`,
    `watcher-badge--${user.toLowerCase()}`,
    className,
  );

  return (
    <div className={badgeClassName}>
      <div className="watcher-badge__avatar">
        <WatcherBadgePhoto user={user} />
      </div>
      {showLabel ? <span className="watcher-badge__label">{user}</span> : null}
    </div>
  );
};

export default WatcherBadge;
