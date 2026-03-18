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
  icon?: string;
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
  action: { bubble: '58px', name: '0.7rem' },
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
      disabled,
      ...buttonProps
    },
    ref
  ) => {
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
  const accentColor = customAccent || (user === 'Aaron' ? 'var(--color-accent)' : user === 'Electra' ? 'var(--color-secondary)' : 'var(--color-accent)');
  const haloColor = customHalo || (user === 'Aaron' ? 'var(--color-tertiary)' : user === 'Electra' ? 'var(--color-accent)' : 'var(--color-secondary)');
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
    size === 'tiny' ? 'gel-bubble--inline' : '',
  ]
    .filter(Boolean)
    .join(' ');

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
        filter: isSmall ? 'grayscale(0.4)' : 'none',
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
          background: `
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
          `,
          boxShadow: `
            inset 0 -15px 40px color-mix(in srgb, var(--color-surface-0) 65%, ${haloColor} 35%),
            inset 0 15px 30px rgba(255, 255, 255, 0.2),
            inset 0 0 20px color-mix(in srgb, ${accentColor} 36%, transparent),
            0 0 ${isHovered ? '50px' : '35px'} color-mix(in srgb, ${accentColor} ${accentGlowOpacity}, transparent),
            0 0 ${isHovered ? '80px' : '60px'} color-mix(in srgb, ${haloColor} ${haloGlowOpacity}, transparent)
          `,
          border: `2px solid color-mix(in srgb, ${haloColor} 45%, var(--color-border-subtle) 55%)`,
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          transition: 'all 0.3s ease-out',
          transform: isHovered ? 'scale(1.07) rotate(-1.2deg)' : 'scale(1)',
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
            width: '72%',
            height: '72%',
            borderRadius: '50%',
            overflow: 'hidden',
            border: `2px solid color-mix(in srgb, ${accentColor} 52%, white 48%)`,
            boxShadow: `
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
            background: icon ? 'transparent' : 'rgba(255, 255, 255, 0.05)',
          }}
          className="gel-avatar-image-wrap"
        >
          {icon ? (
            <span style={{ fontSize: size === 'action' ? '1.5rem' : '2rem' }}>{icon}</span>
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
