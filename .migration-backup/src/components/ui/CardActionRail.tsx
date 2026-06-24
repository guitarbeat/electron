import React from "react";

interface CardActionRailProps {
  primary?: React.ReactNode;
  secondary?: React.ReactNode;
  cluster?: React.ReactNode;
  className?: string;
  variant?: "glass" | "default" | "external";
}

export const CardActionRail: React.FC<CardActionRailProps> = ({
  primary,
  secondary,
  cluster,
  className = "",
  variant = "glass",
}) => {
  if (variant === "external") {
    return (
      <div className={`workspace-card-rail-external ${className}`.trim()}>
        <div className="workspace-card-rail-external__primary">{primary}</div>
        <div className="workspace-card-rail-external__secondary">
          {secondary}
        </div>
        <div className="workspace-card-rail-external__secondary">{cluster}</div>
      </div>
    );
  }

  if (variant === "default") {
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
              <div className="workspace-card-actions__cluster">{cluster}</div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`workspace-card-rail workspace-card-rail--glass ${className}`.trim()}
    >
      <div className="workspace-card-rail__inner">
        <div className="workspace-card-rail__side">{secondary}</div>
        <div className="workspace-card-rail__center">{primary}</div>
        <div className="workspace-card-rail__side">{cluster}</div>
      </div>
    </div>
  );
};

export interface CardActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "glass" | "outline";
  size?: "sm" | "md" | "lg";
  isCompact?: boolean;
  isExpansive?: boolean;
  isCircle?: boolean;
  leftIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export const CardActionButton: React.FC<CardActionButtonProps> = ({
  variant = "secondary",
  size = "md",
  isCompact = false,
  isExpansive = false,
  isCircle = false,
  leftIcon,
  className = "",
  children,
  ...props
}) => {
  const classes = [
    "workspace-card-action",
    `workspace-card-action--${variant}`,
    `workspace-card-action--size-${size}`,
    isCompact && "workspace-card-action--compact",
    isExpansive && "workspace-card-action--expansive",
    isCircle && "workspace-card-action--circle",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" className={classes} {...props}>
      {leftIcon}
      {children && (
        <span className="workspace-card-action__text">{children}</span>
      )}
    </button>
  );
};

export default CardActionRail;
