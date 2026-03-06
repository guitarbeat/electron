import React from 'react';
import { User } from '@/types';
import { useUserColors } from '@/hooks/useUserColors';
import { radius } from '@/design-system/tokens';

interface WatcherBadgeProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  variant?: 'circle' | 'text'; // circle with initial, or full text name
}

const WatcherBadge: React.FC<WatcherBadgeProps> = ({
  user,
  size = 'md',
  showLabel = false,
  variant = 'circle',
}) => {
  const userColor = useUserColors(user);

  if (!userColor) return null;

  const sizeConfig = {
    sm: {
      width: '16px',
      height: '16px',
      fontSize: '9px',
      fontSize_label: '10px',
    },
    md: {
      width: '18px',
      height: '18px',
      fontSize: '10px',
      fontSize_label: '12px',
    },
    lg: {
      width: '24px',
      height: '24px',
      fontSize: '12px',
      fontSize_label: '14px',
    },
  };

  const config = sizeConfig[size];
  const initial = user[0].toUpperCase();

  if (variant === 'circle') {
    return (
      <div
        title={`Watched by ${user}`}
        style={{
          width: config.width,
          height: config.height,
          borderRadius: radius.full,
          backgroundColor: userColor.primary,
          border: '2px solid white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: config.fontSize,
          fontWeight: 'bold',
          color: 'white',
          boxShadow: `0 0 10px ${userColor.glowColor}`,
          textShadow: 'none',
          flexShrink: 0,
        }}
      >
        {initial}
      </div>
    );
  }

  // variant === 'text'
  return (
    <span
      title={`Watched by ${user}`}
      style={{
        fontSize: config.fontSize_label,
        padding: '2px 6px',
        backgroundColor: userColor.primary,
        borderRadius: radius.full,
        color: 'white',
        fontWeight: 'bold',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      {showLabel ? user : initial} {showLabel && '✓'}
    </span>
  );
};

export default WatcherBadge;
