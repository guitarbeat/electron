import React, { useState, useEffect } from 'react';
import { colors, radius } from '../../design-system/tokens';

interface ImageWithFallbackProps {
  sources: string[];
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  sources,
  alt,
  className,
  style,
}) => {
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  // When the sources prop changes (often due to a key change in the parent),
  // this component re-mounts and state is naturally reset.
  // This useEffect ensures we reset state even if the component isn't re-mounted.
  useEffect(() => {
    setCurrentSourceIndex(0);
    setHasError(false);
  }, [sources]);

  const handleError = () => {
    if (currentSourceIndex < sources.length - 1) {
      setCurrentSourceIndex(currentSourceIndex + 1);
    } else {
      setHasError(true); // All sources failed
    }
  };

  if (hasError || !sources || sources.length === 0 || !sources[currentSourceIndex]) {
    // Render a placeholder if all images fail or if there are no sources
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: colors.surfaceElevated,
          borderRadius: radius.md,
          ...style,
        }}
      >
        <span
          style={{ fontSize: '2rem', color: colors.textTertiary }}
          role="img"
          aria-label="Image failed to load"
        >
          ?
        </span>
      </div>
    );
  }

  return (
    <img
      src={sources[currentSourceIndex]}
      alt={alt}
      className={className}
      style={{
        maxWidth: '100%',
        height: 'auto',
        ...style,
      }}
      onError={handleError}
      loading="lazy"
    />
  );
};

export default ImageWithFallback;
