import React from 'react';
import { User } from '@/shared/types';

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
  default: { bubble: 'clamp(112px, 26vw, 168px)', name: 'clamp(0.9rem, 3.2vw, 1.12rem)' },
  compact: { bubble: 'clamp(72px, 16vw, 118px)', name: 'clamp(0.72rem, 2.4vw, 0.95rem)' },
  tiny: {
    bubble: 'var(--inline-profile-bubble-size, clamp(52px, 8vw, 76px))',
    name: 'var(--inline-profile-name-size, clamp(0.62rem, 1.8vw, 0.78rem))',
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
  /** Inline profile avatars: photo fills shell; chrome / gloss / name stack above */
  const isTinyFullBleed = size === 'tiny' && !icon && !isActionBubble;
  const hasPhotoFill = Boolean(user && !icon && !isActionBubble);
  const isHoverPreview = Boolean(hasPhotoFill && isHovered && !disabled);

  React.useEffect(() => {
    if (!user) return;
    // #region agent log
    fetch('http://127.0.0.1:7514/ingest/a7642128-7508-4c11-bd07-2f9ada94f387', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '357275',
      },
      body: JSON.stringify({
        sessionId: '357275',
        location: 'GelBubbleAvatar.tsx:hover',
        message: 'photo bubble hover state',
        data: {
          user,
          size,
          isHovered,
          isHoverPreview,
          hasPhotoFill,
          disabled: Boolean(disabled),
        },
        timestamp: Date.now(),
        hypothesisId: 'H2-H4',
        runId: 'debug-357275',
      }),
    }).catch(() => {});
    // #endregion
  }, [user, size, isHovered, isHoverPreview, hasPhotoFill, disabled]);

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
    isTinyFullBleed ? 'gel-bubble--inline-full-bleed' : '',
    isHoverPreview ? 'gel-bubble--photo-hover-preview' : '',
    externalClassName || '',
  ]
    .filter(Boolean)
    .join(' ');

  const shellBackground = isActionBubble
    ? `
        radial-gradient(circle at 24% 18%, rgba(255,255,255,0.86) 0%, rgba(255,255,255,0.24) 18%, transparent 34%),
        radial-gradient(circle at 74% 80%, color-mix(in srgb, ${accentColor} 18%, transparent) 0%, transparent 34%),
        radial-gradient(circle at 50% 54%, rgba(255,255,255,0.08) 0%, transparent 56%),
        conic-gradient(from 198deg at 50% 50%,
          color-mix(in srgb, white 76%, ${haloColor} 24%) 0deg,
          color-mix(in srgb, ${accentColor} 34%, rgba(83, 37, 59, 0.94) 66%) 98deg,
          rgba(30, 12, 42, 0.98) 188deg,
          color-mix(in srgb, ${haloColor} 32%, rgba(18, 30, 52, 0.96) 68%) 274deg,
          color-mix(in srgb, white 76%, ${haloColor} 24%) 360deg
        ),
        linear-gradient(145deg,
          rgba(255, 241, 233, 0.88) 0%,
          rgba(236, 196, 220, 0.5) 22%,
          rgba(82, 36, 58, 0.96) 58%,
          rgba(20, 10, 31, 0.98) 100%
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
        inset 0 -18px 38px rgba(18, 8, 29, 0.82),
        inset 0 14px 22px rgba(255, 255, 255, 0.32),
        inset 0 0 18px color-mix(in srgb, ${accentColor} 22%, transparent),
        0 0 0 2px color-mix(in srgb, ${haloColor} 16%, transparent),
        0 18px 34px rgba(5, 0, 18, 0.44),
        0 0 ${isHovered ? '34px' : '24px'} color-mix(in srgb, ${accentColor} ${isHovered ? '40%' : '24%'}, transparent),
        0 0 ${isHovered ? '56px' : '38px'} color-mix(in srgb, ${haloColor} ${isHovered ? '34%' : '18%'}, transparent)
      `
    : `
        inset 0 -15px 40px color-mix(in srgb, var(--color-surface-0) 65%, ${haloColor} 35%),
        inset 0 15px 30px rgba(255, 255, 255, 0.2),
        inset 0 0 20px color-mix(in srgb, ${accentColor} 36%, transparent),
        0 0 ${isHovered ? '50px' : '35px'} color-mix(in srgb, ${accentColor} ${accentGlowOpacity}, transparent),
        0 0 ${isHovered ? '80px' : '60px'} color-mix(in srgb, ${haloColor} ${haloGlowOpacity}, transparent)
      `;

  const shellBorder = isActionBubble
    ? `1.5px solid color-mix(in srgb, rgba(255, 255, 255, 0.84) 50%, ${haloColor} 50%)`
    : `2px solid color-mix(in srgb, ${haloColor} 45%, var(--color-border-subtle) 55%)`;

  /** Preview scale is applied on the <button> so hit-testing matches the enlarged visual; scaling only the inner shell caused mouseLeave on the button and hover flicker (session 357275 logs). */
  const photoPreviewScaleMult =
    size === 'tiny' ? 1.88 : size === 'compact' ? 1.72 : 1.62;

  const shellTransform = isActionBubble
    ? isHovered
      ? 'translateY(-2px) scale(1.08) rotate(-2deg)'
      : 'translateY(0) scale(1)'
    : isHoverPreview
      ? 'scale(1) translateZ(0)'
      : isHovered
        ? 'scale(1.07) rotate(-1.2deg)'
        : 'scale(1)';

  const imageWrapBackground = icon
    ? isActionBubble
      ? `
          radial-gradient(circle at 34% 28%, rgba(255,255,255,0.24) 0%, transparent 34%),
          radial-gradient(circle at 70% 72%, color-mix(in srgb, ${accentColor} 18%, transparent) 0%, transparent 40%),
          linear-gradient(180deg, rgba(255, 244, 252, 0.22) 0%, rgba(45, 22, 58, 0.9) 100%),
          radial-gradient(circle at 50% 50%, color-mix(in srgb, ${haloColor} 18%, rgba(11, 13, 30, 0.96)) 0%, rgba(11, 13, 30, 0.98) 72%)
        `
      : 'transparent'
    : 'rgba(255, 255, 255, 0.05)';
  const bubbleFilter = [
    isSmall ? 'grayscale(0.4)' : '',
    isActionBubble ? 'drop-shadow(0 10px 18px rgba(12, 4, 28, 0.28))' : '',
  ]
    .filter(Boolean)
    .join(' ') || 'none';
  const imageWrapSize = isActionBubble
    ? '74%'
    : size === 'tiny'
      ? '86%'
      : size === 'compact'
        ? '80%'
        : '82%';
  const insideNameBottom = size === 'tiny' ? '4.5%' : isActionBubble ? '7%' : '6.5%';
  /** Cap width to bubble; intrinsic width shows full name (no ellipsis) */
  const insideNameMaxWidth = size === 'tiny' ? '96%' : '96%';
  const insideNamePadding =
    size === 'tiny' ? '0.16rem 0.46rem 0.2rem' : '0.22rem 0.68rem 0.28rem';

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
        position: 'relative',
        zIndex: isHoverPreview ? 70 : undefined,
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
          'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), filter 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.34s cubic-bezier(0.33, 1.1, 0.48, 1)',
        filter: bubbleFilter,
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        ...(isHoverPreview
          ? {
              transform: `scale(calc(var(--gel-base-scale, 1) * ${photoPreviewScaleMult}))`,
              transformOrigin: 'center center',
            }
          : {}),
        ...customStyle,
      }}
    >
      {/* Gel Bubble Container - Outer Ring */}
      <div
        style={{
          position: 'relative',
          width:
            size === 'tiny'
              ? 'calc(var(--gel-bubble-size) * var(--gel-bubble-width-mult, 1.22))'
              : 'var(--gel-bubble-size)',
          height: 'var(--gel-bubble-size)',
          borderRadius:
            size === 'tiny' ? 'var(--gel-inline-border-radius, 14px)' : '50%',
          background: isTinyFullBleed ? 'transparent' : shellBackground,
          boxShadow: shellBoxShadow,
          border: shellBorder,
          backdropFilter: isTinyFullBleed ? 'none' : isActionBubble ? 'blur(8px)' : 'blur(4px)',
          WebkitBackdropFilter: isTinyFullBleed ? 'none' : isActionBubble ? 'blur(8px)' : 'blur(4px)',
          transition:
            'transform 0.34s cubic-bezier(0.33, 1.1, 0.48, 1), box-shadow 0.28s ease-out, border-color 0.28s ease-out',
          transform: shellTransform,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          /* Image is clipped inside `.gel-avatar-image-wrap--full-bleed`; shell must stay
             overflow visible so centered names + text-stroke are not clipped at the oval edge. */
          overflow: 'visible',
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
        {isHovered && !isHoverPreview && (
          <>
            <div
              className="ring-pulse"
              style={{
                position: 'absolute',
                inset: '-12px',
                borderRadius: size === 'tiny' ? 'inherit' : '50%',
                border: `3px solid color-mix(in srgb, ${accentColor} 62%, transparent)`,
                pointerEvents: 'none',
              }}
            />
            <div
              className="ring-pulse"
              style={{
                position: 'absolute',
                inset: '-12px',
                borderRadius: size === 'tiny' ? 'inherit' : '50%',
                border: `2px solid color-mix(in srgb, ${haloColor} 55%, transparent)`,
                pointerEvents: 'none',
                animationDelay: '0.3s',
              }}
            />
          </>
        )}

        {/* Glossy highlight - top left shine */}
        <div
          className="gel-avatar-gloss"
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
            opacity: isHoverPreview ? 0.2 : 1,
            transition: 'opacity 0.25s ease',
          }}
        />

        {/* Secondary highlight - bottom right */}
        <div
          className="gel-avatar-gloss"
          style={{
            position: 'absolute',
            bottom: '15%',
            right: '10%',
            width: '20%',
            height: '15%',
            background: 'radial-gradient(ellipse, rgba(255,255,255,0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
            opacity: isHoverPreview ? 0.15 : 1,
            transition: 'opacity 0.25s ease',
          }}
        />

        {/* Profile Image Container - click image for new cat */}
        <div
          onClick={canRefreshImage ? onImageClick : undefined}
          title={canRefreshImage ? 'Click for new cat' : undefined}
          style={{
            ...(isTinyFullBleed
              ? {
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 0,
                  borderRadius: 'inherit',
                  border: 'none',
                  boxShadow: 'none',
                }
              : {
                  width: imageWrapSize,
                  height: imageWrapSize,
                  borderRadius:
                    size === 'tiny'
                      ? 'calc(var(--gel-inline-border-radius, 14px) * 0.78)'
                      : '50%',
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
                }),
            overflow: 'hidden',
            cursor: disabled ? 'wait' : 'inherit',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: imageWrapBackground,
          }}
          className={`gel-avatar-image-wrap${isActionBubble ? ' gel-avatar-image-wrap--action' : ''}${isTinyFullBleed ? ' gel-avatar-image-wrap--full-bleed' : ''}`}
        >
          {icon ? (
            <span
              className={`gel-avatar-icon${isActionBubble ? ' gel-avatar-icon--action' : ''}`}
              style={{ fontSize: size === 'action' ? '1.7rem' : '2.2rem' }}
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
                objectFit: isHoverPreview ? 'contain' : 'cover',
                transition: 'opacity 0.25s ease',
                opacity: isCatLoading ? 0.7 : 1,
              }}
            />
          )}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background: `
                linear-gradient(
                  180deg,
                  rgba(255, 255, 255, 0.08) 0%,
                  rgba(255, 255, 255, 0) 26%,
                  rgba(6, 8, 20, 0) 54%,
                  rgba(6, 8, 20, 0.24) 74%,
                  rgba(6, 8, 20, 0.76) 100%
                )
              `,
              pointerEvents: 'none',
              opacity: isHoverPreview ? 0.08 : 1,
              transition: 'opacity 0.28s ease',
            }}
          />
          {isCatLoading && user && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.35)',
                borderRadius: isTinyFullBleed || size === 'tiny' ? 'inherit' : '50%',
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
              ...(isTinyFullBleed
                ? {
                    left: 0,
                    right: 0,
                    top: '50%',
                    bottom: 'auto',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    /* Slight +Y nudge: Papyrus caps read optically high at pure 50% */
                    transform: isHovered
                      ? 'translateY(calc(-50% + 0.07em)) scale(1.04)'
                      : 'translateY(calc(-50% + 0.07em))',
                    transformOrigin: 'center center',
                    zIndex: 4,
                  }
                : {
                    left: '50%',
                    bottom: insideNameBottom,
                    transform: isHovered
                      ? 'translate(-50%, 0) scale(1.05)'
                      : 'translate(-50%, 0) scale(1)',
                  }),
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
              WebkitTextStroke: `0.35px color-mix(in srgb, ${haloColor} 40%, transparent)`,
              transition: 'all 0.3s ease-out',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              opacity: isHoverPreview ? 0 : 1,
              width: isTinyFullBleed ? '100%' : 'max-content',
              maxWidth: isTinyFullBleed ? '100%' : insideNameMaxWidth,
              boxSizing: 'border-box',
              overflow: 'visible',
              padding: insideNamePadding,
              borderRadius: '999px',
              background: `
                linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.04) 100%),
                color-mix(in srgb, rgba(8, 10, 24, 0.9) 78%, ${accentColor} 22%)
              `,
              border: `1px solid color-mix(in srgb, ${haloColor} 28%, rgba(255, 255, 255, 0.14))`,
              boxShadow: `
                0 12px 18px rgba(4, 6, 18, 0.28),
                0 0 14px color-mix(in srgb, ${accentColor} 18%, transparent),
                inset 0 1px 0 rgba(255, 255, 255, 0.16)
              `,
              backdropFilter: 'blur(10px) saturate(125%)',
              WebkitBackdropFilter: 'blur(10px) saturate(125%)',
              lineHeight: 1.05,
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
              zIndex: isTinyFullBleed ? 6 : undefined,
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
