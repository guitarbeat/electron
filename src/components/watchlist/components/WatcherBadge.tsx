import React from 'react';

interface User {
  id: string;
  name: string;
  avatar?: string;
}

interface WatcherBadgeProps {
  user: string | User;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'text';
  showLabel?: boolean;
  className?: string;
}

const WatcherBadge: React.FC<WatcherBadgeProps> = ({
  user,
  size = 'md',
  variant = 'default',
  showLabel = false,
  className = ""
}) => {
  // Convert string user to user object if needed
  const userObj: User = typeof user === 'string'
    ? { id: user, name: user, avatar: undefined }
    : user;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  const baseClasses = "inline-flex items-center rounded-full font-medium";

  if (variant === 'text') {
    return (
      <div className={`watcher-badge ${className}`}>
        <div className="flex items-center space-x-2">
          {userObj.avatar ? (
            <img
              src={userObj.avatar}
              alt={userObj.name}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-700">
              {userObj.name.charAt(0).toUpperCase()}
            </div>
          )}
          {showLabel && (
            <span className="text-sm text-gray-700">{userObj.name}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`watcher-badge ${baseClasses} ${sizeClasses[size]} ${className}`}>
      <div className="flex items-center space-x-2">
        {userObj.avatar ? (
          <img
            src={userObj.avatar}
            alt={userObj.name}
            className="w-6 h-6 rounded-full"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-700">
            {userObj.name.charAt(0).toUpperCase()}
          </div>
        )}
        {showLabel && (
          <span className="text-sm text-gray-700">{userObj.name}</span>
        )}
      </div>
    </div>
  );
};

export default WatcherBadge;
