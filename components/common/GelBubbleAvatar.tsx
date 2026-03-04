import './GelBubbleAvatar.css';
import React from 'react';
import { User } from '../../types';
import ImageWithFallback from './ImageWithFallback';
import { userImageSources } from '../../config/imageConfig';
import { useRandomCatImage } from '../../hooks/useRandomCatImage';
import { LockIcon } from './icons';

type BubbleSize = 'default' | 'compact';

interface GelBubbleAvatarProps {
  user: User;
  hasPin: boolean;
  isHovered: boolean;
  isSmall?: boolean;
  size?: BubbleSize;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onFocus: () => void;
  onBlur: () => void;
  disabled?: boolean;
  animationOffset?: boolean;
}

const SIZES: Record<BubbleSize, { bubble: string; name: string }> = {
  default: { bubble: 'clamp(140px, 35vw, 200px)', name: 'clamp(1rem, 4vw, 1.25rem)' },
  compact: { bubble: 'clamp(90px, 22vw, 140px)', name: 'clamp(0.8rem, 3vw, 1rem)' },
};

const GelBubbleAvatar: React.FC<GelBubbleAvatarProps> = ({
  user,
  hasPin,
  isHovered,
  isSmall = false,
  size = 'default',
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  disabled = false,
  animationOffset = false,
}) => {
  const { sources: catSources, refetch: refetchCat, isLoading: isCatLoading } = useRandomCatImage();
  const sources =
    catSources.length > 0 ? [...catSources, ...userImageSources[user]] : userImageSources[user];
  const sizeTokens = SIZES[size];
  const accentColor = user === 'Aaron' ? 'var(--color-accent)' : 'var(--color-secondary)';
  const haloColor = user === 'Aaron' ? 'var(--color-tertiary)' : 'var(--color-accent)';
  const accentGlowOpacity = isHovered ? '52%' : '36%';
  const haloGlowOpacity = isHovered ? '45%' : '28%';

  const onImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) refetchCat();
  };

  let opacityValue = 1;
  if (isSmall) opacityValue = 0.5;
  else if (disabled) opacityValue = 0.7;

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
        ['--gel-accent' as string]: accentColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        background: 'transparent',
        border: 'none',
        cursor: disabled ? 'wait' : 'pointer',
        padding: 0,
        opacity: opacityValue,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isSmall ? 'scale(0.6)' : 'none',
        filter: isSmall ? 'grayscale(0.4)' : 'none',
      }}
    >
      {/* Gel Bubble Container - Outer Ring */}
      <div
        style={{
          position: 'relative',
          width: sizeTokens.bubble,
          height: sizeTokens.bubble,
          borderRadius: '50%',
          background: `
            radial-gradient(circle at 30% 25%, rgba(255,255,255,0.35) 0%, transparent 40%),
            radial-gradient(circle at 70% 75%, rgba(255,255,255,0.1) 0%, transparent 30%),
            linear-gradient(135deg,
              color-mix(in srgb, ${accentColor} 42%, var(--color-surface-2) 58%) 0%,
              color-mix(in srgb, var(--color-tertiary) 36%, var(--color-surface-3) 64%) 50%,
              color-mix(in srgb, ${haloColor} 44%, var(--color-surface-2) 56%) 100%
            )
          `,
          boxShadow: `
            inset 0 -15px 40px color-mix(in srgb, var(--color-surface-0) 65%, ${haloColor} 35%),
            inset 0 15px 30px rgba(255, 255, 255, 0.2),
            inset 0 0 20px color-mix(in srgb, ${accentColor} 30%, transparent),
            0 0 ${isHovered ? '50px' : '35px'} color-mix(in srgb, ${accentColor} ${accentGlowOpacity}, transparent),
            0 0 ${isHovered ? '80px' : '60px'} color-mix(in srgb, ${haloColor} ${haloGlowOpacity}, transparent)
          `,
          border: `3px solid color-mix(in srgb, ${haloColor} 38%, var(--color-border-subtle) 62%)`,
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
                border: `3px solid color-mix(in srgb, ${accentColor} 62%, transparent)`,
                pointerEvents: 'none',
              }}
            />
            <div
              className="ring-pulse"
              style={{
                position: 'absolute',
                inset: '-12px',
                borderRadius: '50%',
                border: `2px solid color-mix(in srgb, ${haloColor} 55%, transparent)`,
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

        {/* Profile Image Container - click image for new cat */}
        <div
          role="button"
          tabIndex={0}
          onClick={onImageClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              if (!disabled) refetchCat();
            }
          }}
          aria-label="Get a new random cat"
          title="Click for new cat"
          style={{
            width: '72%',
            height: '72%',
            borderRadius: '50%',
            overflow: 'hidden',
            border: `3px solid color-mix(in srgb, ${accentColor} 58%, white 42%)`,
            boxShadow: `
              0 0 15px color-mix(in srgb, ${accentColor} 44%, transparent),
              inset 0 0 20px rgba(0, 0, 0, 0.2)
            `,
            position: 'relative',
            cursor: disabled ? 'wait' : 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          className="gel-avatar-image-wrap"
        >
          <ImageWithFallback
            sources={sources}
            alt={`${user}'s profile`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'opacity 0.25s ease',
              opacity: isCatLoading ? 0.7 : 1,
            }}
          />
          {isCatLoading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.35)',
                borderRadius: '50%',
                pointerEvents: 'none',
              }}
              aria-hidden
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  border: `3px solid color-mix(in srgb, ${accentColor} 52%, transparent)`,
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'gel-avatar-spin 0.8s linear infinite',
                }}
              />
            </div>
          )}
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
                radial-gradient(
                  circle at 30% 30%,
                  color-mix(in srgb, ${haloColor} 45%, var(--color-surface-3) 55%) 0%,
                  color-mix(in srgb, var(--color-surface-0) 82%, ${accentColor} 18%) 100%
                )
              `,
              border: `2px solid color-mix(in srgb, ${accentColor} 66%, transparent)`,
              boxShadow: `
                0 0 12px color-mix(in srgb, ${accentColor} 50%, transparent),
                inset 0 2px 4px rgba(255, 255, 255, 0.2)
              `,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LockIcon style={{ width: '15px', height: '15px', color: accentColor }} />
          </div>
        )}
      </div>

      {/* Name Label */}
      <span
        style={{
          fontFamily: 'inherit',
          fontSize: sizeTokens.name,
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          textTransform: 'uppercase',
          textShadow: `
            0 0 10px color-mix(in srgb, ${accentColor} 62%, transparent),
            0 0 20px color-mix(in srgb, ${haloColor} 35%, transparent),
            0 2px 4px rgba(0, 0, 0, 0.5)
          `,
          letterSpacing: '0.06em',
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
