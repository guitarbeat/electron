/**
 * Loading States Components
 * Provides consistent loading indicators and skeleton screens for better UX
 */

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = '#0984e3',
  className = ''
}) => {
  const sizeMap = {
    sm: { width: '16px', height: '16px', borderWidth: '2px' },
    md: { width: '24px', height: '24px', borderWidth: '3px' },
    lg: { width: '32px', height: '32px', borderWidth: '4px' },
  };

  const currentSize = sizeMap[size];

  return (
    <div 
      className={`loading-spinner ${className}`}
      style={{
        ...currentSize,
        border: `${currentSize.borderWidth} solid rgba(0,0,0,0.1)`,
        borderTop: `${currentSize.borderWidth} solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}
    />
  );
};

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  animation?: 'pulse' | 'wave' | 'none';
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1em',
  className = '',
  variant = 'text',
  animation = 'pulse',
  style = {},
}) => {
  const variantStyles = {
    text: { borderRadius: '4px' },
    rectangular: { borderRadius: '8px' },
    circular: { borderRadius: '50%' },
  };

  const animationStyles = {
    pulse: {
      animation: 'pulse 1.5s ease-in-out infinite',
    },
    wave: {
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'wave 1.5s ease-in-out infinite',
    },
    none: {},
  };

  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        backgroundColor: animation === 'pulse' ? '#f0f0f0' : undefined,
        ...variantStyles[variant],
        ...animationStyles[animation],
        ...style,
      }}
    />
  );
};

interface LoadingCardProps {
  title?: boolean;
  subtitle?: boolean;
  text?: number;
  image?: boolean;
  className?: string;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({
  title = true,
  subtitle = false,
  text = 2,
  image = false,
  className = '',
}) => {
  return (
    <div className={`loading-card ${className}`} style={{ padding: '16px' }}>
      {image && (
        <Skeleton 
          variant="rectangular" 
          height="200px" 
          style={{ marginBottom: '16px' }} 
        />
      )}
      
      {title && (
        <Skeleton 
          width="60%" 
          height="1.5em" 
          style={{ marginBottom: '8px' }} 
        />
      )}
      
      {subtitle && (
        <Skeleton 
          width="40%" 
          height="1em" 
          style={{ marginBottom: '12px' }} 
        />
      )}
      
      {Array.from({ length: text }).map((_, index) => (
        <Skeleton 
          key={index}
          width={index === text - 1 ? '80%' : '100%'} 
          height="1em" 
          style={{ marginBottom: '4px' }} 
        />
      ))}
    </div>
  );
};

interface LoadingListProps {
  count?: number;
  itemHeight?: string;
  className?: string;
}

export const LoadingList: React.FC<LoadingListProps> = ({
  count = 5,
  itemHeight = '60px',
  className = '',
}) => {
  return (
    <div className={`loading-list ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Skeleton 
            variant="circular" 
            width="40px" 
            height="40px" 
            style={{ marginRight: '12px' }} 
          />
          <div style={{ flex: 1 }}>
            <Skeleton 
              width="70%" 
              height="1em" 
              style={{ marginBottom: '4px' }} 
            />
            <Skeleton 
              width="50%" 
              height="0.8em" 
            />
          </div>
        </div>
      ))}
    </div>
  );
};

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  spinnerSize?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'Loading...',
  spinnerSize = 'lg',
  children,
  className = '',
}) => {
  return (
    <div className={`loading-overlay-container ${className}`} style={{ position: 'relative' }}>
      {children}
      
      {isLoading && (
        <div
          className="loading-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <LoadingSpinner size={spinnerSize} />
          <p style={{ 
            marginTop: '12px', 
            color: '#666', 
            fontSize: '14px',
            textAlign: 'center' 
          }}>
            {message}
          </p>
        </div>
      )}
    </div>
  );
};

interface LoadingProgressProps {
  progress: number;
  message?: string;
  showPercentage?: boolean;
  className?: string;
}

export const LoadingProgress: React.FC<LoadingProgressProps> = ({
  progress,
  message,
  showPercentage = true,
  className = '',
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={`loading-progress ${className}`} style={{ width: '100%' }}>
      {message && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: '8px',
          fontSize: '14px',
          color: '#666' 
        }}>
          <span>{message}</span>
          {showPercentage && <span>{Math.round(clampedProgress)}%</span>}
        </div>
      )}
      
      <div style={{
        width: '100%',
        height: '8px',
        backgroundColor: '#f0f0f0',
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        <div
          style={{
            height: '100%',
            backgroundColor: '#0984e3',
            borderRadius: '4px',
            width: `${clampedProgress}%`,
            transition: 'width 0.3s ease-out',
          }}
        />
      </div>
    </div>
  );
};

// Add CSS animations
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.4; }
      100% { opacity: 1; }
    }
    
    @keyframes wave {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  document.head.appendChild(style);
}
