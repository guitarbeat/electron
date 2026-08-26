import React, { useEffect, useReducer, useRef } from "react";
import type { User } from "@/shared/types";
import { isFocusWithin } from "@/components/ui/lib/modalPrimitives";
import { useAudio } from "@/hooks/useAudio";
import Button from "@/components/ui/Button";
import { getErrorMessage, consoleError } from "@/utils";
import {
  PIN_LENGTH,
  createPinFlowState,
  getPinFlowTitle,
  getPinSubmitLabel,
  needsPinSubmitButton,
  pinFlowReducer,
  type PinFlowMode,
} from "./pinFlowReducer";
import "./PinDialog.css";

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
  const submittedRef = useRef(false);
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;
  const [flow, dispatch] = useReducer(
    pinFlowReducer,
    mode,
    createPinFlowState,
  );
  const { playKeypad, playError } = useAudio();

  useEffect(() => {
    dispatch({ type: "reset", mode });
    submittedRef.current = false;
  }, [isOpen, mode, user]);

  useEffect(() => {
    if (!isOpen) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 100);
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

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFocusWithin(formRef.current)) {
        event.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  const reportError = (message: string, clearDigits = false) => {
    dispatch({ type: "set-error", message });
    playError();
    if (clearDigits) {
      dispatch({ type: "clear-digits" });
    }
  };

  useEffect(() => {
    if (flow.mode !== "enter" || flow.digits.length !== PIN_LENGTH || isLoading || submittedRef.current) {
      return;
    }
    const id = window.setTimeout(async () => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      dispatch({ type: "clear-error" });
      try {
        const success = await onSubmitRef.current(flow.digits);
        if (!success) {
          submittedRef.current = false;
          reportError("Incorrect PIN", true);
        }
      } catch (submitError) {
        submittedRef.current = false;
        consoleError("PIN submit failed:", submitError);
        reportError(
          getErrorMessage(submitError, "Unable to verify PIN. Please try again."),
          true,
        );
      }
    }, 100);
    return () => window.clearTimeout(id);
  }, [flow.digits, flow.mode, isLoading, playError]);

  const appendDigit = (value: number) => {
    if (flow.digits.length >= PIN_LENGTH) return;
    dispatch({ type: "digit", value });
    playKeypad(value);
  };

  const backspace = () => {
    if (flow.digits.length === 0) return;
    dispatch({ type: "backspace" });
    playKeypad("del");
  };

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
    if (flow.mode === "enter") return;

    dispatch({ type: "clear-error" });

    try {
      if (flow.phase === "set-new" || flow.phase === "change-new") {
        if (flow.digits.length !== PIN_LENGTH) {
          reportError(`Enter ${PIN_LENGTH} digits`);
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
          reportError("PINs do not match", true);
          return;
        }
        const success = await onSubmit(flow.newPin);
        if (!success) reportError("Unable to save PIN");
        return;
      }

      if (flow.phase === "change-current") {
        if (flow.digits.length !== PIN_LENGTH) {
          reportError(`Enter ${PIN_LENGTH} digits`);
          return;
        }
        const success = await onSubmit(flow.digits);
        if (!success) {
          reportError("Incorrect PIN", true);
          return;
        }
        dispatch({ type: "advance-change-current" });
        return;
      }

      if (flow.phase === "change-confirm") {
        if (flow.digits !== flow.newPin) {
          reportError("PINs do not match", true);
          return;
        }
        const success = await onSubmit(flow.currentPin, flow.newPin);
        if (!success) reportError("Unable to update PIN");
      }
    } catch (submitError) {
      consoleError("PIN submit failed:", submitError);
      reportError(
        getErrorMessage(submitError, "Unable to save PIN. Please try again."),
      );
    }
  };

  if (!isOpen) return null;

  const title = getPinFlowTitle(flow, user, isRequiredSetup);
  const submitLabel = getPinSubmitLabel(flow, isRequiredSetup);

  return (
    <section className="pin-panel"  aria-labelledby="pin-dialog-title">
      <form ref={formRef} className="pin-panel__form" onSubmit={handleSubmit}>
        <div className="pin-panel__header">
          <h2 id="pin-dialog-title" className="pin-panel__title">
            {title}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="pin-panel__cancel-btn"
            onClick={onCancel}
            disabled={isLoading}
          >
            {isRequiredSetup ? "Log out" : "Cancel"}
          </Button>
        </div>

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
              />
            );
          })}
        </div>

        <div className="pin-panel__keypad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "del"].map((num, index) => {
            if (num === null) {
              return <div key={`empty-${index}`} aria-hidden="true" />;
            }
            if (num === "del") {
              return (
                <button
                  key="del"
                  type="button"
                  className="pin-panel__key pin-panel__key--del"
                  onClick={backspace}
                  aria-label="Delete last digit"
                  disabled={isLoading}
                >
                  Del
                </button>
              );
            }
            return (
              <button
                key={num}
                type="button"
                className="pin-panel__key"
                onClick={() => appendDigit(num as number)}
                disabled={isLoading}
              >
                {num}
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

        {flow.error ? (
          <p className="pin-panel__error" role="alert">
            {flow.error}
          </p>
        ) : null}

        {needsPinSubmitButton(flow.mode) ? (
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
        ) : null}
      </form>
    </section>
  );
};

export default PinDialog;
