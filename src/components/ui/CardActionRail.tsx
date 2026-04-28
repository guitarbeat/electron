import React from 'react';

interface CardActionRailProps {
  primary?: React.ReactNode;
  secondary?: React.ReactNode;
  cluster?: React.ReactNode;
  className?: string;
}

export const CardActionRail: React.FC<CardActionRailProps> = ({
  primary,
  secondary,
  cluster,
  className = '',
}) => {
  return (
    <div className={`workspace-card-actions ${className}`.trim()}>
      {primary && (
        <div className="workspace-card-actions__row workspace-card-actions__row--primary">
          {primary}
        </div>
      )}
      {(secondary || cluster) && (
        <div className="workspace-card-actions__row workspace-card-actions__row--secondary">
          {secondary}
          {cluster && (
            <div className="workspace-card-actions__cluster">
              {cluster}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export interface CardActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
  isCompact?: boolean;
  isExpansive?: boolean;
  leftIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export const CardActionButton: React.FC<CardActionButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  isCompact = false,
  isExpansive = false,
  leftIcon,
  className = '',
  children,
  ...props
}) => {
  const classes = [
    'workspace-card-action',
    `workspace-card-action--${variant}`,
    isCompact && 'workspace-card-action--compact',
    isExpansive && 'workspace-card-action--expansive',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={classes} {...props}>
      {leftIcon}
      {children && <span className="workspace-card-action__text">{children}</span>}
    </button>
  );
};

export default CardActionRail;
