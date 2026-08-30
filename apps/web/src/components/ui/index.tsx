/* eslint-disable react-refresh/only-export-components */
import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useReducer,
} from "react";
import type { FC, ReactNode, CSSProperties } from "react";
import { createPortal } from "react-dom";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { motion, useInView } from "motion/react";

import { useProfileSelection, usePinPanel } from "@/app/ProfilePinContext";
import {
  colors,
  shadows,
  spacing,
  typography,
  radius,
  zIndex,
  motion as motionToken,
} from "@/theme/tokens";
import {
  getSyncBannerContent,
  shouldShowSyncBanner,
  type SyncBannerProps,
} from "./lib/syncBanner";
import type {
  User,
  MainTab,
} from "@/shared/types";
import { Spinner, CheckIcon, CrossIcon } from "@/common/Icons";
import {
  useCardTilt,
  mediaBreakpoints,
  useMediaQuery,
  useModalBehavior,
  useAudio,
} from "@/hooks";
import ChromaCollectionGrid from "@/components/effects/ChromaCollectionGrid";
import { USER_PHOTOS } from "@/shared/types";
import {
  getModalCloseButtonStyle,
  getModalOverlayStyle,
  isFocusWithin,
  trapFocusOnTab,
} from "./lib/modalPrimitives";
import {
  WORKSPACE_LOADING_COPY,
  WORKSPACE_TAB_CONTAINER,
  MOVIES_POSTER_GRID_MIN_COL,
  PLACES_GRID_CLASS,
  PLACES_GRID_MIN_COL,
  WORKSPACE_SKELETON_KEYS,
} from "@/utils/workspaceConfig";
import {
  consoleError,
  getErrorMessage,
} from "@/utils";
import { useViewport } from "@/app/providerContexts";
import { MoviesEmptyIllustration } from "./EmptyStateIllustrations";
export { MoviesEmptyIllustration };
import {
  getStremioUrls,
  type StremioMediaObject,
  cn,
  USER_OPTIONS,
  getCatPosterUrl,
} from "@/utils";

interface MediaPosterProps {
  title: string;
  posterUrl?: string;
  year?: string;
  id?: string;
  className?: string;
  priority?: boolean;
}

const CACHED_LOADED_POSTERS = new Set<string>();

export const MediaPoster: React.FC<MediaPosterProps> = ({
  title,
  posterUrl,
  year: _year,
  id,
  className = "",
  priority = false,
}) => {
  const fallbackCatUrl = React.useMemo(() => {
    return getCatPosterUrl(id || title);
  }, [id, title]);

  const [hasImageError, setHasImageError] = React.useState(false);
  const isCatFallback = !posterUrl || hasImageError;
  const activeSrc = isCatFallback ? fallbackCatUrl : posterUrl;

  const [isLoaded, setIsLoaded] = React.useState<boolean>(() => {
    return Boolean(activeSrc && CACHED_LOADED_POSTERS.has(activeSrc));
  });

  React.useEffect(() => {
    setHasImageError(false);
    const initialSrc = posterUrl ? posterUrl : fallbackCatUrl;
    if (initialSrc && CACHED_LOADED_POSTERS.has(initialSrc)) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [posterUrl, fallbackCatUrl]);

  const handleImageError = () => {
    if (!hasImageError && posterUrl) {
      setHasImageError(true);
      setIsLoaded(false);
    } else {
      setIsLoaded(true);
    }
  };

  const handleImageLoad = () => {
    if (activeSrc) {
      CACHED_LOADED_POSTERS.add(activeSrc);
    }
    setIsLoaded(true);
  };

  return (
    <div className={`media-poster-wrap ${isCatFallback ? "is-cat-poster" : ""} ${className}`}>
      {!isLoaded && <div className="media-poster-skeleton" />}
      <img
        src={activeSrc}
        alt={`${title} poster`}
        width={300}
        height={450}
        loading="eager"
        decoding="async"
        fetchPriority={priority ? "high" : undefined}
        className={`media-poster-img ${isLoaded ? "loaded" : ""}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  );
};

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "outlined" | "interactive";
  onClick?: (e?: React.MouseEvent<HTMLDivElement>) => void;
  hover?: boolean;
  glow?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      className = "",
      variant = "default",
      onClick,
      hover = false,
      glow = false,
      style,
      role,
      tabIndex,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const isInteractive =
      typeof onClick === "function" || variant === "interactive";

    return (
      <div
        ref={ref}
        className={`ui-card ui-card--${variant} ${hover ? "ui-card--hover" : ""} ${
          glow ? "ui-card--glow" : ""
        } ${isInteractive ? "ui-card--interactive" : ""} ${className}`.trim()}
        role={isInteractive ? role || "button" : role}
        tabIndex={isInteractive ? (tabIndex ?? 0) : tabIndex}
        style={{
          position: "relative",
          overflow: "hidden",
          cursor: isInteractive ? "pointer" : "default",
          padding: "1.25rem",
          ...style,
        }}
        onClick={onClick}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (!isInteractive || event.defaultPrevented) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onClick?.(event as unknown as React.MouseEvent<HTMLDivElement>);
          }
        }}
        {...props}
      >
        {/* Subtle shine effect for interactive cards */}
        {isInteractive && (
          <div
            className="ui-card__shine"
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 60%)",
              pointerEvents: "none",
              opacity: 0.5,
            }}
          />
        )}
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
  ariaLabel?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      className = "",
      style,
      id: providedId,
      fullWidth = true,
      onFocus,
      onBlur,
      inputRef,
      ariaLabel,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;

    const handleRef = useCallback(
      (node: HTMLInputElement | null) => {
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLInputElement | null>).current =
            node;
        }
        if (typeof inputRef === "function") {
          inputRef(node);
        } else if (inputRef) {
          (
            inputRef as React.MutableRefObject<HTMLInputElement | null>
          ).current = node;
        }
      },
      [ref, inputRef],
    );

    return (
      <div
        className={`ui-input ${fullWidth ? "ui-input--full-width" : ""}`}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: spacing.xs,
          width: fullWidth ? "100%" : "auto",
        }}
      >
        {label && (
          <label
            htmlFor={id}
            style={{
              ...typography.presets.eyebrow,
              color: colors.textSecondary,
              fontSize: typography.fontSize["3xs"],
            }}
          >
            {label}
          </label>
        )}
        <div style={{ position: "relative" }}>
          <input
            ref={handleRef}
            id={id}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            aria-label={ariaLabel || props["aria-label"]}
            className={`ui-input__field ${error ? "ui-input__field--error" : ""} ${className}`.trim()}
            style={{
              width: "100%",
              ...style,
            }}
            onFocus={onFocus}
            onBlur={onBlur}
            {...props}
          />
        </div>
        {error && (
          <span
            id={errorId}
            style={{
              ...typography.presets.caption,
              color: colors.error,
              marginLeft: spacing.xs,
              marginTop: "1px",
            }}
          >
            {error}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      fullWidth = true,
      onFocus,
      onBlur,
      style,
      id: providedId,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: fullWidth ? "100%" : "auto",
        }}
      >
        {label && (
          <label
            htmlFor={id}
            style={{
              ...typography.presets.eyebrow,
              marginBottom: spacing.xs,
              color: isFocused ? colors.accent : colors.textSecondary,
              fontSize: typography.fontSize["3xs"],
              transition: `color ${motionToken.duration.fast} ${motionToken.easing.ease}`,
            }}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          aria-describedby={error ? errorId : undefined}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="ui-textarea"
          style={{
            width: "100%",
            minHeight: "100px",
            padding: `${spacing.sm} ${spacing.md}`,
            background: isFocused
              ? `linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 42%), ${colors.surface1}`
              : `linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 42%), ${colors.surface0}`,
            color: colors.textPrimary,
            border: `1px solid ${error ? colors.error : isFocused ? colors.accent : colors.borderSubtle}`,
            borderRadius: radius.lg,
            fontSize: typography.fontSize.base,
            fontFamily: typography.fontFamilyValue.body,
            lineHeight: typography.lineHeight.normal,
            outline: "none",
            resize: "vertical",
            transition: `all ${motionToken.duration.fast} ${motionToken.easing.ease}`,
            boxShadow: isFocused
              ? shadows.buttonActive
              : "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -8px 14px rgba(0,0,0,0.18)",
            ...style,
          }}
          {...props}
        />
        {error && (
          <span
            id={errorId}
            role="alert"
            style={{
              color: colors.error,
              fontSize: typography.fontSize["3xs"],
              marginTop: spacing.xs,
              fontWeight: typography.fontWeight.medium,
              fontFamily: typography.fontFamilyValue.body,
            }}
          >
            {error}
          </span>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

export interface WorkspaceFeatureSectionProps {
  id: string;
  ariaLabel: string;
  title?: string;
  variant?: "panel" | "embedded";
  bodyClassName?: string;
  children: ReactNode;
}

export const WorkspaceFeatureSectionLoading: FC<{ label: string }> = ({
  label,
}) => (
  <p className="workspace-feature-loading" aria-live="polite" role="status">
    {label}
  </p>
);

export const WorkspaceFeatureSection: FC<WorkspaceFeatureSectionProps> = ({
  id,
  ariaLabel,
  title,
  variant = "panel",
  bodyClassName,
  children,
}) => (
  <section
    id={id}
    className={`workspace-feature-section${variant === "embedded" ? ` is-embedded` : ""}`}
    aria-label={ariaLabel}
  >
    {title ? (
      <header className="workspace-feature-header">
        <h2 className="workspace-feature-title">{title}</h2>
      </header>
    ) : null}
    <div
      className={["workspace-feature-body", bodyClassName]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  </section>
);

interface Props_ProfileMenu {
  onOpenChange?: (isOpen: boolean) => void;
}

export const ChevronIcon: FC = () => (
  <svg
    className="app-header__chevron"
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M3 4.5L6 7.5L9 4.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const LockIcon: FC<{ size?: number }> = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <rect
      x="5"
      y="11"
      width="14"
      height="10"
      rx="2"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M8 11V7a4 4 0 018 0v4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const LogoutIcon: FC = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <polyline
      points="16,17 21,12 16,7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="21"
      y1="12"
      x2="9"
      y2="12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CloseIcon: FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const GearIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export const ProfileMenu: FC<Props_ProfileMenu> = ({ onOpenChange }) => {
  const {
    currentUser,
    activeUsers,
    isDisabled,
    isSavingPin,
    selectionError,
    userHasPin,
    userNeedsPin,
    selectProfile,
    handleLogout,
    handleLogoutUser,
    openPinSettings,
    clearSelectionError,
  } = useProfileSelection();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const toggleSettings = useCallback(
    (next: boolean) => {
      setIsSettingsOpen(next);
      if (!next) clearSelectionError();
      onOpenChange?.(next);
    },
    [clearSelectionError, onOpenChange],
  );

  // Close on outside pointer interaction
  useEffect(() => {
    if (!isSettingsOpen) return;
    const handler = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        triggerRef.current &&
        !menuRef.current.contains(target) &&
        !triggerRef.current.contains(target)
      ) {
        toggleSettings(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [isSettingsOpen, toggleSettings]);

  // Close on Escape
  useEffect(() => {
    if (!isSettingsOpen) return;
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        toggleSettings(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isSettingsOpen, toggleSettings]);

  const handleProfileClick = (profile: User) => {
    const isProfileLoggedIn = (activeUsers || []).includes(profile);
    if (isProfileLoggedIn) {
      handleLogoutUser(profile);
      toggleSettings(false);
      return;
    }
    selectProfile(profile);
    toggleSettings(false);
  };

  const handleSettingsClick = () => {
    openPinSettings();
    toggleSettings(false);
  };

  const handleLogoutClick = () => {
    handleLogout();
    toggleSettings(false);
  };

  const activeProfile = currentUser || (activeUsers && activeUsers.length > 0 ? activeUsers[0] : null);

  return (
    <div className="inline-profiles-container">
      {/* Profiles Switcher Row */}
      <div
        className="profiles-switcher-row"
        role="group"
        aria-label="Switch profile"
      >
        {([...USER_OPTIONS] as User[]).map((profile) => {
          const isProfileLoggedIn = (activeUsers || []).includes(profile);
          const hasPin = userHasPin(profile);
          return (
            <button
              key={profile}
              type="button"
              className={`profile-switcher-btn profile-switcher-btn--${profile.toLowerCase()}${isProfileLoggedIn ? " is-active is-logged-in" : " is-logged-out"}`}
              onClick={() => handleProfileClick(profile)}
              disabled={isDisabled}
              aria-label={
                isProfileLoggedIn
                  ? `${profile} (logged in, click to log out)`
                  : hasPin
                    ? `Log in as ${profile} (PIN protected)`
                    : `Log in as ${profile}`
              }
            >
              <div className="profile-switcher-face-wrap">
                <UserAvatar user={profile} />
              </div>
              <span className="profile-switcher-name sr-only">{profile}</span>
            </button>
          );
        })}

        {/* Settings/Logout Cog Trigger (only when a user is logged in) */}
        {activeProfile && (
          <div className="profile-settings-dropdown-wrap">
            <button
              ref={triggerRef}
              type="button"
              className={`profile-settings-trigger-btn${isSettingsOpen ? " is-open" : ""}`}
              onClick={() => toggleSettings(!isSettingsOpen)}
              aria-expanded={isSettingsOpen}
              aria-haspopup="menu"
              aria-label="Profile options"
            >
              <GearIcon size={16} />
            </button>

            {isSettingsOpen && (
              <>
                <div
                  className="app-header__profile-backdrop"
                  onClick={() => toggleSettings(false)}
                  aria-hidden="true"
                />
                <div
                  ref={menuRef}
                  className="profile-settings-menu"
                  role="menu"
                  aria-label="Profile settings"
                >
                  <div className="profile-settings-header">
                    <span className="profile-settings-title">
                      {activeProfile}
                    </span>
                    <span className="profile-settings-subtitle">
                      Profile Options
                    </span>
                  </div>

                  <div className="profile-settings-section">
                    <button
                      type="button"
                      role="menuitem"
                      className="profile-settings-action-btn"
                      onClick={handleSettingsClick}
                      disabled={isDisabled || isSavingPin}
                    >
                      <LockIcon size={14} />
                      <span>
                        {activeProfile && userNeedsPin(activeProfile)
                          ? "Finish PIN Setup"
                          : activeProfile && userHasPin(activeProfile)
                            ? "Change Security PIN"
                            : "Set Security PIN"}
                      </span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      className="profile-settings-action-btn is-logout"
                      onClick={handleLogoutClick}
                      disabled={isDisabled}
                    >
                      <LogoutIcon />
                      <span>Log out (Switch to Guest)</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {selectionError && (
        <p className="inline-profiles-error" role="alert">
          {selectionError}
        </p>
      )}
    </div>
  );
};

export const ProfilePinPanel: React.FC = () => {
  const { userNeedsPin } = useProfileSelection();
  const {
    pendingUser,
    pinSettingsUser,
    pinMode,
    isVerifying,
    isSavingPin,
    handlePinSubmit,
    handlePinSettingsCancel,
    handlePinSettingsSubmit,
    clearPendingUser,
  } = usePinPanel();

  if (pendingUser) {
    return (
      <PinDialog
        key={`enter-${pendingUser}`}
        isOpen
        user={pendingUser}
        mode="enter"
        isLoading={isVerifying}
        onCancel={clearPendingUser}
        onSubmit={handlePinSubmit}
      />
    );
  }

  if (pinSettingsUser) {
    return (
      <PinDialog
        key={`${pinMode}-${pinSettingsUser}`}
        isOpen
        user={pinSettingsUser}
        mode={pinMode}
        isLoading={isSavingPin}
        onCancel={handlePinSettingsCancel}
        onSubmit={handlePinSettingsSubmit}
        isRequiredSetup={pinMode === "set" && userNeedsPin(pinSettingsUser)}
      />
    );
  }

  return null;
};

interface MediaCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "visited" | "highlighted" | "watched";
  hover?: boolean;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  children,
  variant = "default",
  hover = true,
  className = "",
  ...props
}) => {
  const classes = [
    "media-card",
    variant !== "default" && `media-card--${variant}`,
    hover && "media-card--hover",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText = "Loading...",
      disabled,
      children,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = "",
      style,
      type = "button",
      onClick,
      ...props
    },
    ref,
  ) => {
    const { playClick } = useAudio();
    const isDisabled = disabled || isLoading;
    const buttonType =
      type === "submit" ? "submit" : type === "reset" ? "reset" : "button";

    return (
      <button
        ref={ref}
        type={buttonType}
        className={`ui-button ui-button--${variant} ui-button--${size} ripple-effect ${
          isDisabled ? "ui-button--disabled" : ""
        } ${fullWidth ? "ui-button--full-width" : ""} ${className}`}
        disabled={isDisabled}
        aria-busy={isLoading}
        onClick={(event) => {
          if (!isDisabled) {
            playClick();
          }
          onClick?.(event);
        }}
        style={{
          ...style,
        }}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin"
              style={{ width: "1em", height: "1em" }}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                opacity="0.25"
              />
              <path
                fill="currentColor"
                opacity="0.75"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {loadingText ? (
              <span>{loadingText}</span>
            ) : (
              <span className="sr-only">Loading</span>
            )}
          </>
        ) : (
          <>
            {leftIcon && (
              <span className="ui-button__icon ui-button__icon--left">
                {leftIcon}
              </span>
            )}
            <span className="ui-button__content">{children}</span>
            {rightIcon && (
              <span className="ui-button__icon ui-button__icon--right">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

/**
 * HandWritingText
 *
 * Animates SVG stroke paths to simulate handwriting being drawn on screen.
 * Each child <path> inside the SVG receives a staggered pathLength animation
 * driven by framer-motion so strokes appear one after another.
 *
 * The component exposes an `accentColor` prop that defaults to the app's
 * `--color-accent` CSS variable so it automatically tracks the active theme
 * (movies pink / places teal).
 *
 * Usage:
 *   <HandWritingText>
 *     <svg viewBox="0 0 400 80" ...>
 *       <path d="M 10 40 Q 80 10 160 40 ..." />
 *     </svg>
 *   </HandWritingText>
 *
 * Or use the built-in preset phrases:
 *   <HandWritingText text="Movie night" />
 */

// ---------------------------------------------------------------------------
// Preset SVG paths for common phrases used in the app
// ---------------------------------------------------------------------------

/**
 * Hand-drawn SVG path data for a few preset phrases.
 * Each entry is a tuple of [viewBox, paths[]] where every path is a <path d>
 * string. The paths are designed to look like casual cursive handwriting.
 */
export const PRESET_PATHS: Record<
  string,
  { viewBox: string; paths: string[]; width: number; height: number }
> = {
  "movie night": {
    viewBox: "0 0 340 56",
    width: 340,
    height: 56,
    paths: [
      // M
      "M 8 44 L 8 12 L 22 34 L 36 12 L 36 44",
      // o
      "M 52 28 C 52 18 68 18 68 28 C 68 38 52 38 52 28",
      // v
      "M 76 20 L 84 40 L 92 20",
      // i
      "M 98 20 L 98 40 M 98 14 L 98 16",
      // e
      "M 116 30 L 104 30 C 104 20 120 18 120 28 C 120 40 104 42 104 38",
      // space gap (no path)
      // n
      "M 132 40 L 132 20 C 132 16 148 14 148 22 L 148 40",
      // i
      "M 156 20 L 156 40 M 156 14 L 156 16",
      // g
      "M 176 20 C 176 10 160 10 160 22 C 160 34 176 34 176 22 L 176 44 C 176 50 160 52 160 46",
      // h
      "M 184 12 L 184 40 M 184 26 C 184 20 200 18 200 26 L 200 40",
      // t
      "M 208 16 L 208 40 C 208 44 212 46 216 44 M 204 24 L 218 24",
    ],
  },
  "our picks": {
    viewBox: "0 0 260 56",
    width: 260,
    height: 56,
    paths: [
      // O
      "M 28 28 C 28 12 8 12 8 28 C 8 44 28 44 28 28",
      // u
      "M 36 20 L 36 34 C 36 40 52 40 52 34 L 52 20",
      // r
      "M 60 40 L 60 20 C 62 14 72 16 74 20",
      // space
      // p
      "M 86 20 L 86 48 M 86 20 C 86 10 102 10 102 20 C 102 30 86 32 86 28",
      // i
      "M 110 20 L 110 40 M 110 14 L 110 16",
      // c
      "M 130 22 C 126 16 114 16 114 28 C 114 40 126 42 130 36",
      // k
      "M 138 12 L 138 40 M 138 28 L 150 20 M 138 28 L 150 40",
      // s
      "M 168 22 C 164 16 154 18 154 24 C 154 30 168 28 168 34 C 168 40 158 42 154 38",
    ],
  },
  "watch together": {
    viewBox: "0 0 380 56",
    width: 380,
    height: 56,
    paths: [
      // W
      "M 8 12 L 18 44 L 28 24 L 38 44 L 48 12",
      // a
      "M 68 22 C 68 14 56 14 56 24 C 56 40 72 38 72 28 L 72 40",
      // t
      "M 80 16 L 80 40 C 80 44 84 46 88 44 M 76 24 L 90 24",
      // c
      "M 108 22 C 104 16 92 16 92 28 C 92 40 104 42 108 36",
      // h
      "M 116 12 L 116 40 M 116 26 C 116 20 132 18 132 26 L 132 40",
      // space
      // t
      "M 148 16 L 148 40 C 148 44 152 46 156 44 M 144 24 L 158 24",
      // o
      "M 176 28 C 176 18 160 18 160 28 C 160 38 176 38 176 28",
      // g
      "M 196 20 C 196 10 180 10 180 22 C 180 34 196 34 196 22 L 196 44 C 196 50 180 52 180 46",
      // e
      "M 214 30 L 202 30 C 202 20 218 18 218 28 C 218 40 202 42 202 38",
      // t
      "M 226 16 L 226 40 C 226 44 230 46 234 44 M 222 24 L 236 24",
      // h
      "M 242 12 L 242 40 M 242 26 C 242 20 258 18 258 26 L 258 40",
      // e
      "M 276 30 L 264 30 C 264 20 280 18 280 28 C 280 40 264 42 264 38",
      // r
      "M 288 40 L 288 20 C 290 14 300 16 302 20",
    ],
  },
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HandWritingTextProps {
  /**
   * Preset phrase to render as handwriting. One of the built-in phrases, or
   * omit to provide your own SVG children.
   */
  text?: keyof typeof PRESET_PATHS;
  /**
   * Pass custom SVG children directly when the preset phrases don't cover
   * your use case. The component will animate every <path> inside.
   */
  children?: React.ReactNode;
  /** Override accent color. Defaults to the app's --color-accent token. */
  accentColor?: string;
  /** Stroke width for the paths. Defaults to 2.5. */
  strokeWidth?: number;
  /** Duration (seconds) for each individual stroke. Defaults to 0.6. */
  strokeDuration?: number;
  /** Stagger delay (seconds) between successive strokes. Defaults to 0.12. */
  staggerDelay?: number;
  /** Whether the animation triggers once when the component enters the viewport. */
  triggerOnView?: boolean;
  className?: string;
  svgClassName?: string;
}

// ---------------------------------------------------------------------------
// AnimatedPath — a single motion path
// ---------------------------------------------------------------------------

interface AnimatedPathProps {
  d: string;
  strokeColor: string;
  strokeWidth: number;
  duration: number;
  delay: number;
}

export function AnimatedPath({
  d,
  strokeColor,
  strokeWidth,
  duration,
  delay,
}: AnimatedPathProps) {
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{
        pathLength: {
          delay,
          duration,
          ease: [0.43, 0.13, 0.23, 0.96],
        },
        opacity: {
          delay,
          duration: 0.01,
        },
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// HandWritingText
// ---------------------------------------------------------------------------

export function HandWritingText({
  text,
  children,
  accentColor = "var(--color-accent)",
  strokeWidth = 2.5,
  strokeDuration = 0.6,
  staggerDelay = 0.12,
  triggerOnView = true,
  className,
  svgClassName,
}: HandWritingTextProps) {
  const uid = useId();
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });

  const shouldAnimate = triggerOnView ? isInView : true;

  // ── Preset mode ──────────────────────────────────────────────────────────
  if (text && PRESET_PATHS[text]) {
    const { viewBox, paths, width, height } = PRESET_PATHS[text];

    return (
      <div ref={ref} className={cn("inline-block", className)}>
        <svg
          viewBox={viewBox}
          width={width}
          height={height}
          className={cn("overflow-visible", svgClassName)}
          aria-label={text}
          role="img"
        >
          {shouldAnimate &&
            paths.map((d, i) => (
              <AnimatedPath
                key={`${uid}-${i}`}
                d={d}
                strokeColor={accentColor}
                strokeWidth={strokeWidth}
                duration={strokeDuration}
                delay={i * staggerDelay}
              />
            ))}
        </svg>
      </div>
    );
  }

  // ── Custom children mode ─────────────────────────────────────────────────
  return (
    <div ref={ref} className={cn("inline-block", className)}>
      {shouldAnimate && children}
    </div>
  );
}

export { HandWritingText as Component_hand_writing_text };

export type SortOrder = "recent" | "alpha" | "rating";

export interface BentoSortChipConfig {
  value: SortOrder;
  label: string;
}

export {
  TiltedPosterWall,
  TiltedPosterWallSkeletonItem,
  DriftWallLoading,
  type TiltedPosterWallProps,
} from "./TiltedPosterWall";
export {
  interleaveCollectionItems,
  computePosterMatrix,
} from "./lib/posterMatrix";

import { DriftWallLoading } from "./TiltedPosterWall";

interface WorkspaceTabLoadingProps {
  label: string;
  emoji?: ReactNode;
  children?: ReactNode;
}

export const WorkspaceTabLoading: FC<WorkspaceTabLoadingProps> = ({
  label,
  emoji,
  children,
}) => (
  <div className="workspace-tab-loading" role="status" aria-live="polite">
    <span className="workspace-tab-loading__emoji" aria-hidden="true">
      {emoji ?? <Spinner size={18} />}
    </span>
    <span className="workspace-tab-loading__label">{label}</span>
    {children}
  </div>
);

interface MediaCardWatcherStackProps {
  watchers: string[];
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

export const MediaCardWatcherStack: React.FC<MediaCardWatcherStackProps> = ({
  watchers,
  size = "md",
  showLabel = false,
  className = "",
}) => {
  if (watchers.length === 0) return null;

  return (
    <div className={`media-card-watchers-stack ${className}`.trim()}>
      {watchers.map((user) => (
        <WatcherBadge
          key={user}
          user={user}
          size={size}
          showLabel={showLabel}
          className="media-card-watcher-badge"
        />
      ))}
    </div>
  );
};

// ── WorkspaceSearch Exports ───────────────────────────────────────────────
export {
  WorkspaceSearchShell,
  WorkspaceSearchActions,
  WorkspaceSearchField,
  WorkspaceAutocompletePanel,
  WorkspaceAutocompleteLoading,
  WorkspaceAutocompleteStatus,
  WorkspaceAutocompleteOption,
  WorkspaceAutocompleteCopy,
  WorkspaceAutocompletePosterImage,
  WorkspaceAutocompletePoster,
  WorkspaceAutocompleteGroup,
  WorkspaceAutocompleteNoMatchPanel,
  SearchFieldLensIcon,
  ClearInputIcon,
  SparkleFilterIcon,
} from "./WorkspaceSearch";
export { CurvedInput } from "./CurvedInput";
export type { CurvedInputProps } from "./CurvedInput";
export type {
  WorkspaceSearchShellProps,
  WorkspaceSearchFieldProps,
  WorkspaceAutocompletePanelProps,
  WorkspaceAutocompleteStatusProps,
  WorkspaceAutocompleteOptionProps,
  WorkspaceAutocompleteCopyProps,
  WorkspaceAutocompletePosterProps,
  WorkspaceAutocompleteGroupProps,
  WorkspaceAutocompleteNoMatchPanelProps,
  WorkspaceComboboxConfig,
} from "./WorkspaceSearch";

interface MediaCardMetadataProps {
  items: (string | number | undefined | null)[];
  chips?: string[];
  badge?: string;
  className?: string;
}

export const MediaCardMetadata: React.FC<MediaCardMetadataProps> = ({
  items,
  chips = [],
  badge,
  className = "",
}) => {
  const filteredItems = items.filter(Boolean);

  return (
    <div className={`media-card-metadata ${className}`.trim()}>
      <div className="media-card-metadata__row">
        {filteredItems.map((item, index) => (
          <React.Fragment key={`${item}-${index}`}>
            {index > 0 ? (
              <span className="media-card-metadata__separator">&bull;</span>
            ) : null}
            <span className="media-card-metadata__item">{item}</span>
          </React.Fragment>
        ))}
        {badge && (
          <span
            className="media-card-metadata__badge"
            aria-label={`Badge: ${badge}`}
          >
            {badge}
          </span>
        )}
      </div>
      {chips.length > 0 && (
        <div className="media-card-metadata__chips-row">
          {chips.map((chip) => (
            <span key={chip} className="media-card-metadata__chip">
              {chip}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "primary";
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "danger",
  isLoading = false,
}) => {
  const { playPop, playClick } = useAudio();

  const handleConfirm = () => {
    playClick();
    onConfirm();
  };

  const handleCancel = () => {
    playPop();
    onCancel();
  };

  const variantClass =
    variant === "primary"
      ? "confirm-dialog-content-primary"
      : "confirm-dialog-content-danger";

  return (
    <AlertDialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="confirm-dialog-overlay" />
        <AlertDialog.Content
          className={`confirm-dialog-content ${variantClass}`}
        >
          <AlertDialog.Title className="confirm-dialog-title">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="confirm-dialog-message">
            {message}
          </AlertDialog.Description>
          <div className="confirm-dialog-actions">
            <AlertDialog.Cancel asChild>
              <Button
                variant="ghost"
                onClick={handleCancel}
                disabled={isLoading}
              >
                {cancelText}
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button
                variant={variant}
                onClick={handleConfirm}
                isLoading={isLoading}
              >
                {confirmText}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};

export interface GalleryPhoto {
  id: string | number;
  image: string;
}

const defaultPhotos: GalleryPhoto[] = [
  {
    id: 1,
    image:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 2,
    image:
      "https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 3,
    image:
      "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 4,
    image:
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 5,
    image:
      "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?q=80&w=800&auto=format&fit=crop",
  },
];

export interface InteractiveFolderGalleryProps {
  photos?: GalleryPhoto[];
  folderName?: string;
  dragHintText?: string;
  className?: string;
  /**
   * Accent color used for the glow, folder tab gradient, and photo border
   * highlights. Defaults to the CSS variable `--color-accent` so it
   * automatically tracks the active app theme (movies pink / places teal).
   */
  accentColor?: string;
}

export function InteractiveFolderGallery({
  photos = defaultPhotos,
  folderName = "Photography.gallery",
  dragHintText = "Drag any photo down to close",
  className,
  accentColor = "var(--color-accent)",
}: InteractiveFolderGalleryProps) {
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const [hoverFolder, setHoverFolder] = useState(false);

  return (
    <div
      className={cn("w-full py-32 relative", className)}
      // Inform child inline styles of the resolved accent via a local custom
      // property so they can derive alpha-faded variants from it.
      style={{ ["--gallery-accent" as string]: accentColor }}
    >
      <div className="relative w-full min-h-[500px] flex flex-col items-center justify-center">
        {/* ── Folder shell ─────────────────────────────────────────────── */}
        <div className="relative w-[400px] h-[500px] flex justify-center pointer-events-none z-0">
          {/* Folder back body — uses the app's surface-1 token */}
          <motion.div
            className="absolute bottom-6 w-80 h-56 drop-shadow-2xl"
            animate={{
              opacity: isFolderOpen ? 0 : 1,
              scale: isFolderOpen ? 0.9 : 1,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            {/* Tab — accent-tinted so it reads as "this tab belongs to the app" */}
            <div
              className="absolute top-0 left-0 w-32 h-10 rounded-t-xl border-t border-l border-r"
              style={{
                background: `linear-gradient(to top, var(--color-surface-1), color-mix(in srgb, var(--gallery-accent) 18%, var(--color-surface-2)))`,
                borderColor: "var(--color-border)",
              }}
            />
            {/* Body */}
            <div
              className="absolute top-8 left-0 right-0 bottom-0 rounded-b-xl rounded-tr-xl border"
              style={{
                background: "var(--gradient-card)",
                borderColor: "var(--color-border)",
                boxShadow:
                  "inset 0 0 40px rgba(0,0,0,0.55), var(--chrome-shadow-soft)",
              }}
            />
            {/* Inner depth layer */}
            <div
              className="absolute top-10 left-2 right-2 bottom-2 rounded-lg pointer-events-none"
              style={{ background: "var(--color-surface-0)", opacity: 0.7 }}
            />
            {/* Accent glow edge along the top of the folder body */}
            <div
              className="absolute top-8 left-0 right-0 h-px"
              style={{
                background: `linear-gradient(to right, transparent, color-mix(in srgb, var(--gallery-accent) 60%, transparent), transparent)`,
              }}
            />
          </motion.div>

          {/* ── Photo stack ──────────────────────────────────────────── */}
          <div className="absolute bottom-10 z-10 flex justify-center">
            {photos.map((photo, i) => {
              const offset = i - 2;

              const stackY = hoverFolder ? offset * -10 - 40 : offset * -5;
              const stackX = hoverFolder ? offset * 30 : offset * 3;
              const stackRotate = hoverFolder ? offset * 8 : offset * 3;
              const stackScale = 1 - Math.abs(offset) * 0.03;

              const openY = -130;
              const openX = offset * 130;
              const openRotate = 0;
              const openScale = 1.05;

              return (
                <motion.div
                  key={photo.id}
                  drag={isFolderOpen}
                  dragSnapToOrigin
                  onDragEnd={(_e, info) => {
                    if (info.offset.y > 100 && isFolderOpen) {
                      setIsFolderOpen(false);
                      setHoverFolder(false);
                    }
                  }}
                  className={cn(
                    "absolute bottom-0 w-56 h-72 rounded-xl overflow-hidden origin-bottom",
                    isFolderOpen
                      ? "cursor-grab active:cursor-grabbing pointer-events-auto"
                      : "pointer-events-none",
                  )}
                  style={{
                    // Accent-tinted border instead of plain white/20
                    border: `1px solid color-mix(in srgb, var(--gallery-accent) 35%, var(--color-border))`,
                    boxShadow:
                      "0 20px 40px rgba(0,0,0,0.5), var(--chrome-shadow-soft)",
                  }}
                  animate={
                    !isFolderOpen
                      ? {
                          y: stackY,
                          x: stackX,
                          rotate: stackRotate,
                          scale: stackScale,
                          zIndex: i + 10,
                        }
                      : {
                          y: openY,
                          x: openX,
                          rotate: openRotate,
                          scale: openScale,
                          zIndex: 50,
                        }
                  }
                  whileHover={
                    isFolderOpen
                      ? {
                          scale: openScale + 0.05,
                          zIndex: 100,
                          // Subtle glow on hover matching the app accent
                          filter: `drop-shadow(0 0 12px color-mix(in srgb, var(--gallery-accent) 40%, transparent))`,
                        }
                      : {}
                  }
                  whileDrag={
                    isFolderOpen
                      ? { scale: openScale + 0.1, rotate: 5, zIndex: 150 }
                      : {}
                  }
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                >
                  <img
                    src={photo.image}
                    alt="Gallery item"
                    className="w-full h-full object-cover pointer-events-none"
                  />
                  {/* Subtle gradient overlay so photos don't clash with the dark UI */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.32) 100%)",
                    }}
                  />
                </motion.div>
              );
            })}
          </div>

          {/* ── Folder front cover ───────────────────────────────────── */}
          <motion.div
            className="absolute bottom-0 w-[340px] h-44 cursor-pointer z-20 pointer-events-auto"
            style={{
              transformOrigin: "bottom",
              // Use the app's deep drop-shadow token for the lift effect
              filter: hoverFolder
                ? `drop-shadow(0 -18px 36px color-mix(in srgb, var(--gallery-accent) 22%, transparent))`
                : "drop-shadow(0 -12px 24px rgba(0,0,0,0.7))",
            }}
            animate={{
              opacity: isFolderOpen ? 0 : 1,
              rotateX: hoverFolder ? -25 : 0,
              y: hoverFolder ? 10 : 0,
              pointerEvents: isFolderOpen ? "none" : "auto",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            onMouseEnter={() => setHoverFolder(true)}
            onMouseLeave={() => setHoverFolder(false)}
            onClick={() => setIsFolderOpen(true)}
          >
            <div
              className="w-full h-full rounded-2xl relative overflow-hidden flex items-end justify-center pb-8"
              style={{
                // Align with the modal's own glassmorphism panel surface
                background: "var(--chrome-surface)",
                border: `1px solid var(--color-border)`,
                boxShadow: "var(--chrome-shadow)",
              }}
            >
              {/* Chrome top-highlight matching the modal's own chrome line */}
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{ background: "var(--chrome-highlight-top)" }}
              />

              {/* Subtle accent glow swept across the cover surface */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse 60% 40% at 50% 100%, color-mix(in srgb, var(--gallery-accent) 12%, transparent), transparent)`,
                }}
              />

              {/* Folder name label — uses the app's chrome pill style */}
              <div
                className="relative px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 backdrop-blur-md"
                style={{
                  background:
                    "color-mix(in srgb, var(--color-surface-0) 80%, transparent)",
                  border: `1px solid color-mix(in srgb, var(--gallery-accent) 30%, var(--color-border))`,
                  boxShadow: `0 0 14px color-mix(in srgb, var(--gallery-accent) 18%, transparent)`,
                }}
              >
                {/* Small accent dot — matches the app's badge / pill aesthetic */}
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    background: accentColor,
                    boxShadow: `0 0 6px ${accentColor}`,
                  }}
                />
                <span
                  className="text-sm font-semibold tracking-[var(--letter-spacing-wider)]"
                  style={{
                    color: "var(--color-text-primary)",
                    fontFamily: "var(--font-body)",
                    textTransform: "uppercase",
                    fontSize: "0.72rem",
                  }}
                >
                  {folderName}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Drag-to-close hint ───────────────────────────────────────── */}
        <motion.div
          animate={{ opacity: isFolderOpen ? 1 : 0, y: isFolderOpen ? 0 : 50 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="absolute bottom-10 pointer-events-none"
          style={{
            padding: "0.6rem 1.5rem",
            borderRadius: "999px",
            // Matches the app's floating pill / chrome pill pattern
            background:
              "color-mix(in srgb, var(--color-surface-1) 72%, transparent)",
            border: `1px solid color-mix(in srgb, var(--gallery-accent) 25%, var(--color-border))`,
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            color: "var(--color-text-secondary)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--font-size-xs)",
            fontWeight: 600,
            letterSpacing: "var(--letter-spacing-eyebrow)",
            textTransform: "uppercase",
          }}
        >
          {dragHintText}
        </motion.div>
      </div>
    </div>
  );
}

export { InteractiveFolderGallery as Component_interactive_folder_gallery };

export interface SuggestionCardBaseProps {
  suggestedBy: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  media?: React.ReactNode;
  onAccept: () => void;
  onReject: () => void;
  canRespond?: boolean;
  disableActions?: boolean;
  isProcessing?: boolean;
  details?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  year?: string;
  imdbRating?: string;
}

export const SuggestionCardProcessingOverlay: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: "rgba(0,0,0,0.4)",
      backdropFilter: "blur(2px)",
      zIndex: 10,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Spinner size={32} style={{ color: colors.accent }} />
  </div>
);

export const SuggestionCardBase: React.FC<SuggestionCardBaseProps> = ({
  suggestedBy,
  title,
  subtitle,
  icon,
  media,
  onAccept,
  onReject,
  canRespond = true,
  disableActions = false,
  isProcessing = false,
  details,
  className = "",
  style,
  year,
}) => {
  const actionsDisabled = isProcessing || disableActions || !canRespond;

  if (media) {
    return (
      <div className={`movie-item-container suggestion-item-container`}>
        <Card
          variant="default"
          className={`suggestion-item-card suggestion-item-card--media chroma-card ${className}`.trim()}
          style={{
            padding: 0,
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
            ...style,
          }}
        >
          <MediaCardPosterWrap className="movie-item-poster-wrap">
            {media}
            <div className="movie-item-title-overlay" aria-hidden="true">
              <MediaCardTitle className="movie-item-title-overlay__title">
                {title}
              </MediaCardTitle>
              {year && (
                <div className="movie-item-title-overlay__meta">
                  <span className="movie-item-meta__year">{year}</span>
                </div>
              )}
            </div>
            <button
              type="button"
              className="movie-item-details-hit-area"
              aria-label={`View details for "${title}"`}
            />
            <CardActionRail
              variant="glass"
              primary={
                <CardActionButton
                  isCircle
                  variant="primary"
                  onClick={onAccept}
                  disabled={actionsDisabled}
                  leftIcon={<CheckIcon />}
                  aria-label="Accept suggestion"
                  title="Accept suggestion"
                />
              }
              cluster={
                <CardActionButton
                  isCircle
                  variant="glass"
                  onClick={onReject}
                  disabled={actionsDisabled}
                  leftIcon={<CrossIcon />}
                  aria-label="Reject suggestion"
                  title="Reject suggestion"
                />
              }
            />
          </MediaCardPosterWrap>

          {isProcessing ? <SuggestionCardProcessingOverlay /> : null}
        </Card>
      </div>
    );
  }

  return (
    <Card
      variant="default"
      className={`suggestion-item-card chroma-card ${className}`.trim()}
      style={{
        padding: spacing.md,
        display: "flex",
        flexDirection: "column",
        gap: spacing.sm,
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{ display: "flex", flexDirection: "column", gap: spacing.xs }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div
            className="suggestion-item-card__eyebrow"
            style={{
              ...typography.presets.eyebrow,
              color: colors.accent,
              opacity: 0.8,
            }}
          >
            Suggestion from {suggestedBy}
          </div>
          {icon ? <span style={{ fontSize: "1.2rem" }}>{icon}</span> : null}
        </div>
        <h3
          style={{
            margin: 0,
            ...typography.presets.bodySm,
            fontWeight: typography.fontWeight.semibold,
            color: colors.textPrimary,
          }}
        >
          {title}
        </h3>
        {subtitle ? (
          <p
            style={{
              margin: 0,
              ...typography.presets.caption,
              color: colors.textSecondary,
              fontStyle: "italic",
              lineHeight: 1.4,
              marginTop: spacing.xs,
            }}
          >
            &quot;{subtitle}&quot;
          </p>
        ) : null}
        {details}
      </div>

      <div
        style={{
          display: "flex",
          gap: spacing.xs,
          marginTop: "auto",
          paddingTop: spacing.xs,
        }}
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={onAccept}
          isLoading={isProcessing}
          disabled={actionsDisabled}
          className="suggestion-item-card__button is-accept"
          aria-label="Accept suggestion"
          style={{ padding: 0 }}
        >
          <CheckIcon style={{ width: 16, height: 16 }} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReject}
          disabled={actionsDisabled}
          className="suggestion-item-card__button is-reject"
          aria-label="Reject suggestion"
          style={{ padding: 0 }}
        >
          <CrossIcon style={{ width: 16, height: 16 }} />
        </Button>
      </div>

      {!canRespond ? (
        <p
          className="suggestion-item-card__profile-hint"
          style={{
            margin: 0,
            ...typography.presets.caption,
            color: colors.textSecondary,
            textAlign: "center",
            marginTop: spacing.xs,
          }}
        >
          Pick a profile to review suggestions.
        </p>
      ) : null}

      {isProcessing ? <SuggestionCardProcessingOverlay /> : null}
    </Card>
  );
};

interface MinigameModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  /** Max width of the content box (default 520) */
  maxWidth?: number;
  /** Max height of the content box (default 720) */
  maxHeight?: number;
  children: React.ReactNode;
  /** Accessible label for the dialog */
  ariaLabel?: string;
  /** Prevent dismissal while a critical action is active */
  closeDisabled?: boolean;
  /** Explain why dismissal is temporarily disabled */
  closeDisabledLabel?: string;
}

/**
 * Shared modal for extras (spin wheel, etc.): backdrop, centered box, optional title, close button.
 * Locks body scroll when open. Use for a consistent minigame/popover UX.
 */
export const MinigameModal: React.FC<MinigameModalProps> = ({
  isOpen,
  onClose,
  title,
  maxWidth = 520,
  maxHeight = 720,
  children,
  ariaLabel = "Dialog",
  closeDisabled = false,
  closeDisabledLabel = "Please wait for the current action to finish.",
}) => {
  const isMobileShell = useMediaQuery(mediaBreakpoints.sm);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const { handleClose } = useModalBehavior({
    isOpen,
    onClose,
    closeDisabled,
    containerRef: dialogRef,
    initialFocusRef: closeButtonRef,
  });

  if (!isOpen) return null;

  const overlayAlign = isMobileShell
    ? ("flex-end" as const)
    : ("center" as const);
  const dialogEyebrow = title ? "Quick action" : "Workspace panel";
  const surfaceStyles: CSSProperties = isMobileShell
    ? {
        position: "relative",
        width: "100%",
        maxWidth: "560px",
        height: "auto",
        maxHeight: `min(${maxHeight}px, calc(92dvh - env(safe-area-inset-bottom, 0px)))`,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        overflow: "clip",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, transparent 20%), linear-gradient(180deg, rgba(48, 30, 45, 0.98) 0%, rgba(24, 16, 25, 0.98) 100%)",
        borderRadius: `${radius.xl} ${radius.xl} 0 0`,
        border: `1px solid ${colors.borderSecondary}55`,
        borderBottom: "none",
        boxShadow: `${shadows.floating}, 0 0 0 1px rgba(255,255,255,0.06) inset, 0 0 36px rgba(255,127,198,0.16)`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        animation: `ui-pop ${motionToken.duration.fast} ${motionToken.easing.spring} both`,
      }
    : {
        position: "relative",
        width: "min(100vw, 100%)",
        height: "min(100vh, 100%)",
        maxWidth: `min(${maxWidth}px, 100vw)`,
        maxHeight: `min(${maxHeight}px, 100dvh)`,
        display: "flex",
        flexDirection: "column",
        overflow: "clip",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, transparent 20%), linear-gradient(180deg, rgba(48, 30, 45, 0.98) 0%, rgba(24, 16, 25, 0.98) 100%)",
        borderRadius: radius.xl,
        border: `1px solid ${colors.borderSecondary}55`,
        boxShadow: `${shadows.floating}, 0 0 0 1px rgba(255,255,255,0.06) inset, 0 0 36px rgba(255,127,198,0.16)`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        animation: `ui-pop ${motionToken.duration.fast} ${motionToken.easing.spring} both`,
      };

  return createPortal(
    <div
      style={{
        ...getModalOverlayStyle(
          "rgba(10, 6, 14, 0.64)",
          overlayAlign,
          isMobileShell ? 0 : 0,
        ),
        zIndex: zIndex.modal + 100,
        width: "100%",
        minWidth: "100%",
        maxWidth: "100%",
        minHeight: "100dvh",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        boxSizing: "border-box",
        backgroundImage:
          "radial-gradient(circle at top, rgba(255, 150, 197, 0.14), transparent 30%), radial-gradient(circle at bottom, rgba(149, 220, 255, 0.1), transparent 28%)",
        WebkitBackdropFilter: "blur(10px)",
        backdropFilter: "blur(10px)",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        onClick={closeDisabled ? undefined : handleClose}
        aria-label={closeDisabled ? closeDisabledLabel : "Close dialog"}
        disabled={closeDisabled}
        tabIndex={-1}
        style={{
          position: "absolute",
          inset: 0,
          border: "none",
          padding: 0,
          margin: 0,
          background: "transparent",
          cursor: closeDisabled ? "default" : "pointer",
        }}
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="minigame-modal-surface"
        style={surfaceStyles}
      >
        {/* Header: only rendered when a title is provided; otherwise close floats absolute */}
        {title ? (
          <div
            style={{
              flex: "0 0 auto",
              display: "flex",
              gap: spacing.md,
              alignItems: "center",
              justifyContent: "space-between",
              padding: `${spacing.md} ${spacing.lg}`,
              borderBottom: `1px solid ${colors.borderSecondary}30`,
              minHeight: 48,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 100%)",
            }}
          >
            <div
              style={{
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                gap: "0.15rem",
              }}
            >
              <span
                style={{
                  fontFamily: typography.fontFamilyValue.body,
                  fontSize: typography.fontSize.xs,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(255, 220, 235, 0.68)",
                }}
              >
                {dialogEyebrow}
              </span>
              <h2
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamilyValue.heading,
                  fontSize: typography.fontSize.lg,
                  color: "rgba(255, 245, 249, 0.95)",
                  letterSpacing: typography.letterSpacing.eyebrow,
                  textShadow: shadows.textGlow,
                }}
              >
                {title}
              </h2>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={handleClose}
              aria-label={closeDisabled ? closeDisabledLabel : "Close"}
              title={closeDisabled ? closeDisabledLabel : "Close"}
              disabled={closeDisabled}
              style={{
                width: 40,
                height: 40,
                padding: 0,
                borderRadius: radius.full,
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.08) 100%), rgba(41, 26, 37, 0.74)",
                color: "#fff3f7",
                border: `1px solid ${colors.borderSecondary}45`,
                cursor: closeDisabled ? "not-allowed" : "pointer",
                opacity: closeDisabled ? 0.45 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: shadows.button,
                transition: `all ${motionToken.duration.button} ${motionToken.easing.ease}`,
              }}
              onMouseEnter={(e) => {
                if (!closeDisabled) {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.borderColor = colors.accent;
                }
              }}
              onMouseLeave={(e) => {
                if (!closeDisabled) {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.borderColor = `${colors.borderSecondary}45`;
                }
              }}
              onMouseDown={(e) => {
                if (!closeDisabled)
                  e.currentTarget.style.transform = "scale(0.95)";
              }}
              onMouseUp={(e) => {
                if (!closeDisabled)
                  e.currentTarget.style.transform = "scale(1.05)";
              }}
            >
              <svg
                width={20}
                height={20}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ) : (
          /* No title — close button floats over content */
          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            aria-label={closeDisabled ? closeDisabledLabel : "Close"}
            title={closeDisabled ? closeDisabledLabel : "Close"}
            disabled={closeDisabled}
            style={{
              position: "absolute",
              top: spacing.sm,
              right: spacing.sm,
              zIndex: 10,
              width: 40,
              height: 40,
              padding: 0,
              borderRadius: radius.full,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.08) 100%), rgba(41, 26, 37, 0.74)",
              color: "#fff3f7",
              border: `1px solid ${colors.borderSecondary}45`,
              cursor: closeDisabled ? "not-allowed" : "pointer",
              opacity: closeDisabled ? 0.45 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: shadows.button,
              transition: `all ${motionToken.duration.button} ${motionToken.easing.ease}`,
            }}
            onMouseEnter={(e) => {
              if (!closeDisabled) {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.borderColor = colors.accent;
              }
            }}
            onMouseLeave={(e) => {
              if (!closeDisabled) {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.borderColor = `${colors.borderSecondary}45`;
              }
            }}
            onMouseDown={(e) => {
              if (!closeDisabled)
                e.currentTarget.style.transform = "scale(0.95)";
            }}
            onMouseUp={(e) => {
              if (!closeDisabled)
                e.currentTarget.style.transform = "scale(1.05)";
            }}
          >
            <svg
              width={20}
              height={20}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {/* Content */}
        <div
          className="minigame-modal-content"
          style={{
            position: "relative",
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
            scrollbarGutter: "stable both-edges",
          }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
};

interface Props_UserAvatar {
  user: User | null;
}

/**
 * Renders a user avatar: photo (with initial fallback on error) or
 * a placeholder icon when user is null.
 * Size is controlled by parent CSS context via .app-header__option-avatar.
 */
export const UserAvatar: FC<Props_UserAvatar> = ({ user }) => {
  const [imgFailed, setImgFailed] = useState(false);

  if (!user) {
    return <span className="app-header__avatar-placeholder"></span>;
  }

  const photoUrl = USER_PHOTOS[user];

  if (photoUrl && !imgFailed) {
    return (
      <img
        src={photoUrl}
        alt=""
        className="app-header__avatar-image"
        draggable="false"
        onError={() => setImgFailed(true)}
      />
    );
  }

  return <span className="app-header__avatar-initial">{user.charAt(0)}</span>;
};

export interface WorkspaceTabFallbackProps {
  tab: MainTab;
}

export const WorkspaceTabFallback: FC<WorkspaceTabFallbackProps> = ({
  tab,
}) => {
  const { isMobile } = useViewport();
  if (tab === "movies" || tab === "places") {
    return <DriftWallLoading isMobile={isMobile} fullViewport />;
  }

  const { emoji, label } = WORKSPACE_LOADING_COPY[tab];
  return (
    <div className={WORKSPACE_TAB_CONTAINER[tab]} aria-label={`Loading ${tab}`}>
      <WorkspaceTabLoading emoji={emoji} label={label} />
    </div>
  );
};

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

/**
 * SidebarRail — persistent left navigation rail (Disney+/HBO Max style).
 * Collapsed: 60px icon strip. Expanded: 200px with labels on hover.
 */

// ── SidebarRail Export ──────────────────────────────────────────────
export {
  SidebarRail,
  MessageIcon,
  QuizIcon,
  SpinIcon,
  CloudOfflineIcon,
  SyncRefreshIcon,
  DownloadAppIcon,
  SparklesIcon,
} from "./SidebarRail";
export type { SidebarRailProps, PwaStatus } from "./SidebarRail";

interface StremioButtonProps {
  movie: string | StremioMediaObject;
  variant?: "pill" | "icon" | "full";
  className?: string;
}

export const StremioIcon: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="currentColor"
    className={`stremio-icon ${className}`.trim()}
    aria-hidden="true"
  >
    <path d="M 4 3 Q 4 2 5.5 3 L 20 11.2 Q 21.5 12 20 12.8 L 5.5 21 Q 4 22 4 21 Z" />
  </svg>
);

export const StremioButton: React.FC<StremioButtonProps> = ({
  movie,
  variant = "pill",
  className = "",
}) => {
  const urls = getStremioUrls(movie);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Stop propagation so parent card clicks don't open modals instead
    e.stopPropagation();
  };

  const movieTitle = typeof movie === "string" ? movie : movie.title;

  if (variant === "icon") {
    return (
      <a
        href={urls.appUrl}
        onClick={handleClick}
        className={`stremio-btn stremio-btn-icon ${className}`.trim()}
        title={`Open "${movieTitle}" in Stremio`}
        aria-label={`Open "${movieTitle}" in Stremio`}
        tabIndex={0}
      >
        <StremioIcon />
      </a>
    );
  }

  const variantClass =
    variant === "full" ? "stremio-btn-full" : "stremio-btn-pill";

  return (
    <a
      href={urls.appUrl}
      onClick={handleClick}
      className={`stremio-btn ${variantClass} ${className}`.trim()}
      title={
        urls.hasDirectImdbMatch
          ? `Launch "${movieTitle}" directly in Stremio`
          : `Search "${movieTitle}" in Stremio`
      }
      tabIndex={0}
    >
      <StremioIcon />
      <span>{variant === "full" ? "Watch on Stremio" : "Stremio"}</span>
    </a>
  );
};

export const YoutubeIcon: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="currentColor"
    className={`stremio-icon ${className}`.trim()}
    aria-hidden="true"
  >
    <path d="M21.582,6.186c-0.23-0.86-0.908-1.538-1.768-1.768C18.254,4,12,4,12,4S5.746,4,4.186,4.418c-0.86,0.23-1.538,0.908-1.768,1.768 C2,7.746,2,12,2,12s0,4.254,0.418,5.814c0.23,0.86,0.908,1.538,1.768,1.768C5.746,20,12,20,12,20s6.254,0,7.814-0.418 c0.86-0.23,1.538-0.908,1.768-1.768C22,16.254,22,12,22,12S22,7.746,21.582,6.186z M10,15.464V8.536L16,12L10,15.464z" />
  </svg>
);

export const YoutubeButton: React.FC<{
  url: string;
  movieTitle: string;
  variant?: "pill" | "icon" | "full";
  className?: string;
}> = ({ url, movieTitle, variant = "pill", className = "" }) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
  };

  if (variant === "icon") {
    return (
      <a
        href={url}
        onClick={handleClick}
        target="_blank"
        rel="noopener noreferrer"
        className={`stremio-btn stremio-btn-icon ${className}`.trim()}
        style={{ background: "#FF0000" }}
        title={`Open "${movieTitle}" on YouTube`}
        aria-label={`Open "${movieTitle}" on YouTube`}
        tabIndex={0}
      >
        <YoutubeIcon />
      </a>
    );
  }

  const variantClass =
    variant === "full" ? "stremio-btn-full" : "stremio-btn-pill";

  return (
    <a
      href={url}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      className={`stremio-btn ${variantClass} ${className}`.trim()}
      style={{ background: "#FF0000", border: variant === "full" ? "1px solid #FF0000" : "none" }}
      title={`Open "${movieTitle}" on YouTube`}
      tabIndex={0}
    >
      <YoutubeIcon />
      <span>{variant === "full" ? "Watch on YouTube" : "YouTube"}</span>
    </a>
  );
};

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  closeDisabled?: boolean;
  closeDisabledLabel?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  closeDisabled = false,
  closeDisabledLabel = "This panel cannot be closed right now.",
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const { handleClose } = useModalBehavior({
    isOpen,
    onClose,
    closeDisabled,
    containerRef: sheetRef,
    initialFocusRef: closeButtonRef,
  });

  // Touch swipe-to-dismiss
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isDraggingHandle = useRef(false);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const handleTouchStart = (event: React.TouchEvent) => {
    isDraggingHandle.current = true;
    startY.current = event.touches[0].clientY;
    currentY.current = 0;
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (!isDraggingHandle.current) return;
    const deltaY = event.touches[0].clientY - startY.current;
    if (deltaY > 0) {
      currentY.current = deltaY;
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${deltaY}px)`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isDraggingHandle.current) return;
    if (!closeDisabled && currentY.current > 100) {
      handleClose();
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = "translateY(0)";
    }
    currentY.current = 0;
    isDraggingHandle.current = false;
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        ...getModalOverlayStyle("transparent", "flex-end", 0),
        zIndex: zIndex.modal,
      }}
    >
      <button
        type="button"
        onClick={closeDisabled ? undefined : handleClose}
        aria-label={closeDisabled ? closeDisabledLabel : "Close panel"}
        disabled={closeDisabled}
        tabIndex={-1}
        style={{
          position: "absolute",
          inset: 0,
          border: "none",
          padding: 0,
          margin: 0,
          backgroundColor: "rgba(11, 8, 16, 0.68)",
          backgroundImage:
            "radial-gradient(circle at top, rgba(255, 150, 197, 0.12), transparent 32%), radial-gradient(circle at bottom, rgba(149, 220, 255, 0.08), transparent 30%)",
          backdropFilter: "blur(10px)",
          animation: prefersReducedMotion
            ? undefined
            : "overlay-fade-in 0.2s ease-out",
          cursor: closeDisabled ? "default" : "pointer",
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        tabIndex={closeDisabled ? -1 : undefined}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Bottom sheet"}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "560px",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, transparent 18%), linear-gradient(180deg, rgba(61, 37, 52, 0.98) 0%, rgba(27, 16, 25, 0.96) 100%)",
          borderRadius: `${radius.xl} ${radius.xl} 0 0`,
          border: `1px solid ${colors.borderSecondary}50`,
          borderBottom: "none",
          padding: spacing.lg,
          paddingBottom: `calc(${spacing.lg} + env(safe-area-inset-bottom, 0px))`,
          boxShadow: `${shadows.floating}, 0 0 0 1px rgba(255,255,255,0.06) inset, 0 0 32px rgba(255,127,198,0.14)`,
          animation: prefersReducedMotion
            ? undefined
            : "slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          transition: `transform ${motionToken.duration.fast} ${motionToken.easing.ease}`,
          maxHeight:
            "calc(100dvh - max(0.75rem, env(safe-area-inset-top, 0px)))",
          overflowY: "auto",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
        }}
      >
        {/* Drag handle */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            width: "60px",
            height: "6px",
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0.18) 100%)",
            borderRadius: radius.full,
            margin: "0 auto",
            marginBottom: spacing.md,
            opacity: 0.85,
            boxShadow: shadows.glowStrong,
            cursor: "grab",
            border: "10px solid transparent",
            backgroundClip: "padding-box",
          }}
          aria-hidden="true"
        />

        <button
          ref={closeButtonRef}
          type="button"
          onClick={handleClose}
          aria-label={closeDisabled ? closeDisabledLabel : "Close panel"}
          title={closeDisabled ? closeDisabledLabel : undefined}
          disabled={closeDisabled}
          style={{
            ...getModalCloseButtonStyle(),
            width: "44px",
            height: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: `all ${motionToken.duration.button} ${motionToken.easing.ease}`,
            opacity: closeDisabled ? 0.45 : 1,
            cursor: closeDisabled ? "not-allowed" : "pointer",
            padding: "12px",
          }}
          onMouseEnter={(e) => {
            if (!closeDisabled)
              e.currentTarget.style.backgroundColor = colors.surface3;
          }}
          onMouseLeave={(e) => {
            if (!closeDisabled)
              e.currentTarget.style.backgroundColor = colors.surface2;
          }}
        >
          <CrossIcon size={14} />
        </button>

        {title && (
          <h3
            style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              color: "#fff3f7",
              margin: 0,
              marginBottom: spacing.md,
              textAlign: "center",
              fontFamily: typography.fontFamilyValue.heading,
              letterSpacing: typography.letterSpacing.eyebrow,
              textShadow: shadows.textGlow,
            }}
          >
            {title}
          </h3>
        )}

        <div>{children}</div>
      </div>
    </div>,
    document.body,
  );
};

interface CardTiltShellProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const CardTiltSheen: React.FC = () => (
  <div className="card-tilt-sheen" aria-hidden="true" />
);

export const CardTiltShell: React.FC<CardTiltShellProps> = ({
  children,
  className,
  disabled = false,
}) => {
  const tilt = useCardTilt({ disabled });

  return (
    <div
      ref={tilt.ref}
      className={["card-tilt-wrap", className].filter(Boolean).join(" ")}
      onMouseEnter={tilt.onMouseEnter}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
    >
      {children}
    </div>
  );
};

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onDismiss?: () => void;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
  position?: "top-right" | "top-center" | "bottom-right";
  persistent?: boolean;
}

export const TOAST_STYLES = {
  error: {
    backgroundColor: `${colors.error}30`,
    borderColor: colors.error,
    iconColor: colors.error,
    shadow: `0 4px 12px ${colors.error}40, ${shadows.card}`,
  },
  success: {
    backgroundColor: `${colors.success}30`,
    borderColor: colors.success,
    iconColor: colors.success,
    shadow: `0 4px 12px ${colors.success}40, ${shadows.card}`,
  },
  info: {
    backgroundColor: `${colors.secondary}30`,
    borderColor: colors.secondary,
    iconColor: colors.secondary,
    shadow: `0 4px 12px ${colors.secondary}40, ${shadows.card}`,
  },
} as const;

export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  onDismiss,
  duration = 3500,
  actionLabel,
  onAction,
  // Position is part of the interface for future layout customization
  position: _position = "top-right",
  persistent = false,
}) => {
  const { playSuccess, playError, playPop } = useAudio();
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Play sound based on type
    if (type === "success") playSuccess();
    else if (type === "error") playError();
    else playPop();

    if (duration > 0 && !persistent) {
      const exitTimer = setTimeout(
        () => setIsExiting(true),
        Math.max(0, duration - 250),
      );
      const dismissTimer = setTimeout(() => onDismiss?.(), duration);
      return () => {
        clearTimeout(exitTimer);
        clearTimeout(dismissTimer);
      };
    }
    return undefined;
  }, [duration, onDismiss, persistent, playError, playPop, playSuccess, type]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss?.(), 250);
  };

  const styles = TOAST_STYLES[type] || TOAST_STYLES.info;

  const icon = useMemo(() => {
    switch (type) {
      case "success":
        return (
          <span
            aria-hidden
            style={{
              width: "2rem",
              height: "2rem",
              borderRadius: "999px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "0 0 auto",
              color: styles.iconColor,
              background: `linear-gradient(180deg, ${colors.success}26 0%, ${colors.success}12 100%)`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.18), 0 0 16px ${colors.success}24`,
            }}
          >
            <CheckIcon
              size={18}
              style={{
                color: styles.iconColor,
                filter: `drop-shadow(0 0 4px ${colors.success}60)`,
              }}
            />
          </span>
        );
      case "error":
        return (
          <span
            aria-hidden
            style={{
              width: "2rem",
              height: "2rem",
              borderRadius: "999px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "0 0 auto",
              fontSize: "1rem",
              background: `linear-gradient(180deg, ${colors.error}20 0%, ${colors.error}10 100%)`,
            }}
          >
            ⚠️
          </span>
        );
      case "info":
      default:
        return (
          <span
            aria-hidden
            style={{
              width: "2rem",
              height: "2rem",
              borderRadius: "999px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "0 0 auto",
              fontSize: "1rem",
              background: `linear-gradient(180deg, ${colors.secondary}20 0%, ${colors.secondary}10 100%)`,
            }}
          >
            ℹ️
          </span>
        );
    }
  }, [styles.iconColor, type]);

  return (
    <Card
      variant="elevated"
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      className={`toast-notification toast--${type}`}
      style={{
        width: "min(34rem, calc(100vw - 1.5rem))",
        maxWidth: "100%",
        height: "auto",
        minHeight: "unset",
        alignSelf: "center",
        padding: spacing.md,
        backgroundColor: styles.backgroundColor,
        borderColor: styles.borderColor,
        borderWidth: "2px",
        boxShadow: styles.shadow,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        animation: isExiting
          ? "toast-slide-out 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards"
          : "toast-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: spacing.sm,
          color: colors.textPrimary,
          width: "100%",
          minHeight: "fit-content",
        }}
      >
        {icon}

        <span
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            lineHeight: 1.35,
            wordBreak: "normal",
            overflowWrap: "anywhere",
            flex: "1 1 auto",
            minWidth: 0,
            textShadow: "0 1px 2px rgba(0,0,0,0.4)",
          }}
        >
          {message}
        </span>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: spacing.xs,
            flex: "0 0 auto",
            marginLeft: spacing.xs,
          }}
        >
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={() => {
                onAction();
                handleDismiss();
              }}
              aria-label={actionLabel}
              style={{
                border: `1px solid ${styles.borderColor}`,
                background: "rgba(255,255,255,0.08)",
                color: colors.textPrimary,
                borderRadius: radius.sm,
                padding: `0 ${spacing.sm}`,
                minHeight: "30px",
                cursor: "pointer",
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.semibold,
                letterSpacing: typography.letterSpacing.wide,
                whiteSpace: "nowrap",
                transition: `all ${motionToken.duration.button} ${motionToken.easing.ease}`,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.15)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
              }
            >
              {actionLabel}
            </button>
          )}

          {onDismiss && (
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss notification"
              title="Dismiss notification"
              style={{
                background: "none",
                border: "none",
                color: isExiting ? "transparent" : colors.textSecondary,
                cursor: "pointer",
                padding: spacing.xs,
                fontSize: "1.05rem",
                lineHeight: 1,
                borderRadius: radius.sm,
                transition: `all ${motionToken.duration.button} ${motionToken.easing.ease}`,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = colors.textPrimary)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = colors.textSecondary)
              }
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};

// ============================================================================
// CollectionEmptyState
// ============================================================================

interface CollectionEmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: string;
}

export const CollectionEmptyState: React.FC<CollectionEmptyStateProps> = ({
  padding = spacing["3xl"],
  className = "",
  style,
  children,
  ...props
}) => (
  <div
    className={`collection-empty-state ${className}`.trim()}
    style={{
      gridColumn: "1 / -1",
      textAlign: "center",
      padding,
      color: colors.textTertiary,
      ...typography.presets.bodySm,
      ...style,
    }}
    {...props}
  >
    {children}
  </div>
);

// ============================================================================
// CollectionGrid
// ============================================================================

interface CollectionGridProps extends React.HTMLAttributes<HTMLDivElement> {
  minColumnWidth?: string;
  gap?: string;
}

export const CollectionGrid: React.FC<CollectionGridProps> = ({
  minColumnWidth = "280px",
  gap = spacing.lg,
  className = "",
  style,
  children,
  ...props
}) => (
  <div
    className={`collection-grid ${className}`.trim()}
    style={{
      ["--collection-grid-min-column-width" as string]: minColumnWidth,
      ["--collection-grid-gap" as string]: gap,
      ...style,
    }}
    {...props}
  >
    {children}
  </div>
);

// ============================================================================
// CollectionSection
// ============================================================================

interface CollectionSectionProps extends React.HTMLAttributes<HTMLElement> {
  heading: React.ReactNode;
  count?: number;
  /** When false, renders content only (keeps section id for scroll targets). */
  showHeading?: boolean;
  /** When false, hides the count pill even if `count` is set. */
  showCount?: boolean;
  tone?: "default" | "incoming" | "completed";
  titleClassName?: string;
}

export const CollectionSection: React.FC<CollectionSectionProps> = ({
  heading,
  count,
  showHeading = true,
  showCount,
  tone = "default",
  className = "",
  titleClassName = "",
  style,
  children,
  ...props
}) => {
  const headingClassName = [
    "workspace-section-heading",
    tone === "incoming" ? "workspace-section-heading--incoming" : "",
    tone === "completed" ? "workspace-section-heading--completed" : "",
    titleClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const headingLabel =
    typeof heading === "string" || typeof heading === "number"
      ? String(heading)
      : "Section";
  const shouldShowCount =
    showCount ?? (typeof count === "number" && showHeading);

  return (
    <section
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: showHeading ? spacing.sm : 0,
        ...style,
      }}
      {...props}
    >
      {showHeading ? (
        <h3
          className={headingClassName}
          aria-label={
            typeof count === "number"
              ? `${headingLabel}, ${count} items`
              : undefined
          }
        >
          <span className="workspace-section-heading__content">
            <span className="workspace-section-heading__label">{heading}</span>
            {shouldShowCount ? (
              <span
                className="workspace-section-heading__count"
                aria-hidden="true"
              >
                {count}
              </span>
            ) : null}
          </span>
        </h3>
      ) : null}
      {children}
    </section>
  );
};

interface WorkspaceCollectionLoadingProps {
  tab: MainTab;
  gridClassName?: string;
  minColumnWidth?: string;
  browseLayoutClass?: string;
}

export const WorkspaceCollectionLoading: FC<
  WorkspaceCollectionLoadingProps
> = ({ tab, gridClassName, minColumnWidth, browseLayoutClass = "" }) => {
  const { isMobile } = useViewport();
  const { emoji, label } = WORKSPACE_LOADING_COPY[tab];
  const skeletonKeys = isMobile
    ? WORKSPACE_SKELETON_KEYS[tab].mobile
    : WORKSPACE_SKELETON_KEYS[tab].desktop;

  const resolvedClassName =
    gridClassName ??
    (tab === "places"
      ? PLACES_GRID_CLASS
      : `workspace-content${browseLayoutClass}`);
  const resolvedMinCol =
    minColumnWidth ??
    (tab === "places" ? PLACES_GRID_MIN_COL : MOVIES_POSTER_GRID_MIN_COL);

  return (
    <ChromaCollectionGrid
      className={resolvedClassName}
      minColumnWidth={resolvedMinCol}
    >
      <div className="workspace-loading-grid" aria-busy="true">
        <WorkspaceTabLoading emoji={emoji} label={label} />
        <div className="workspace-loading-grid__cards" aria-hidden="true">
          {skeletonKeys.map((key) => (
            <MovieCardSkeleton key={key} />
          ))}
        </div>
      </div>
    </ChromaCollectionGrid>
  );
};

interface SkeletonProps {
  variant?: "text" | "circular" | "rectangular" | "poster";
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Skeleton loading placeholder with animated shimmer effect.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  variant = "rectangular",
  width,
  height,
  className = "",
  style,
}) => {
  const variantStyles: Record<string, React.CSSProperties> = {
    text: {
      width: width || "100%",
      height: height || "1em",
      borderRadius: radius.sm,
    },
    circular: {
      width: width || "40px",
      height: height || "40px",
      borderRadius: radius.full,
    },
    rectangular: {
      width: width || "100%",
      height: height || "100px",
      borderRadius: radius.md,
    },
    poster: {
      width: width || "100%",
      height: height || "auto",
      aspectRatio: "2/3",
      borderRadius: `${radius.md} ${radius.md} 0 0`,
    },
  };

  return (
    <div
      className={`skeleton ${className}`}
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.04)",
        backgroundImage:
          "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.06), transparent)",
        backgroundSize: "200% 100%",
        animation: "skeleton-shimmer 2.2s infinite ease-in-out",
        ...variantStyles[variant],
        ...style,
      }}
      aria-hidden="true"
    />
  );
};

/**
 * Skeleton for movie cards in grid layout.
 */
export const MovieCardSkeleton: React.FC = () => (
  <div
    style={{
      borderRadius: "1rem",
      overflow: "hidden",
      backgroundColor: "rgba(255, 255, 255, 0.02)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      aspectRatio: "2/3",
      position: "relative",
    }}
  >
    <Skeleton
      variant="poster"
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0 }}
    />
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "1.25rem",
        background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
      }}
    >
      <Skeleton variant="text" width="85%" height="1.1rem" />
      <Skeleton variant="text" width="50%" height="0.7rem" />
    </div>
  </div>
);

export interface BentoStatTileConfig {
  id: string;
  label: string;
  count: number;
  icon: React.ReactNode;
  sectionId: string;
  tone?: "default" | "incoming" | "completed";
}

interface StatTileProps {
  tile: BentoStatTileConfig;
}

export const StatTile: React.FC<StatTileProps> = ({ tile }) => {
  const handleClick = useCallback(() => {
    const el = document.getElementById(tile.sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [tile.sectionId]);

  const toneClass =
    tile.tone === "incoming"
      ? "stat-tile-incoming"
      : tile.tone === "completed"
        ? "stat-tile-completed"
        : "";

  return (
    <button
      type="button"
      className={`stat-tile ${toneClass}`.trim()}
      onClick={handleClick}
      aria-label={`${tile.count} ${tile.label} — tap to jump to section`}
    >
      <span className="stat-tile-icon" aria-hidden="true">
        {tile.icon}
      </span>
      <span className="stat-tile-body">
        <span
          className="stat-tile-count"
          key={tile.count}
          aria-live="polite"
          aria-atomic="true"
        >
          {tile.count}
        </span>
        <span className="stat-tile-label">{tile.label}</span>
      </span>
    </button>
  );
};

export interface MagicToggleOption<T extends string> {
  value: T;
  label: React.ReactNode;
  /** Used when label is icon-only or abbreviated on small screens. */
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}

interface MagicToggleProps<T extends string> {
  options: MagicToggleOption<T>[];
  activeValue: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
}

export function MagicToggle<T extends string>({
  options,
  activeValue,
  onChange,
  ariaLabel,
}: MagicToggleProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const activeIndex = options.findIndex((opt) => opt.value === activeValue);
    if (activeIndex === -1) return;

    const buttons = containerRef.current.querySelectorAll(`.magic-toggle-btn`);
    const activeButton = buttons[activeIndex] as HTMLButtonElement | undefined;

    if (activeButton) {
      setIndicatorStyle({
        left: activeButton.offsetLeft,
        width: activeButton.offsetWidth,
      });
    }
  }, [activeValue, options]);

  const activeOption = options.find((opt) => opt.value === activeValue);
  const isLogout = activeOption?.className?.includes("is-logout") || false;

  return (
    <div
      className="magic-toggle"
      role="group"
      aria-label={ariaLabel}
      ref={containerRef}
    >
      <div
        className={`magic-toggle-indicator${isLogout ? ` is-logout` : ""}`}
        style={{
          transform: `translateX(${indicatorStyle.left}px)`,
          width: `${indicatorStyle.width}px`,
        }}
        aria-hidden="true"
      />
      {options.map((option) => {
        const isActive = activeValue === option.value;
        const optionIsLogout = option.className?.includes("is-logout");
        const btnClasses = [
          "magic-toggle-btn",
          isActive ? "is-active" : "",
          option.disabled ? "is-disabled" : "",
          optionIsLogout ? "is-logout" : "",
          option.className || "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <button
            key={option.value}
            type="button"
            className={btnClasses}
            disabled={option.disabled}
            onPointerDown={(e) => {
              e.preventDefault();
              onChange(option.value);
            }}
            aria-pressed={isActive}
            aria-label={option.ariaLabel}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// WatcherBadge & PinDialog Components (consolidated)
// ============================================================================

const WATCHER_USER_PHOTOS: Record<string, string[]> = {
  Aaron: [
    "/aaron-avatar.png",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSa2Qa_ao3GRvb5R5TyT7lET-s_0iqlHUxWMg&s",
    "https://i.pinimg.com/236x/3e/5b/8d/3e5b8d5105f7570eac355fea06998ba0.jpg",
    "https://preview.redd.it/rbdzmbhsxbw11.png?width=315&format=png&auto=webp&s=6282a8216d66d51684af9efc992b8b423463c941",
  ],
  Electra: [
    "/electra-button.png",
    "/electra-avatar.png",
    "https://i.redd.it/vkmos70wqw641.jpg",
    "https://i.pinimg.com/236x/3e/5b/8d/3e5b8d5105f7570eac355fea06998ba0.jpg",
    "https://preview.redd.it/rbdzmbhsxbw11.png?width=315&format=png&auto=webp&s=6282a8216d66d51684af9efc992b8b423463c941",
  ],
};

interface WatcherBadgePhotoProps {
  user: string;
}

const WatcherBadgePhoto: React.FC<WatcherBadgePhotoProps> = ({ user }) => {
  const [index, setIndex] = React.useState(0);
  const [hasImageError, setHasImageError] = React.useState(false);
  const sources = WATCHER_USER_PHOTOS[user] ?? [];

  React.useEffect(() => {
    setIndex(0);
    setHasImageError(false);
  }, [user]);

  const handleError = () => {
    if (index < sources.length - 1) {
      setIndex((current) => current + 1);
      return;
    }
    setHasImageError(true);
  };

  if (hasImageError || sources.length === 0 || index >= sources.length) {
    return (
      <span className="watcher-badge__avatar-initial">
        {user.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={sources[index]}
      alt={user}
      className="watcher-badge__avatar-photo"
      onError={handleError}
      draggable={false}
    />
  );
};

export interface WatcherBadgeProps {
  user: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "text";
  showLabel?: boolean;
  className?: string;
}

export const WatcherBadge: React.FC<WatcherBadgeProps> = ({
  user,
  size = "md",
  variant = "default",
  showLabel = false,
  className = "",
}) => {
  const badgeClassName = cn(
    "watcher-badge",
    `watcher-badge--${variant}`,
    `watcher-badge--${size}`,
    `watcher-badge--${user.toLowerCase()}`,
    className,
  );

  return (
    <div className={badgeClassName}>
      <div className="watcher-badge__avatar">
        <WatcherBadgePhoto user={user} />
      </div>
      {showLabel ? <span className="watcher-badge__label">{user}</span> : null}
    </div>
  );
};

export const PIN_LENGTH = 4;

export type PinFlowMode = "enter" | "set" | "change";

export type PinPhase =
  | "enter"
  | "set-new"
  | "set-confirm"
  | "change-current"
  | "change-new"
  | "change-confirm";

export interface PinFlowState {
  mode: PinFlowMode;
  phase: PinPhase;
  currentPin: string;
  newPin: string;
  digits: string;
  error: string;
  isShaking: boolean;
}

const phaseForMode = (mode: PinFlowMode): PinPhase => {
  if (mode === "enter") return "enter";
  if (mode === "set") return "set-new";
  return "change-current";
};

const createPinFlowState = (mode: PinFlowMode): PinFlowState => ({
  mode,
  phase: phaseForMode(mode),
  currentPin: "",
  newPin: "",
  digits: "",
  error: "",
  isShaking: false,
});

type PinFlowAction =
  | { type: "reset"; mode: PinFlowMode }
  | { type: "digit"; value: number }
  | { type: "backspace" }
  | { type: "clear-error" }
  | { type: "clear-shake" }
  | { type: "set-error"; message: string }
  | { type: "clear-digits" }
  | { type: "set-digits"; digits: string }
  | { type: "advance-set-new" }
  | { type: "advance-change-current" }
  | { type: "advance-change-new" };

const pinFlowReducer = (
  state: PinFlowState,
  action: PinFlowAction,
): PinFlowState => {
  switch (action.type) {
    case "reset":
      return createPinFlowState(action.mode);
    case "digit": {
      if (state.digits.length >= PIN_LENGTH) {
        return state;
      }
      return {
        ...state,
        digits: `${state.digits}${action.value}`,
        error: "",
      };
    }
    case "backspace":
      return {
        ...state,
        digits: state.digits.slice(0, -1),
        error: "",
      };
    case "clear-error":
      return { ...state, error: "" };
    case "clear-shake":
      return { ...state, isShaking: false };
    case "set-error":
      return {
        ...state,
        error: action.message,
        isShaking: true,
      };
    case "clear-digits":
      return { ...state, digits: "" };
    case "set-digits":
      return {
        ...state,
        digits: action.digits,
        error: "",
      };
    case "advance-set-new":
      return {
        ...state,
        phase: "set-confirm",
        newPin: state.digits,
        digits: "",
        error: "",
      };
    case "advance-change-current":
      return {
        ...state,
        phase: "change-new",
        currentPin: state.digits,
        digits: "",
        error: "",
      };
    case "advance-change-new":
      return {
        ...state,
        phase: "change-confirm",
        newPin: state.digits,
        digits: "",
        error: "",
      };
    default:
      return state;
  }
};

const getPinFlowTitle = (
  state: PinFlowState,
  user: string,
  isRequiredSetup: boolean,
): string => {
  switch (state.phase) {
    case "enter":
      return `Sign in as ${user}`;
    case "set-new":
      return isRequiredSetup ? `Set PIN for ${user}` : `Create PIN for ${user}`;
    case "set-confirm":
      return "Confirm New PIN";
    case "change-current":
      return "Enter Current PIN";
    case "change-new":
      return "Choose New PIN";
    case "change-confirm":
      return "Confirm New PIN";
    default:
      return "Enter PIN";
  }
};

const getPinFlowSubtitle = (
  state: PinFlowState,
  user: string,
  isRequiredSetup: boolean,
): string => {
  switch (state.phase) {
    case "enter":
      return `Enter the 4-digit security PIN for ${user}`;
    case "set-new":
      return isRequiredSetup
        ? "Create a 4-digit PIN to secure your account"
        : "Choose a 4-digit PIN for quick and secure sign-in";
    case "set-confirm":
      return "Re-enter your 4-digit PIN to verify";
    case "change-current":
      return "Enter your existing PIN to verify your identity";
    case "change-new":
      return "Choose a new 4-digit PIN";
    case "change-confirm":
      return "Re-enter your new PIN to confirm";
    default:
      return "Enter your 4-digit PIN";
  }
};

const getPinSubmitLabel = (
  state: PinFlowState,
  isRequiredSetup: boolean,
): string => {
  if (state.phase === "set-confirm" || state.phase === "change-confirm") {
    return isRequiredSetup ? "Save & Sign in" : "Save PIN";
  }
  return "Continue";
};

const needsPinSubmitButton = (mode: PinFlowMode): boolean => mode !== "enter";

const KEYPAD_LETTERS: Record<number, string> = {
  1: "",
  2: "ABC",
  3: "DEF",
  4: "GHI",
  5: "JKL",
  6: "MNO",
  7: "PQRS",
  8: "TUV",
  9: "WXYZ",
  0: "",
};

export interface PinDialogProps {
  isOpen: boolean;
  user: User;
  mode: PinFlowMode;
  onSubmit: (pin: string, newPin?: string) => Promise<boolean>;
  onCancel: () => void;
  isLoading?: boolean;
  isRequiredSetup?: boolean;
}

export const PinDialog: React.FC<PinDialogProps> = ({
  isOpen,
  user,
  mode,
  onSubmit,
  onCancel,
  isLoading = false,
  isRequiredSetup = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [flow, dispatch] = useReducer(pinFlowReducer, mode, createPinFlowState);
  const { playKeypad, playError } = useAudio();

  useEffect(() => {
    dispatch({ type: "reset", mode });
  }, [isOpen, mode, user]);

  useEffect(() => {
    if (!isOpen) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(id);
  }, [isOpen, flow.phase]);

  useEffect(() => {
    if (!flow.isShaking) return;
    const id = window.setTimeout(() => dispatch({ type: "clear-shake" }), 450);
    return () => window.clearTimeout(id);
  }, [flow.isShaking]);

  const reportError = useCallback(
    (message: string, clearDigits = false) => {
      dispatch({ type: "set-error", message });
      playError();
      if (clearDigits) {
        dispatch({ type: "clear-digits" });
      }
    },
    [playError],
  );

  const appendDigit = useCallback(
    (value: number) => {
      if (flow.digits.length >= PIN_LENGTH || isLoading) return;
      dispatch({ type: "digit", value });
      playKeypad(value);
    },
    [flow.digits.length, isLoading, playKeypad],
  );

  const backspace = useCallback(() => {
    if (flow.digits.length === 0 || isLoading) return;
    dispatch({ type: "backspace" });
    playKeypad("del");
  }, [flow.digits.length, isLoading, playKeypad]);

  // Global Escape, Tab trapping, and physical keyboard entry listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!isLoading) {
          onCancel();
        }
        return;
      }
      if (
        event.key === "Tab" &&
        formRef.current &&
        isFocusWithin(formRef.current)
      ) {
        trapFocusOnTab(event, formRef.current);
        return;
      }
      if (!isLoading) {
        if (event.key >= "0" && event.key <= "9") {
          event.preventDefault();
          appendDigit(Number(event.key));
        } else if (event.key === "Backspace" || event.key === "Delete") {
          event.preventDefault();
          backspace();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onCancel, appendDigit, backspace]);

  useEffect(() => {
    if (
      flow.mode !== "enter" ||
      flow.digits.length !== PIN_LENGTH ||
      isLoading
    ) {
      return;
    }
    const id = window.setTimeout(async () => {
      dispatch({ type: "clear-error" });
      try {
        const success = await onSubmit(flow.digits);
        if (!success) {
          reportError("Incorrect PIN. Please try again.", true);
        }
      } catch (submitError) {
        consoleError("PIN submit failed:", submitError);
        reportError(
          getErrorMessage(
            submitError,
            "Unable to verify PIN. Please try again.",
          ),
          true,
        );
      }
    }, 100);
    return () => window.clearTimeout(id);
  }, [flow.digits, flow.mode, isLoading, onSubmit, reportError]);

  const handlePinInput = (nextValue: string) => {
    const sanitized = nextValue.replace(/\D/g, "").slice(0, PIN_LENGTH);
    if (sanitized === flow.digits) return;

    if (sanitized.length > flow.digits.length) {
      const digit = Number(sanitized[sanitized.length - 1]);
      if (!Number.isNaN(digit)) playKeypad(digit);
    } else if (sanitized.length < flow.digits.length) {
      playKeypad("del");
    }

    dispatch({ type: "set-digits", digits: sanitized });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (flow.mode === "enter" || isLoading) return;

    dispatch({ type: "clear-error" });

    try {
      if (flow.phase === "set-new" || flow.phase === "change-new") {
        if (flow.digits.length !== PIN_LENGTH) {
          reportError(`Please enter all ${PIN_LENGTH} digits`);
          return;
        }
        dispatch({
          type:
            flow.phase === "set-new" ? "advance-set-new" : "advance-change-new",
        });
        return;
      }

      if (flow.phase === "set-confirm") {
        if (flow.digits !== flow.newPin) {
          reportError("PINs do not match. Try again.", true);
          return;
        }
        const success = await onSubmit(flow.newPin);
        if (!success) reportError("Unable to save PIN. Please try again.");
        return;
      }

      if (flow.phase === "change-current") {
        if (flow.digits.length !== PIN_LENGTH) {
          reportError(`Please enter ${PIN_LENGTH} digits`);
          return;
        }
        const success = await onSubmit(flow.digits);
        if (!success) {
          reportError("Current PIN is incorrect", true);
          return;
        }
        dispatch({ type: "advance-change-current" });
        return;
      }

      if (flow.phase === "change-confirm") {
        if (flow.digits !== flow.newPin) {
          reportError("PINs do not match. Try again.", true);
          return;
        }
        const success = await onSubmit(flow.currentPin, flow.newPin);
        if (!success) reportError("Unable to update PIN. Please try again.");
      }
    } catch (submitError) {
      consoleError("PIN submit failed:", submitError);
      reportError(
        getErrorMessage(submitError, "Unable to save PIN. Please try again."),
      );
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) {
      onCancel();
    }
  };

  if (!isOpen) return null;

  const title = getPinFlowTitle(flow, user, isRequiredSetup);
  const subtitle = getPinFlowSubtitle(flow, user, isRequiredSetup);
  const submitLabel = getPinSubmitLabel(flow, isRequiredSetup);

  return createPortal(
    <div
      className="fixed inset-0 z-[10100] flex items-end justify-end p-3 sm:p-5 bg-black/25 backdrop-blur-[3px] animate-in fade-in duration-200"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <section
        className="w-full max-w-[21.5rem] mb-16 sm:mb-20 mr-1 sm:mr-3 p-5 rounded-3xl border border-white/15 bg-slate-950/90 shadow-[0_25px_60px_-10px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.1)] backdrop-blur-2xl animate-in zoom-in-95 slide-in-from-bottom-8 duration-250 outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pin-dialog-title"
        aria-describedby="pin-dialog-desc"
      >
        <form ref={formRef} className="w-full flex flex-col gap-[1.1rem]" onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="pin-dialog-avatar-wrap shrink-0 w-11 h-11 overflow-visible flex items-center justify-center bg-transparent">
                <UserAvatar user={user} />
              </div>
              <div className="min-w-0 flex flex-col gap-[0.15rem]">
                <h2 id="pin-dialog-title" className="m-0 text-[1.05rem] font-bold text-slate-50 tracking-[-0.01em] whitespace-nowrap overflow-hidden text-ellipsis">
                  {title}
                </h2>
                <p id="pin-dialog-desc" className="m-0 text-[0.78rem] text-slate-400 leading-snug">
                  {subtitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="shrink-0 w-8 h-8 rounded-full border border-transparent bg-slate-800/60 text-slate-400 flex items-center justify-center cursor-pointer transition-all hover:bg-slate-700/80 hover:text-slate-50 hover:border-white/10 hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-indigo-500"
              onClick={onCancel}
              disabled={isLoading}
              aria-label={
                isRequiredSetup ? "Exit to guest mode" : "Close dialog"
              }
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* PIN slots */}
          <div
            className={`flex justify-center gap-3 my-1 ${flow.isShaking ? " animate-[pinShake_0.45s_cubic-bezier(0.36,0.07,0.19,0.97)_both]" : ""}`}
            aria-hidden="true"
          >
            {Array.from({ length: PIN_LENGTH }).map((_, index) => {
              const filled = index < flow.digits.length;
              const active = flow.digits.length === index;
              return (
                <div
                  key={index}
                  className={[
                    "w-11 h-12 rounded-xl border-[1.5px] border-slate-700 bg-slate-800/60 flex items-center justify-center transition-all duration-200 shadow-inner",
                    filled ? "border-indigo-500/65 bg-indigo-500/20" : "",
                    active ? "border-indigo-500 bg-indigo-500/10 shadow-[0_0_0_3px_rgba(99,102,241,0.25)] -translate-y-[2px]" : "",
                    flow.error ? "border-red-500 bg-red-500/15 shadow-[0_0_0_2px_rgba(239,68,68,0.2)]" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {filled ? (
                    <span className="w-[0.85rem] h-[0.85rem] rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,1)] animate-in zoom-in duration-150" />
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Error Message */}
          {flow.error ? (
            <div className="flex items-center justify-center gap-[0.4rem] min-h-[1.25rem]">
              <svg
                className="text-red-500 shrink-0"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="m-0 text-[0.8rem] font-medium text-red-500 text-center" role="alert">
                {flow.error}
              </p>
            </div>
          ) : (
            <div className="h-[1.25rem]" aria-hidden="true" />
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-[0.55rem]" role="group" aria-label="Keypad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, "cancel", 0, "del"].map(
              (num, _index) => {
                if (num === "cancel") {
                  return (
                    <button
                      key="cancel"
                      type="button"
                      className="h-[3.25rem] rounded-xl border border-slate-700 bg-slate-800/75 text-slate-50 flex flex-col items-center justify-center cursor-pointer select-none transition-all duration-150 shadow-[0_2px_6px_rgba(0,0,0,0.2)] hover:bg-indigo-500/15 hover:border-indigo-500/40 hover:-translate-y-[1px] active:scale-95 active:bg-indigo-500/25 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-[0.8rem] font-medium text-slate-400 hover:text-slate-50 hover:bg-slate-600/50"
                      onClick={onCancel}
                      disabled={isLoading}
                      aria-label="Cancel"
                    >
                      Cancel
                    </button>
                  );
                }
                if (num === "del") {
                  return (
                    <button
                      key="del"
                      type="button"
                      className="h-[3.25rem] rounded-xl border border-slate-700 bg-slate-800/75 text-slate-50 flex flex-col items-center justify-center cursor-pointer select-none transition-all duration-150 shadow-[0_2px_6px_rgba(0,0,0,0.2)] hover:bg-indigo-500/15 hover:border-indigo-500/40 hover:-translate-y-[1px] active:scale-95 active:bg-indigo-500/25 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-400 hover:text-slate-50"
                      onClick={backspace}
                      aria-label="Delete last digit"
                      disabled={isLoading || flow.digits.length === 0}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                        <line x1="18" y1="9" x2="12" y2="15" />
                        <line x1="12" y1="9" x2="18" y2="15" />
                      </svg>
                    </button>
                  );
                }
                const digit = num as number;
                const letters = KEYPAD_LETTERS[digit];
                return (
                  <button
                    key={digit}
                    type="button"
                    className="h-[3.25rem] rounded-xl border border-slate-700 bg-slate-800/75 text-slate-50 flex flex-col items-center justify-center cursor-pointer select-none transition-all duration-150 shadow-[0_2px_6px_rgba(0,0,0,0.2)] hover:bg-indigo-500/15 hover:border-indigo-500/40 hover:-translate-y-[1px] active:scale-95 active:bg-indigo-500/25 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={() => appendDigit(digit)}
                    disabled={isLoading || flow.digits.length >= PIN_LENGTH}
                    aria-label={`${digit} ${letters}`}
                  >
                    <span className="text-[1.25rem] font-semibold leading-none">{digit}</span>
                    {letters ? (
                      <span className="text-[0.55rem] font-semibold tracking-[0.08em] text-slate-500 mt-[0.15rem] leading-none">{letters}</span>
                    ) : null}
                  </button>
                );
              },
            )}
          </div>

          <input
            ref={inputRef}
            className="sr-only"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={PIN_LENGTH}
            value={flow.digits}
            onChange={(event) => handlePinInput(event.target.value)}
            disabled={isLoading}
            autoComplete="off"
            aria-label="PIN entry"
          />

          {needsPinSubmitButton(flow.mode) ? (
            <div className="mt-1">
              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                disabled={flow.digits.length !== PIN_LENGTH || isLoading}
                isLoading={isLoading}
                loadingText="Saving…"
              >
                {submitLabel}
              </Button>
            </div>
          ) : null}
        </form>
      </section>
    </div>,
    document.body,
  );
};

export const SyncBanner: FC<SyncBannerProps> = ({
  isBlocked,
  onRetry,
  label,
}) => {
  if (!shouldShowSyncBanner({ isBlocked, label })) return null;
  const content = getSyncBannerContent({ isBlocked, label });
  return (
    <div
      role={content.tone === "assertive" ? "alert" : "status"}
      aria-live={content.tone}
      className={cn(
        "sync-banner px-4 py-2 text-xs flex items-center justify-between gap-2 border-b",
        isBlocked
          ? "bg-rose-950/60 text-rose-200 border-rose-800/40"
          : "bg-amber-950/60 text-amber-200 border-amber-800/40",
      )}
    >
      <span className="font-mono truncate">
        {content.description || label || content.title}
      </span>
      {onRetry && (
        <button
          type="button"
          onClick={() => void onRetry()}
          className="px-2 py-0.5 rounded text-xs font-semibold bg-white/10 hover:bg-white/20 transition"
        >
          Retry
        </button>
      )}
    </div>
  );
};

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  ariaLabel?: string;
  closeDisabled?: boolean;
  closeDisabledLabel?: string;
  variant?: "centered" | "bottom-sheet" | string;
  maxWidth?: number | string;
  maxHeight?: number | string;
}

export const Modal: FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  ariaLabel,
  closeDisabled = false,
  closeDisabledLabel = "Action in progress",
  variant: _variant,
  maxWidth = 520,
  maxHeight,
}) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !closeDisabled) {
        e.preventDefault();
        onClose();
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, closeDisabled, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || (typeof title === "string" ? title : "Dialog")}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
    >
      <button
        type="button"
        className="fixed inset-0 w-full h-full bg-transparent border-0 p-0 cursor-default"
        onClick={closeDisabled ? undefined : onClose}
        disabled={closeDisabled}
        aria-label={closeDisabled ? closeDisabledLabel : "Close dialog backdrop"}
        tabIndex={-1}
      />
      <div
        className="relative z-10 w-full bg-[#0b101b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 overscroll-contain"
        style={{
          maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth,
          maxHeight:
            typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
        }}
      >
        {title && (
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <h2 className="text-lg font-bold text-white tracking-wide">
              {title}
            </h2>
            <button
              type="button"
              onClick={closeDisabled ? undefined : onClose}
              disabled={closeDisabled}
              className="text-white/60 hover:text-white transition p-1 disabled:opacity-40"
              aria-label={closeDisabled ? closeDisabledLabel : "Close dialog"}
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
};

export interface UseModalBaseResult {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  dialogRef: React.RefObject<HTMLDivElement | null>;
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
  playPop: () => void;
}

export const useModalBase = (
  isOpen = false,
  onClose?: () => void,
): UseModalBaseResult => {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const { playPop } = useAudio();

  const handleClose = useCallback(() => {
    playPop();
    onClose?.();
  }, [playPop, onClose]);

  return {
    isOpen,
    open: () => {},
    close: handleClose,
    dialogRef,
    closeButtonRef,
    playPop,
  };
};

export { DriftWall } from "./DriftWall";
export type { DriftWallProps, DriftWallItem } from "./DriftWall";

export const MediaCardPosterWrap = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, ref) => <div ref={ref} {...props} />);
MediaCardPosterWrap.displayName = "MediaCardPosterWrap";

export const MediaCardTitle: FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  ...props
}) => <h3 {...props}>{children}</h3>;

export interface MediaCardRatingBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  rating?: string;
}

export const MediaCardRatingBadge: FC<MediaCardRatingBadgeProps> = ({
  rating,
  children,
  className,
  ...props
}) => (
  <span className={cn("media-card-rating-badge", className)} {...props}>
    {children ?? (rating ? `★ ${rating}` : null)}
  </span>
);

export const MediaCardCover: FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  ...props
}) => <div {...props}>{children}</div>;

export const MediaCardInfo: FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  ...props
}) => <div {...props}>{children}</div>;

export const MediaCardOverlay: FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  ...props
}) => <div {...props}>{children}</div>;

export const MediaCardSubtext: FC<
  React.HTMLAttributes<HTMLParagraphElement>
> = ({ children, ...props }) => <p {...props}>{children}</p>;

export interface MediaCardStatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  label?: string;
  icon?: ReactNode;
}

export const MediaCardStatusBadge: FC<MediaCardStatusBadgeProps> = ({
  label,
  icon,
  children,
  className,
  ...props
}) => (
  <span className={cn("media-card-status-badge", className)} {...props}>
    {icon && <span className="media-card-status-badge__icon mr-1">{icon}</span>}
    {children ?? label}
  </span>
);

export { PageFlip } from "./PageFlip";
export type { PageFlipProps, PageFlipLeaf, PageFlipEase } from "./PageFlip";

