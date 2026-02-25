import React, { useState, useRef } from 'react';
import { Movie } from '../../types';
import {
  colors,
  spacing,
  radius,
  shadows,
  typography,
  borders,
  motion as motionTokens,
} from '../../design-system/tokens';

interface SwipeCardProps {
  movie: Movie;
  onSwipe: (direction: 'left' | 'right') => void;
  active?: boolean;
  style?: React.CSSProperties;
}

const SwipeCard = React.forwardRef<any, SwipeCardProps>(
  ({ movie, onSwipe, active = true, style: customStyle }, ref) => {
    const [offsetX, setOffsetX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const startX = useRef(0);

    React.useImperativeHandle(ref, () => ({
      swipe: (direction: 'left' | 'right') => {
        setIsExiting(true);
        setOffsetX(direction === 'right' ? 500 : -500);
        setTimeout(() => onSwipe(direction), 300);
      },
    }));

    const handleStart = (clientX: number) => {
      if (!active || isExiting) return;
      startX.current = clientX;
      setIsDragging(true);
    };

    const handleMove = (clientX: number) => {
      if (!isDragging || isExiting) return;
      setOffsetX(clientX - startX.current);
    };

    const handleEnd = () => {
      if (!isDragging || isExiting) return;
      setIsDragging(false);

      if (offsetX > 150) {
        setIsExiting(true);
        setOffsetX(500);
        setTimeout(() => onSwipe('right'), 300);
      } else if (offsetX < -150) {
        setIsExiting(true);
        setOffsetX(-500);
        setTimeout(() => onSwipe('left'), 300);
      } else {
        setOffsetX(0);
      }
    };

    const rotation = offsetX / 10;
    const opacity = isExiting
      ? 0
      : Math.max(0, 1 - (Math.abs(offsetX) > 250 ? (Math.abs(offsetX) - 250) / 100 : 0));
    const likeOpacity = Math.min(1, Math.max(0, (offsetX - 50) / 100));
    const nopeOpacity = Math.min(1, Math.max(0, (-offsetX - 50) / 100));

    return (
      <div
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
        style={{
          position: 'absolute',
          width: '100%',
          maxWidth: '350px',
          height: '500px',
          cursor: isExiting ? 'default' : isDragging ? 'grabbing' : active ? 'grab' : 'default',
          transform: `translateX(${offsetX}px) rotate(${rotation}deg)`,
          opacity,
          transition: isDragging
            ? 'none'
            : `all ${motionTokens.duration.slow} ${motionTokens.easing.easeOut}`,
          zIndex: active ? 2 : 1,
          touchAction: 'none',
          userSelect: 'none',
          pointerEvents: active && !isExiting ? 'auto' : 'none',
          ...customStyle,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: radius.card,
            overflow: 'hidden',
            backgroundColor: colors.surface,
            boxShadow: active ? shadows.card : shadows.cardElevated,
            display: 'flex',
            flexDirection: 'column',
            border: borders.cardOutset,
            position: 'relative',
            filter: active ? 'none' : 'brightness(0.7) blur(1px)',
            transform: active ? 'scale(1)' : 'scale(0.95) translateY(10px)',
            transition: `transform ${motionTokens.duration.normal} ${motionTokens.easing.easeOut}, filter ${motionTokens.duration.normal} ${motionTokens.easing.easeOut}`,
          }}
        >
          {/* Like/Nope Overlays */}
          <div
            style={{
                position: 'absolute',
                width: '100%',
                maxWidth: '350px',
                height: '500px',
                cursor: isExiting ? 'default' : isDragging ? 'grabbing' : active ? 'grab' : 'default',
                transform: `translateX(${offsetX}px) rotate(${rotation}deg)`,
                opacity,
                transition: isDragging ? 'none' : `all ${motionTokens.duration.slow} ${motionTokens.easing.easeOut}`,
                zIndex: active ? 2 : 1,
                touchAction: 'none',
                userSelect: 'none',
                pointerEvents: active && !isExiting ? 'auto' : 'none',
                ...customStyle,
              position: 'absolute',
              top: 40,
              left: 20,
              border: `4px solid ${colors.success}`,
              color: colors.success,
              padding: '4px 12px',
              borderRadius: radius.sm,
              fontSize: typography.fontSize.xl,
              fontWeight: 'bold',
              transform: 'rotate(-20deg)',
              opacity: likeOpacity,
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            LIKE
          </div>
          <div
            style={{
              position: 'absolute',
              top: 40,
              right: 20,
              border: `4px solid ${colors.error}`,
              color: colors.error,
              padding: '4px 12px',
              borderRadius: radius.sm,
              fontSize: typography.fontSize.xl,
              fontWeight: 'bold',
              transform: 'rotate(20deg)',
              opacity: nopeOpacity,
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            NOPE
          </div>

          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <img
              src={movie.posterUrl || 'https://via.placeholder.com/400x600?text=No+Poster'}
              alt={movie.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              draggable={false}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
                padding: spacing.lg,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color: colors.textPrimary,
                  fontSize: typography.fontSize.xl,
                  fontFamily: typography.fontFamily.heading.join(', '),
                  textShadow: shadows.textGlow,
                  marginBottom: spacing.xs,
                }}
              >
                {movie.title}
              </h3>
              <p
                style={{
                  margin: 0,
                  color: colors.textSecondary,
                  fontSize: typography.fontSize.sm,
                  opacity: 0.9,
                }}
              >
                {movie.year} • {movie.category || movie.genre || 'Movie'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default SwipeCard;
