import React from 'react';
import { PlusIcon } from './icons';
import { typography } from '../design-system/tokens';

interface GuestBubbleAvatarProps {
  guestName: string;
  isHovered: boolean;
  isActive: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onFocus: () => void;
  onBlur: () => void;
}

const getGuestInitials = (value: string): string => {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return '';
  }

  return parts
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 2);
};

const GuestBubbleAvatar: React.FC<GuestBubbleAvatarProps> = ({
  guestName,
  isHovered,
  isActive,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
}) => {
  const initials = getGuestInitials(guestName);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      aria-label={guestName ? `Use guest bubble for ${guestName}` : 'Create guest bubble'}
      className="gel-bubble"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 'clamp(140px, 35vw, 200px)',
          height: 'clamp(140px, 35vw, 200px)',
          borderRadius: '50%',
          background: `
            radial-gradient(circle at 30% 25%, rgba(255,255,255,0.34) 0%, transparent 42%),
            radial-gradient(circle at 70% 75%, rgba(255,255,255,0.08) 0%, transparent 30%),
            linear-gradient(135deg, rgba(79, 139, 181, 0.6) 0%, rgba(57, 95, 158, 0.48) 45%, rgba(45, 74, 130, 0.6) 100%)
          `,
          boxShadow: `
            inset 0 -15px 34px rgba(37, 68, 118, 0.42),
            inset 0 14px 25px rgba(255, 255, 255, 0.2),
            0 0 ${isHovered || isActive ? '50px' : '35px'} rgba(109, 176, 233, ${
              isHovered || isActive ? '0.42' : '0.28'
            })
          `,
          border: `3px solid ${isActive ? 'rgba(191, 227, 255, 0.8)' : 'rgba(160, 210, 250, 0.55)'}`,
          transition: 'all 0.3s ease-out',
          transform: isHovered || isActive ? 'scale(1.06)' : 'scale(1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '72%',
            height: '72%',
            borderRadius: '50%',
            border: '3px solid rgba(170, 219, 255, 0.8)',
            background:
              'radial-gradient(circle at 35% 25%, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.03) 55%), linear-gradient(155deg, rgba(50, 82, 139, 0.95) 0%, rgba(29, 46, 90, 0.95) 100%)',
            boxShadow: '0 0 18px rgba(133, 198, 246, 0.35), inset 0 0 20px rgba(0, 0, 0, 0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#d8efff',
            fontSize: initials ? '2rem' : '1.6rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            fontFamily: typography.fontFamily.heading.join(', '),
            overflow: 'hidden',
          }}
        >
          {guestName ? (
            <img
              src={`https://cataas.com/cat?width=200&height=200&ts=${Date.now()}`}
              alt="Guest Cat"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <PlusIcon
              style={{
                width: '1.7rem',
                height: '1.7rem',
                color: '#d8efff',
              }}
            />
          )}
        </div>
      </div>

      <span
        style={{
          fontFamily: typography.fontFamily.heading.join(', '),
          fontSize: 'clamp(1.25rem, 5vw, 1.75rem)',
          fontWeight: 600,
          color: '#f0f6ff',
          textShadow: '0 0 10px rgba(147, 201, 245, 0.7), 0 2px 4px rgba(0, 0, 0, 0.45)',
          letterSpacing: typography.letterSpacing.wide,
          transition: 'all 0.3s ease-out',
          transform: isHovered || isActive ? 'scale(1.05)' : 'scale(1)',
          maxWidth: '100%',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {guestName || 'Guest'}
      </span>
    </button>
  );
};

export default GuestBubbleAvatar;
