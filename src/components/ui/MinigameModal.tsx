import React, { useRef } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import {
  colors,
  spacing,
  shadows,
  typography,
  radius,
  zIndex,
  motion,
} from "@/theme/tokens";
import { getModalOverlayStyle } from "./lib/modalPrimitives";
import { useModalBehavior } from "@/hooks/useModalBehavior";
import { mediaBreakpoints, useMediaQuery } from "@/hooks/useMediaQuery";

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
const MinigameModal: React.FC<MinigameModalProps> = ({
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
        animation: `ui-pop ${motion.duration.fast} ${motion.easing.spring} both`,
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
        animation: `ui-pop ${motion.duration.fast} ${motion.easing.spring} both`,
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
                transition: `all ${motion.duration.button} ${motion.easing.ease}`,
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
              transition: `all ${motion.duration.button} ${motion.easing.ease}`,
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

export default MinigameModal;
