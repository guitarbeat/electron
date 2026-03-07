import React, { useState, useEffect } from 'react';

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
    const [currentIndex, setCurrentIndex] = useState(0);
    const [hasError, setHasError] = useState(false);

    const validSources = sources.filter((s): s is string => typeof s === 'string' && s.length > 0);

    useEffect(() => {
        setCurrentIndex(0);
        setHasError(false);
    }, [sources]);

    const handleError = () => {
        if (currentIndex < validSources.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setHasError(true);
        }
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
                    ...props.style
                }}
            >
                {fallbackElement || <span style={{ opacity: 0.5, fontSize: '0.8em' }}>{alt || 'No Image'}</span>}
            </div>
        );
    }

    return (
        <img
            {...props}
            src={validSources[currentIndex]}
            alt={alt}
            onError={handleError}
        />
    );
};

export default ImageWithFallback;
