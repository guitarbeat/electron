import React from 'react';
import { User } from '../types';
import ImageWithFallback from './ImageWithFallback';
import { userImageSources } from '../config/imageConfig';
import { LockIcon } from './icons';
import { typography } from '../design-system/tokens';

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
      type="button"
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
      {/* Gel Bubble Container - Outer Ring */}
      <div
        style={{
          position: 'relative',
          width: 'clamp(140px, 35vw, 200px)',
          height: 'clamp(140px, 35vw, 200px)',
          borderRadius: '50%',
          background: `
            radial-gradient(circle at 30% 25%, rgba(255,255,255,0.35) 0%, transparent 40%),
            radial-gradient(circle at 70% 75%, rgba(255,255,255,0.1) 0%, transparent 30%),
            linear-gradient(135deg, 
              rgba(147, 112, 219, 0.5) 0%, 
              rgba(138, 130, 200, 0.4) 25%,
              rgba(100, 80, 160, 0.35) 50%,
              rgba(147, 112, 219, 0.45) 75%,
              rgba(180, 150, 230, 0.5) 100%
            )
          `,
          boxShadow: `
            inset 0 -15px 40px rgba(100, 60, 150, 0.4),
            inset 0 15px 30px rgba(255, 255, 255, 0.2),
            inset 0 0 20px rgba(255, 105, 180, 0.15),
            0 0 ${isHovered ? '50px' : '35px'} rgba(255, 105, 180, ${isHovered ? '0.5' : '0.35'}),
            0 0 ${isHovered ? '80px' : '60px'} rgba(147, 112, 219, ${isHovered ? '0.4' : '0.25'})
          `,
          border: '3px solid rgba(180, 150, 220, 0.4)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          transition: 'all 0.3s ease-out',
          transform: isHovered ? 'scale(1.06)' : 'scale(1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Outer Ring Pulse on Hover */}
        {isHovered && (
          <>
            <div
              className="ring-pulse"
              style={{
                position: 'absolute',
                inset: '-12px',
                borderRadius: '50%',
                border: '3px solid rgba(255, 105, 180, 0.5)',
                pointerEvents: 'none',
              }}
            />
            <div
              className="ring-pulse"
              style={{
                position: 'absolute',
                inset: '-12px',
                borderRadius: '50%',
                border: '2px solid rgba(135, 206, 250, 0.4)',
                pointerEvents: 'none',
                animationDelay: '0.3s',
              }}
            />
          </>
        )}

        {/* Glossy highlight - top left shine */}
        <div
          style={{
            position: 'absolute',
            top: '8%',
            left: '12%',
            width: '35%',
            height: '25%',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 100%)',
            borderRadius: '50%',
            pointerEvents: 'none',
            filter: 'blur(2px)',
          }}
        />

        {/* Secondary highlight - bottom right */}
        <div
          style={{
            position: 'absolute',
            bottom: '15%',
            right: '10%',
            width: '20%',
            height: '15%',
            background: 'radial-gradient(ellipse, rgba(255,255,255,0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        {/* Profile Image Container */}
        <div
          style={{
            width: '72%',
            height: '72%',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '3px solid rgba(255, 105, 180, 0.6)',
            boxShadow: `
              0 0 15px rgba(255, 105, 180, 0.4),
              inset 0 0 20px rgba(0, 0, 0, 0.2)
            `,
            position: 'relative',
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
              bottom: '5%',
              right: '5%',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: `
                radial-gradient(circle at 30% 30%, rgba(100, 70, 150, 0.9) 0%, rgba(45, 27, 78, 0.95) 100%)
              `,
              border: '2px solid rgba(255, 105, 180, 0.7)',
              boxShadow: `
                0 0 12px rgba(255, 105, 180, 0.5),
                inset 0 2px 4px rgba(255, 255, 255, 0.2)
              `,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LockIcon style={{ width: '15px', height: '15px', color: '#ff69b4' }} />
          </div>
        )}
      </div>

      {/* Name Label */}
      <span
        style={{
          fontFamily: typography.fontFamily.heading.join(', '),
          fontSize: 'clamp(1.25rem, 5vw, 1.75rem)',
          fontWeight: 600,
          color: '#fff',
          textShadow: `
            0 0 10px rgba(255, 105, 180, 0.8),
            0 0 20px rgba(255, 105, 180, 0.5),
            0 2px 4px rgba(0, 0, 0, 0.5)
          `,
          letterSpacing: typography.letterSpacing.wide,
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
