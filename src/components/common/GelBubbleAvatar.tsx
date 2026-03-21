import React from 'react';
import { User } from '@/types';

type BubbleSize = 'default' | 'compact' | 'tiny' | 'action';

const CAT_API = 'https://api.thecatapi.com/v1/images/search?limit=3';
const CATAAS_RANDOM = 'https://cataas.com/cat';

const userImageSources: Record<User, string[]> = {
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

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  sources: (string | undefined | null)[];
  fallbackElement?: React.ReactNode;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  sources,
  fallbackElement,
  alt,
  ...props
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [hasError, setHasError] = React.useState(false);

  const validSources = sources.filter((source): source is string => Boolean(source));

  React.useEffect(() => {
    setCurrentIndex(0);
    setHasError(false);
  }, [sources]);

  const handleError = () => {
    if (currentIndex < validSources.length - 1) {
      setCurrentIndex((previousIndex) => previousIndex + 1);
      return;
    }

    setHasError(true);
  };

  if (hasError || validSources.length === 0) {
    return (
      <div
        className={props.className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.05)',
          ...props.style,
        }}
      >
        {fallbackElement || (
          <span style={{ opacity: 0.5, fontSize: '0.8em' }}>{alt || 'No Image'}</span>
        )}
      </div>
    );
  }

  return <img {...props} src={validSources[currentIndex]} alt={alt} onError={handleError} />;
};

function useRandomCatImageLocal(enabled: boolean) {
  const [sources, setSources] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(enabled);
  const [refetchKey, setRefetchKey] = React.useState(0);

  const refetch = React.useCallback(() => {
    if (!enabled) return;
    setRefetchKey((key) => key + 1);
  }, [enabled]);

  React.useEffect(() => {
    if (!enabled) {
      setSources([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    async function fetchCatUrls() {
      try {
        const response = await fetch(CAT_API);
        if (!response.ok) throw new Error('Cat API error');
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) throw new Error('No images');
        const urls = data
          .map((item: { url?: string }) => item.url)
          .filter((url): url is string => Boolean(url));
        if (!cancelled) {
          setSources(urls.length > 0 ? urls : [CATAAS_RANDOM]);
        }
      } catch {
        if (!cancelled) {
          setSources([CATAAS_RANDOM]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchCatUrls();
    return () => {
      cancelled = true;
    };
  }, [enabled, refetchKey]);

  return { sources, refetch, isLoading };
}

interface GelBubbleAvatarProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  user?: User;
  icon?: React.ReactNode;
  label?: string;
  hasPin?: boolean;
  isHovered: boolean;
  isSmall?: boolean;
  showName?: boolean;
  selectionState?: 'neutral' | 'active' | 'inactive';
  isSelectionAnimating?: boolean;
  size?: BubbleSize;
  animationOffset?: boolean;
  accentColor?: string;
  haloColor?: string;
  enableImageRefresh?: boolean;
}

const SIZES: Record<BubbleSize, { bubble: string; name: string }> = {
  default: { bubble: 'clamp(140px, 35vw, 200px)', name: 'clamp(1rem, 4vw, 1.25rem)' },
  compact: { bubble: 'clamp(90px, 22vw, 140px)', name: 'clamp(0.8rem, 3vw, 1rem)' },
  tiny: {
    bubble: 'var(--inline-profile-bubble-size, clamp(72px, 11vw, 98px))',
    name: 'var(--inline-profile-name-size, clamp(0.65rem, 0.8vw, 0.85rem))',
  },
  action: { bubble: '64px', name: '0.7rem' },
};

const GelBubbleAvatar = React.forwardRef<HTMLButtonElement, GelBubbleAvatarProps>(
  (
    {
      user,
      icon,
      label,
      hasPin = false,
      isHovered,
      isSmall = false,
      showName = true,
      selectionState = 'neutral',
      isSelectionAnimating = false,
      size = 'default',
      animationOffset = false,
      accentColor: customAccent,
      haloColor: customHalo,
      enableImageRefresh = false,
      style: customStyle,
      className: externalClassName,
      disabled,
      ...buttonProps
    },
    ref
  ) => {
  const isActionBubble = size === 'action';
  const shouldFetchCatImages = Boolean(user);
  const {
    sources: catSources,
    refetch: refetchCat,
    isLoading: isCatLoading,
  } = useRandomCatImageLocal(shouldFetchCatImages);

  const sources = user
    ? catSources.length > 0
      ? [...catSources, ...userImageSources[user]]
      : userImageSources[user]
    : [];

  const sizeTokens = SIZES[size];
  const accentColor =
    customAccent ||
    (user === 'Aaron'
      ? 'var(--color-accent)'
      : user === 'Electra'
        ? 'var(--color-secondary)'
        : 'var(--color-accent)');
  const haloColor =
    customHalo ||
    (isActionBubble
      ? 'var(--color-quaternary)'
      : user === 'Aaron'
        ? 'var(--color-tertiary)'
        : user === 'Electra'
          ? 'var(--color-accent)'
          : 'var(--color-secondary)');
  const accentGlowOpacity = isHovered ? '52%' : '36%';
  const haloGlowOpacity = isHovered ? '45%' : '28%';
  const canRefreshImage = Boolean(enableImageRefresh && user && !disabled);
  const shouldPlaceNameInsideBubble = true;
  const bubbleClasses = [
    'gel-bubble',
    'y2k-avatar-bubble',
    animationOffset ? 'gel-bubble-offset' : '',
    `gel-bubble--${selectionState}`,
    isSelectionAnimating ? 'is-selection-animating' : '',
    isSmall ? 'gel-bubble--small' : '',
    disabled ? 'gel-bubble--disabled' : '',
    isActionBubble ? 'gel-bubble--action' : '',
    size === 'tiny' ? 'gel-bubble--inline' : '',
    externalClassName || '',
  ]
    .filter(Boolean)
    .join(' ');

  const shellBackground = isActionBubble
    ? `
        radial-gradient(circle at 23% 16%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.42) 13%, rgba(255,255,255,0.04) 34%, transparent 46%),
        radial-gradient(circle at 78% 20%, color-mix(in srgb, ${haloColor} 28%, rgba(255,255,255,0.08)) 0%, transparent 26%),
        radial-gradient(circle at 76% 80%, color-mix(in srgb, ${accentColor} 20%, transparent) 0%, transparent 30%),
        linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 20%, transparent 44%),
        conic-gradient(from 210deg at 50% 50%,
          rgba(255,255,255,0.94) 0deg,
          color-mix(in srgb, ${haloColor} 68%, rgba(255,255,255,0.24)) 68deg,
          color-mix(in srgb, ${accentColor} 42%, rgba(56, 23, 60, 0.94) 58%) 142deg,
          rgba(12, 10, 30, 0.98) 220deg,
          color-mix(in srgb, ${haloColor} 36%, rgba(18, 32, 56, 0.98) 64%) 304deg,
          rgba(255,255,255,0.94) 360deg
        ),
        linear-gradient(145deg,
          rgba(255, 248, 253, 0.92) -8%,
          rgba(246, 218, 238, 0.48) 18%,
          rgba(56, 29, 66, 0.98) 54%,
          rgba(11, 13, 31, 1) 100%
        )
      `
    : `
        radial-gradient(circle at 28% 22%, rgba(255,255,255,0.52) 0%, rgba(255,255,255,0.15) 27%, transparent 46%),
        radial-gradient(circle at 74% 78%, rgba(255,255,255,0.2) 0%, transparent 34%),
        conic-gradient(from 205deg at 50% 50%,
          color-mix(in srgb, ${accentColor} 54%, white 46%) 0deg,
          color-mix(in srgb, ${haloColor} 42%, var(--color-surface-1) 58%) 115deg,
          color-mix(in srgb, var(--color-secondary) 52%, white 48%) 230deg,
          color-mix(in srgb, ${accentColor} 54%, white 46%) 360deg
        ),
        linear-gradient(135deg,
          color-mix(in srgb, ${accentColor} 48%, var(--color-surface-2) 52%) 0%,
          color-mix(in srgb, var(--color-tertiary) 40%, var(--color-surface-3) 60%) 50%,
          color-mix(in srgb, ${haloColor} 52%, var(--color-surface-2) 48%) 100%
        )
      `;

  const shellBoxShadow = isActionBubble
    ? `
        inset 0 -18px 34px rgba(10, 7, 27, 0.86),
        inset 0 14px 20px rgba(255, 255, 255, 0.34),
        inset 0 0 20px color-mix(in srgb, ${accentColor} 24%, transparent),
        0 0 0 1px rgba(255, 255, 255, 0.22),
        0 0 0 6px rgba(6, 2, 18, 0.2),
        0 22px 42px rgba(4, 0, 14, 0.54),
        0 0 ${isHovered ? '30px' : '20px'} color-mix(in srgb, ${accentColor} ${isHovered ? '52%' : '30%'}, transparent),
        0 0 ${isHovered ? '62px' : '42px'} color-mix(in srgb, ${haloColor} ${isHovered ? '38%' : '20%'}, transparent)
      `
    : `
        inset 0 -15px 40px color-mix(in srgb, var(--color-surface-0) 65%, ${haloColor} 35%),
        inset 0 15px 30px rgba(255, 255, 255, 0.2),
        inset 0 0 20px color-mix(in srgb, ${accentColor} 36%, transparent),
        0 0 ${isHovered ? '50px' : '35px'} color-mix(in srgb, ${accentColor} ${accentGlowOpacity}, transparent),
        0 0 ${isHovered ? '80px' : '60px'} color-mix(in srgb, ${haloColor} ${haloGlowOpacity}, transparent)
      `;

  const shellBorder = isActionBubble
    ? `1.5px solid color-mix(in srgb, rgba(255, 255, 255, 0.94) 56%, ${haloColor} 44%)`
    : `2px solid color-mix(in srgb, ${haloColor} 45%, var(--color-border-subtle) 55%)`;

  const shellTransform = isActionBubble
    ? isHovered
      ? 'translateY(-2px) scale(1.08) rotate(-2deg)'
      : 'translateY(0) scale(1)'
    : isHovered
      ? 'scale(1.07) rotate(-1.2deg)'
      : 'scale(1)';

  const imageWrapBackground = icon
    ? isActionBubble
      ? `
          radial-gradient(circle at 30% 26%, rgba(255,255,255,0.52) 0%, rgba(255,255,255,0.08) 26%, transparent 42%),
          radial-gradient(circle at 72% 74%, color-mix(in srgb, ${accentColor} 22%, transparent) 0%, transparent 38%),
          linear-gradient(180deg, rgba(255, 255, 255, 0.18) 0%, rgba(28, 18, 44, 0.24) 36%, rgba(18, 11, 30, 0.72) 100%),
          radial-gradient(circle at 50% 46%, color-mix(in srgb, white 14%, ${haloColor} 86%) 0%, color-mix(in srgb, ${haloColor} 20%, rgba(11, 13, 30, 0.98)) 24%, rgba(11, 13, 30, 0.98) 74%)
        `
      : 'transparent'
    : 'rgba(255, 255, 255, 0.05)';
  const bubbleFilter = [
    isSmall ? 'grayscale(0.4)' : '',
    isActionBubble ? 'drop-shadow(0 10px 18px rgba(12, 4, 28, 0.28))' : '',
  ]
    .filter(Boolean)
    .join(' ') || 'none';

  const onImageClick = (e: React.MouseEvent) => {
    if (!canRefreshImage) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    refetchCat();
  };

  let opacityValue = 1;
  if (isSmall) opacityValue = 0.5;
  else if (disabled) opacityValue = 0.7;
  const resolvedAriaLabel =
    buttonProps['aria-label'] ??
    label ??
    (user ? `Select ${user}${hasPin ? ' (PIN protected)' : ''}` : 'Avatar action');

  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      {...buttonProps}
      aria-label={resolvedAriaLabel}
      className={bubbleClasses}
      style={{
        ['--gel-accent' as string]: accentColor,
        ['--gel-halo' as string]: haloColor,
        ['--gel-bubble-size' as string]: sizeTokens.bubble,
        ['--gel-name-size' as string]: sizeTokens.name,
        ['--gel-base-scale' as string]: isSmall ? 0.62 : 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: shouldPlaceNameInsideBubble ? 0 : '16px',
        background: 'transparent',
        border: 'none',
        cursor: disabled ? 'wait' : 'pointer',
        padding: 0,
        opacity: opacityValue,
        transition:
          'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), filter 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        filter: bubbleFilter,
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        ...customStyle,
      }}
    >
      {/* Gel Bubble Container - Outer Ring */}
      <div
        style={{
          position: 'relative',
          width: 'var(--gel-bubble-size)',
          height: 'var(--gel-bubble-size)',
          borderRadius: '50%',
          background: shellBackground,
          boxShadow: shellBoxShadow,
          border: shellBorder,
          backdropFilter: isActionBubble ? 'blur(8px)' : 'blur(4px)',
          WebkitBackdropFilter: isActionBubble ? 'blur(8px)' : 'blur(4px)',
          transition: 'transform 0.28s ease-out, box-shadow 0.28s ease-out, border-color 0.28s ease-out',
          transform: shellTransform,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        className="gel-avatar-shell"
      >
        <div className="gel-avatar-chrome-ring" aria-hidden />
        <div className="gel-avatar-sweep" aria-hidden />
        <div className="gel-avatar-star gel-avatar-star-left" aria-hidden />
        <div className="gel-avatar-star gel-avatar-star-right" aria-hidden />
        {isActionBubble && <div className="gel-avatar-action-orbit" aria-hidden />}
        {isActionBubble && <div className="gel-avatar-action-lens" aria-hidden />}

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
          onClick={canRefreshImage ? onImageClick : undefined}
          title={canRefreshImage ? 'Click for new cat' : undefined}
          style={{
            width: isActionBubble ? '68%' : '72%',
            height: isActionBubble ? '68%' : '72%',
            borderRadius: '50%',
            overflow: 'hidden',
            border: isActionBubble
              ? `1.5px solid color-mix(in srgb, ${accentColor} 44%, white 56%)`
              : `2px solid color-mix(in srgb, ${accentColor} 52%, white 48%)`,
            boxShadow: isActionBubble
              ? `
                  0 0 0 1px color-mix(in srgb, white 55%, transparent),
                  0 0 18px color-mix(in srgb, ${accentColor} 38%, transparent),
                  inset 0 0 28px rgba(0, 0, 0, 0.34),
                  inset 0 10px 18px rgba(255, 255, 255, 0.08)
                `
              : `
                  0 0 0 1px color-mix(in srgb, white 44%, transparent),
                  0 0 15px color-mix(in srgb, ${accentColor} 44%, transparent),
                  inset 0 0 22px rgba(0, 0, 0, 0.24)
                `,
            position: 'relative',
            cursor: disabled ? 'wait' : 'inherit',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: imageWrapBackground,
          }}
          className={`gel-avatar-image-wrap${isActionBubble ? ' gel-avatar-image-wrap--action' : ''}`}
        >
          {icon ? (
            <span
              className={`gel-avatar-icon${isActionBubble ? ' gel-avatar-icon--action' : ''}`}
              style={{ fontSize: size === 'action' ? '1.5rem' : '2rem' }}
            >
              {icon}
            </span>
          ) : (
            <ImageWithFallback
              sources={sources}
              alt={user ? `${user}'s profile` : 'Profile'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'opacity 0.25s ease',
                opacity: isCatLoading ? 0.7 : 1,
              }}
            />
          )}
          {isCatLoading && user && (
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

        {showName && shouldPlaceNameInsideBubble ? (
          <span
            className="gel-avatar-name gel-avatar-name--inside"
            style={{
              position: 'absolute',
              left: '50%',
              bottom: '6%',
              transform: isHovered
                ? 'translate(-50%, 0) scale(1.05)'
                : 'translate(-50%, 0) scale(1)',
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--gel-name-size)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'color-mix(in srgb, var(--color-text-primary) 78%, white 22%)',
              textTransform: 'var(--type-button-label-transform)',
              textShadow: `
                0 0 8px color-mix(in srgb, ${accentColor} 72%, transparent),
                0 0 20px color-mix(in srgb, ${haloColor} 42%, transparent),
                0 2px 4px rgba(0, 0, 0, 0.5)
              `,
              letterSpacing: 'var(--letter-spacing-widest)',
              WebkitTextStroke: `0.5px color-mix(in srgb, ${haloColor} 48%, transparent)`,
              transition: 'all 0.3s ease-out',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {label || user}
          </span>
        ) : null}

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
            <span style={{ fontSize: '14px', lineHeight: 1, color: accentColor }}>🔒</span>
          </div>
        )}
      </div>

      {!shouldPlaceNameInsideBubble ? (
        <span
          className={`gel-avatar-name${showName ? '' : ' gel-avatar-name--hidden'}`}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--gel-name-size)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'color-mix(in srgb, var(--color-text-primary) 78%, white 22%)',
            textTransform: 'var(--type-button-label-transform)',
            textShadow: `
              0 0 8px color-mix(in srgb, ${accentColor} 72%, transparent),
              0 0 20px color-mix(in srgb, ${haloColor} 42%, transparent),
              0 2px 4px rgba(0, 0, 0, 0.5)
            `,
            letterSpacing: 'var(--letter-spacing-widest)',
            WebkitTextStroke: `0.5px color-mix(in srgb, ${haloColor} 48%, transparent)`,
            transition: 'all 0.3s ease-out',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
            whiteSpace: 'nowrap',
          }}
        >
          {label || user}
        </span>
      ) : null}
    </button>
  );
});

export default GelBubbleAvatar;
