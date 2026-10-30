import React, { forwardRef } from "react";

// Re-exports from sibling components
export { ProfileMenu } from "./ProfileMenu";
export { DriftWall } from "./DriftWall";
export type { DriftWallItem, DriftWallProps } from "./DriftWall";
export { FrameEffect, ViewportFrame } from "./FrameEffect";
export type { FrameEffectProps } from "./FrameEffect";
export { PageFlip } from "./PageFlip";
export type { PageFlipLeaf, PageFlipProps } from "./PageFlip";
export {
  TiltedPosterWall,
  TiltedPosterWallSkeletonItem,
  DriftWallLoading,
} from "./TiltedPosterWall";
export type { TiltedPosterWallProps } from "./TiltedPosterWall";

// Additional UI Types
export interface MagicToggleOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface BentoSortChipConfig {
  id: string;
  label: string;
}

export interface BentoStatTileConfig {
  id: string;
  label: string;
  value: string | number;
}

export type SortOrder = "asc" | "desc";

// Button Component
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      children,
      className = "",
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={`ui-btn ui-btn--${variant} ui-btn--${size} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? <span className="ui-spinner" aria-hidden="true" /> : children}
      </button>
    );
  },
);
Button.displayName = "Button";

// Input Component
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    return (
      <div className="ui-input-wrapper" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {label ? (
          <label
            htmlFor={inputId}
            className="ui-input-label"
            style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-secondary, rgba(255, 255, 255, 0.7))" }}
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={`ui-input ${error ? "ui-input--error" : ""} ${className}`}
          style={{
            padding: "0.5rem 0.75rem",
            borderRadius: "0.5rem",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            background: "rgba(15, 23, 42, 0.6)",
            color: "#ffffff",
            fontSize: "0.875rem",
            outline: "none",
          }}
          {...props}
        />
        {error ? (
          <span className="ui-input-error" style={{ fontSize: "0.75rem", color: "#f87171" }}>
            {error}
          </span>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";

// Modal Component
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  ariaLabel?: string;
  closeDisabled?: boolean;
  closeDisabledLabel?: string;
  variant?: "centered" | "bottom-sheet";
  children?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  ariaLabel,
  closeDisabled = false,
  closeDisabledLabel,
  variant = "centered",
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={`ui-modal-wrapper ui-modal-wrapper--${variant}`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: variant === "bottom-sheet" ? "flex-end" : "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || title}
    >
      <button
        type="button"
        aria-label="Close modal backdrop"
        className={`ui-modal-backdrop ui-modal-backdrop--${variant}`}
        style={{
          position: "absolute",
          inset: 0,
          border: "none",
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(8px)",
          cursor: closeDisabled ? "not-allowed" : "pointer",
        }}
        onClick={() => {
          if (!closeDisabled) onClose();
        }}
      />
      <div
        className={`ui-modal-content ui-modal-content--${variant}`}
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "32rem",
          backgroundColor: "#0f172a",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "1rem",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
          overflow: "hidden",
          color: "#ffffff",
        }}
      >
        {title ? (
          <div
            className="ui-modal-header"
            style={{
              padding: "1rem 1.25rem",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>{title}</h3>
            <button
              type="button"
              onClick={onClose}
              disabled={closeDisabled}
              title={closeDisabled ? closeDisabledLabel : "Close"}
              aria-label={closeDisabled ? closeDisabledLabel : "Close modal"}
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(255, 255, 255, 0.6)",
                fontSize: "1.25rem",
                cursor: closeDisabled ? "not-allowed" : "pointer",
                padding: "0.25rem",
              }}
            >
              ✕
            </button>
          </div>
        ) : null}
        <div className="ui-modal-body">{children}</div>
      </div>
    </div>
  );
};

// StremioButton & YoutubeButton
export const StremioButton: React.FC<{ href?: string; onClick?: () => void; className?: string; children?: React.ReactNode }> = ({
  children = "Watch on Stremio",
  className = "",
  ...props
}) => (
  <button type="button" className={`stremio-btn ${className}`} {...props}>
    {children}
  </button>
);

export const YoutubeButton: React.FC<{ href?: string; onClick?: () => void; className?: string; children?: React.ReactNode }> = ({
  children = "Trailer",
  className = "",
  ...props
}) => (
  <button type="button" className={`youtube-btn ${className}`} {...props}>
    {children}
  </button>
);

// Cards & Posters
export const SuggestionCardBase: React.FC<{ className?: string; children?: React.ReactNode }> = ({
  children,
  className = "",
}) => <div className={`suggestion-card-base ${className}`}>{children}</div>;

export const MediaPoster: React.FC<{ src?: string; alt?: string; className?: string }> = ({
  src,
  alt = "",
  className = "",
}) => (
  <img
    src={src}
    alt={alt}
    className={`media-poster ${className}`}
    loading="lazy"
    onError={(e) => {
      (e.currentTarget as HTMLImageElement).style.opacity = "0.5";
    }}
  />
);

export const Card: React.FC<{ className?: string; children?: React.ReactNode; onClick?: () => void }> = ({
  children,
  className = "",
  onClick,
}) => {
  if (onClick) {
    return (
      <button type="button" className={`ui-card ${className}`} onClick={onClick} style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: 0 }}>
        {children}
      </button>
    );
  }
  return <div className={`ui-card ${className}`}>{children}</div>;
};

export const MediaCardPosterWrap: React.FC<{ className?: string; children?: React.ReactNode }> = ({
  children,
  className = "",
}) => <div className={`media-card-poster-wrap ${className}`}>{children}</div>;

// Workspace Search & Autocomplete Primitives
export const WorkspaceSearchActions: React.FC<{ className?: string; children?: React.ReactNode }> = ({
  children,
  className = "",
}) => <div className={`workspace-search-actions ${className}`}>{children}</div>;

export const WorkspaceAutocompletePanel: React.FC<{ className?: string; children?: React.ReactNode }> = ({
  children,
  className = "",
}) => <div className={`workspace-autocomplete-panel ${className}`}>{children}</div>;

export const WorkspaceAutocompleteGroup: React.FC<{ label?: string; children?: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="workspace-autocomplete-group">
    {label ? <div className="workspace-autocomplete-group-label">{label}</div> : null}
    {children}
  </div>
);

export const WorkspaceAutocompleteOption: React.FC<{
  isActive?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
}> = ({ isActive, onClick, children, className = "" }) => (
  <button
    type="button"
    className={`workspace-autocomplete-option ${isActive ? "is-active" : ""} ${className}`}
    onClick={onClick}
    role="option"
    aria-selected={isActive}
    style={{ width: "100%", textAlign: "left", background: "none", border: "none" }}
  >
    {children}
  </button>
);

export const WorkspaceAutocompleteCopy: React.FC<{ title?: string; subtitle?: string; children?: React.ReactNode }> = ({
  title,
  subtitle,
  children,
}) => (
  <div className="workspace-autocomplete-copy">
    {title ? <div className="workspace-autocomplete-title">{title}</div> : null}
    {subtitle ? <div className="workspace-autocomplete-subtitle">{subtitle}</div> : null}
    {children}
  </div>
);

export const WorkspaceAutocompletePoster: React.FC<{ src?: string; alt?: string }> = ({ src, alt = "" }) => (
  <div className="workspace-autocomplete-poster-wrap">
    <img src={src} alt={alt} className="workspace-autocomplete-poster" />
  </div>
);

export const WorkspaceAutocompleteLoading: React.FC<{ label?: string }> = ({ label = "Searching..." }) => (
  <div className="workspace-autocomplete-loading">{label}</div>
);

export const WorkspaceAutocompleteStatus: React.FC<{ label?: string }> = ({ label }) => (
  <div className="workspace-autocomplete-status">{label}</div>
);
