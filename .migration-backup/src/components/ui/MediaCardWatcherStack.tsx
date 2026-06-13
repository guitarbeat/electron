import React from 'react';
import WatcherBadge from '@/common/WatcherBadge';

interface MediaCardWatcherStackProps {
  watchers: string[];
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export const MediaCardWatcherStack: React.FC<MediaCardWatcherStackProps> = ({
  watchers,
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  if (watchers.length === 0) return null;

  return (
    <div className={`media-card-watchers-stack ${className}`.trim()}>
      {watchers.map((user) => (
        <WatcherBadge
          key={user}
          user={user}
          size={size}
          showLabel={showLabel}
          className="media-card-watcher-badge"
        />
      ))}
    </div>
  );
};

export default MediaCardWatcherStack;
