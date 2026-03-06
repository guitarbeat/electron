import React, { useState, useCallback } from 'react';
import type { User } from '../../../types';

interface GelBubbleAvatarProps {
  user: User | null;
  size?: number | 'tiny' | 'compact' | 'default';
  showLock?: boolean;
  onClick?: () => void;
  hasPin?: boolean;
  isHovered?: boolean;
  isSmall?: boolean;
  selectionState?: string;
  isSelectionAnimating?: boolean;
  disabled?: boolean;
  animationOffset?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

const getSizePixels = (size: number | 'tiny' | 'compact' | 'default'): number => {
  if (typeof size === 'number') return size;
  switch (size) {
    case 'tiny': return 32;
    case 'compact': return 48;
    case 'default': return 60;
    default: return 60;
  }
};

const GelBubbleAvatar: React.FC<GelBubbleAvatarProps> = ({
  user,
  size = 60,
  showLock = false,
  onClick,
}) => {
  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  const sizePixels = getSizePixels(size);

  const avatarStyle: React.CSSProperties = {
    width: `${sizePixels}px`,
    height: `${sizePixels}px`,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: '3px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  };

  return (
    <div style={avatarStyle} onClick={handleClick}>
      <span
        style={{
          fontSize: `${sizePixels * 0.4}px`,
          color: 'white',
          fontWeight: 'bold',
        }}
      >
        {user?.charAt(0)?.toUpperCase() || '?'}
      </span>
      {showLock && (
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: `${sizePixels * 0.3}px`,
            height: `${sizePixels * 0.3}px`,
            borderRadius: '50%',
            background: '#ef4444',
            border: '2px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${sizePixels * 0.15}px`,
            color: 'white',
          }}
        >
          🔒
        </div>
      )}
    </div>
  );
};

export default GelBubbleAvatar;
