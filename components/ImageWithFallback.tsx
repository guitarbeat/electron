import React, { useState, useEffect } from 'react';

interface ImageWithFallbackProps {
  sources: string[];
  alt: string;
  className?: string;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ sources, alt, className }) => {
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
        <div className={`flex items-center justify-center w-full h-full bg-gray-800/50 rounded-lg ${className}`}>
            <span className="text-4xl text-gray-500" role="img" aria-label="Image failed to load">?</span>
        </div>
    );
  }

  return (
    <img
      src={sources[currentSourceIndex]}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
};

export default ImageWithFallback;
