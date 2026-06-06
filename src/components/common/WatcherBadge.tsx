
import React from 'react';
import { USER_PHOTOS } from "./WatcherBadgeConstants.ts";

const USER_PHOTOS: Record<string, string[]> = {
  Aaron: [
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSa2Qa_ao3GRvb5R5TyT7lET-s_0iqlHUxWMg&s',
    'https://i.pinimg.com/236x/3e/5b/8d/3e5b8d5105f7570eac355fea06998ba0.jpg',
    'https://preview.redd.it/rbdzmbhsxbw11.png?width=315&format=png&auto=webp&s=6282a8216d66d51684af9efc992b8b423463c941',
  ],
  Electra: [
    'https://i.redd.it/vkmos70wqw641.jpg',
    'https://i.pinimg.com/236x/3e/5b/8d/3e5b8d5105f7570eac355fea06998ba0.jpg',
    'https://preview.redd.it/rbdzmbhsxbw11.png?width=315&format=png&auto=webp&s=6282a8216d66d51684af9efc992b8b423463c941',
  ],
};

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
  const badgeClassName = [
    "watcher-badge",
    `watcher-badge--${variant}`,
    `watcher-badge--${size}`,
    `watcher-badge--${user.toLowerCase()}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

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
