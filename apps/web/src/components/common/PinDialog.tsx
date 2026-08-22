import React, { useCallback, useEffect, useReducer, useRef } from "react";
import { createPortal } from "react-dom";
import type { User } from "@/shared/types";
import { isFocusWithin, trapFocusOnTab } from "@/components/ui/lib/modalPrimitives";
import { useAudio } from "@/hooks/useAudio";
import Button from "@/components/ui/Button";
import UserAvatar from "@/ui/UserAvatar";
import { getErrorMessage, consoleError } from "@/utils";

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

const needsPinSubmitButton = (mode: PinFlowMode): boolean =>
  mode !== "enter";

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

interface PinDialogProps {
  isOpen: boolean;
  user: User;
  mode: PinFlowMode;
  onSubmit: (pin: string, newPin?: string) => Promise<boolean>;
  onCancel: () => void;
  isLoading?: boolean;
  isRequiredSetup?: boolean;
}

const PinDialog: React.FC<PinDialogProps> = ({
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
  const [flow, dispatch] = useReducer(
    pinFlowReducer,
    mode,
    createPinFlowState,
  );
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
    const id = window.setTimeout(
      () => dispatch({ type: "clear-shake" }),
      450,
    );
    return () => window.clearTimeout(id);
  }, [flow.isShaking]);

  const reportError = useCallback((message: string, clearDigits = false) => {
    dispatch({ type: "set-error", message });
    playError();
    if (clearDigits) {
      dispatch({ type: "clear-digits" });
    }
  }, [playError]);

  const appendDigit = useCallback((value: number) => {
    if (flow.digits.length >= PIN_LENGTH || isLoading) return;
    dispatch({ type: "digit", value });
    playKeypad(value);
  }, [flow.digits.length, isLoading, playKeypad]);

  const backspace = useCallback(() => {
    if (flow.digits.length === 0 || isLoading) return;
    dispatch({ type: "backspace" });
    playKeypad("del");
  }, [flow.digits.length, isLoading, playKeypad]);

  // Global Escape, Tab trapping, and physical keyboard entry listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!isLoading) {
          onCancel();
        }
        return;
      }
      if (event.key === "Tab" && formRef.current && isFocusWithin(formRef.current)) {
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
    if (flow.mode !== "enter" || flow.digits.length !== PIN_LENGTH || isLoading) {
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
          getErrorMessage(submitError, "Unable to verify PIN. Please try again."),
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
            flow.phase === "set-new"
              ? "advance-set-new"
              : "advance-change-new",
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
      className="pin-panel__overlay"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <section
        className="pin-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pin-dialog-title"
        aria-describedby="pin-dialog-desc"
      >
        <form ref={formRef} className="pin-panel__form" onSubmit={handleSubmit}>
          {/* Header */}
          <div className="pin-panel__header">
            <div className="pin-panel__identity">
              <div className="pin-panel__avatar">
                <UserAvatar user={user} />
              </div>
              <div className="pin-panel__titles">
                <h2 id="pin-dialog-title" className="pin-panel__title">
                  {title}
                </h2>
                <p id="pin-dialog-desc" className="pin-panel__subtitle">
                  {subtitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="pin-panel__close-btn"
              onClick={onCancel}
              disabled={isLoading}
              aria-label={isRequiredSetup ? "Exit to guest mode" : "Close dialog"}
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
            className={`pin-panel__dots${flow.isShaking ? " pin-panel__dots--shake" : ""}`}
            aria-hidden="true"
          >
            {Array.from({ length: PIN_LENGTH }).map((_, index) => {
              const filled = index < flow.digits.length;
              const active = flow.digits.length === index;
              return (
                <div
                  key={index}
                  className={[
                    "pin-panel__dot",
                    filled ? "pin-panel__dot--filled" : "",
                    active ? "pin-panel__dot--active" : "",
                    flow.error ? "pin-panel__dot--error" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {filled ? (
                    <span className="pin-panel__dot-indicator" />
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Error Message */}
          {flow.error ? (
            <div className="pin-panel__error-wrap">
              <svg
                className="pin-panel__error-icon"
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
              <p className="pin-panel__error" role="alert">
                {flow.error}
              </p>
            </div>
          ) : (
            <div className="pin-panel__error-placeholder" aria-hidden="true" />
          )}

          {/* Keypad */}
          <div className="pin-panel__keypad" role="group" aria-label="Keypad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, "cancel", 0, "del"].map((num, _index) => {
              if (num === "cancel") {
                return (
                  <button
                    key="cancel"
                    type="button"
                    className="pin-panel__key pin-panel__key--cancel"
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
                    className="pin-panel__key pin-panel__key--del"
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
                  className="pin-panel__key pin-panel__key--digit"
                  onClick={() => appendDigit(digit)}
                  disabled={isLoading || flow.digits.length >= PIN_LENGTH}
                  aria-label={`${digit} ${letters}`}
                >
                  <span className="pin-panel__key-number">{digit}</span>
                  {letters ? (
                    <span className="pin-panel__key-letters">{letters}</span>
                  ) : null}
                </button>
              );
            })}
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
            <div className="pin-panel__actions">
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
    document.body
  );
};

export default PinDialog;
