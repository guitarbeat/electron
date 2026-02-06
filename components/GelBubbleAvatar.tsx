import React from 'react';
import { User } from '../types';
import ImageWithFallback from './ImageWithFallback';
import { userImageSources } from '../config/imageConfig';
import { LockIcon } from './icons';

interface GelBubbleAvatarProps {
  user: User;
  hasPin: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onFocus: () => void;
  onBlur: () => void;
  disabled?: boolean;
  animationOffset?: boolean;
}

const GelBubbleAvatar: React.FC<GelBubbleAvatarProps> = ({
  user,
  hasPin,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  disabled = false,
  animationOffset = false,
}) => {
  const sources = userImageSources[user];

  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      disabled={disabled}
      aria-label={`Select ${user} as user${hasPin ? ' (PIN protected)' : ''}`}
      className={`gel-bubble ${animationOffset ? 'gel-bubble-offset' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        background: 'transparent',
        border: 'none',
        cursor: disabled ? 'wait' : 'pointer',
        padding: 0,
        opacity: disabled ? 0.7 : 1,
      }}
    >
      {/* Gel Bubble Container */}
      <div
        style={{
          position: 'relative',
          width: 'clamp(120px, 30vw, 160px)',
          height: 'clamp(120px, 30vw, 160px)',
          borderRadius: '50%',
          // Multi-layer gradient for gel appearance
          background: `
            radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.4) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(147, 112, 219, 0.6) 0%, rgba(75, 0, 130, 0.3) 100%)
          `,
          // Inner and outer glow
          boxShadow: `
            inset 0 -20px 30px rgba(255,255,255,0.1),
            inset 0 10px 20px rgba(255,255,255,0.3),
            0 0 ${isHovered ? '60px' : '40px'} rgba(255, 105, 180, ${isHovered ? '0.6' : '0.4'}),
            0 0 ${isHovered ? '100px' : '80px'} rgba(147, 112, 219, ${isHovered ? '0.5' : '0.3'})
          `,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          transition: 'all 0.3s ease-out',
          transform: isHovered ? 'scale(1.08)' : 'scale(1)',
          overflow: 'hidden',
        }}
      >
        {/* Glossy highlight overlay */}
        <div
          style={{
            position: 'absolute',
            top: '5%',
            left: '15%',
            width: '40%',
            height: '30%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 100%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        {/* Profile Image */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '70%',
            height: '70%',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '3px solid rgba(255, 105, 180, 0.5)',
            boxShadow: '0 0 20px rgba(255, 105, 180, 0.3)',
          }}
        >
          <ImageWithFallback
            sources={sources}
            alt={`${user}'s profile`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>

        {/* Lock Badge */}
        {hasPin && (
          <div
            style={{
              position: 'absolute',
              bottom: '8%',
              right: '8%',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2d1b4e 0%, #1a1a3e 100%)',
              border: '2px solid rgba(255, 105, 180, 0.8)',
              boxShadow: '0 0 10px rgba(255, 105, 180, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LockIcon style={{ width: '14px', height: '14px', color: '#ff69b4' }} />
          </div>
        )}
      </div>

      {/* Name Label */}
      <span
        style={{
          fontFamily: "'Papyrus', fantasy",
          fontSize: 'clamp(1.25rem, 5vw, 1.75rem)',
          fontWeight: 600,
          color: '#fff',
          textShadow: `
            0 0 10px rgba(255, 105, 180, 0.8),
            0 0 20px rgba(255, 105, 180, 0.5),
            0 2px 4px rgba(0, 0, 0, 0.5)
          `,
          letterSpacing: '0.05em',
          transition: 'all 0.3s ease-out',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        }}
      >
        {user}
      </span>
    </button>
  );
};

export default GelBubbleAvatar;
