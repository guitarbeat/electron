import React from 'react';

interface IconProps {
  className?: string;
  style?: React.CSSProperties;
  size?: number | string;
}

const getIconStyles = (
  size?: number | string,
  style?: React.CSSProperties
): React.CSSProperties => {
  if (!size) return style || {};
  const sizePx = typeof size === 'number' ? `${size}px` : size;
  return { width: sizePx, height: sizePx, ...style };
};

interface StrokeIconProps extends IconProps {
  children: React.ReactNode;
}

const StrokeIcon: React.FC<StrokeIconProps> = ({ className = 'w-6 h-6', style, size, children }) => (
  <svg
    className={className}
    style={getIconStyles(size, style)}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    {children}
  </svg>
);

const path = (d: string) => (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
);

export const CheckIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>{path('M5 13l4 4L19 7')}</StrokeIcon>
);

export const TrashIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    {path('M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16')}
  </StrokeIcon>
);

export const EyeIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    {path('M15 12a3 3 0 11-6 0 3 3 0 016 0z')}
    {path('M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z')}
  </StrokeIcon>
);

export const EyeOffIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    {path('M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21')}
  </StrokeIcon>
);

export const MagicWandIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    {path('M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z')}
  </StrokeIcon>
);

export const QuickActionsIcon: React.FC<IconProps> = ({
  className = 'w-6 h-6',
  style,
  size,
}) => (
  <svg
    className={className}
    style={getIconStyles(size, style)}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="4.75" y="5" width="14.5" height="3.2" rx="1.6" fill="currentColor" opacity="0.96" />
    <rect x="7.1" y="10.4" width="9.8" height="3.2" rx="1.6" fill="currentColor" opacity="0.76" />
    <rect x="4.75" y="15.8" width="14.5" height="3.2" rx="1.6" fill="currentColor" opacity="0.96" />
  </svg>
);

export const FilmIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    {path('M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-9 0V1m10 3V1m0 3l1 1v16a2 2 0 01-2 2H6a2 2 0 01-2-2V5l1-1z')}
  </StrokeIcon>
);

export const PlusIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>{path('M12 6v6m0 0v6m0-6h6m-6 0H6')}</StrokeIcon>
);

export const ShareIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    {path('M8.75 12a3.25 3.25 0 110-6.5 3.25 3.25 0 010 6.5z')}
    {path('M15.25 18.5a3.25 3.25 0 110-6.5 3.25 3.25 0 010 6.5z')}
    {path('M14.5 8.25l-4 2.5')}
    {path('M10.5 13.25l4 2.5')}
  </StrokeIcon>
);

export const ArrowLeftIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>{path('M10 19l-7-7m0 0l7-7m-7 7h18')}</StrokeIcon>
);

export const CrossIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>{path('M6 18L18 6M6 6l12 12')}</StrokeIcon>
);

export const SearchIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>{path('M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z')}</StrokeIcon>
);

export const Spinner: React.FC<IconProps> = ({ className = 'w-6 h-6', style, size }) => (
  <svg
    className={`animate-spin ${className}`}
    style={getIconStyles(size, style)}
    fill="none"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);
