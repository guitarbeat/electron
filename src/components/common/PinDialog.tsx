import React, { useState, useEffect, useRef, useMemo } from "react";
import type { User } from "@/shared/types";
import { isFocusWithin } from "@/components/ui/lib/modalPrimitives";
import { useAudio } from "@/hooks/useAudio";
import { getErrorMessage, consoleError } from "@/utils";
import "./PinDialog.css";

interface PinDialogProps {
  isOpen: boolean;
  user: User;
  mode: "enter" | "set" | "change";
  onSubmit: (pin: string, newPin?: string) => Promise<boolean>;
  onCancel: () => void;
  isLoading?: boolean;
  isRequiredSetup?: boolean;
}

const PIN_LENGTH = 4;

const initialStep = (mode: PinDialogProps["mode"]) =>
  mode === "enter" ? "current" : mode === "set" ? "new" : "current";

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
  const [pin, setPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<"current" | "new" | "confirm">(() =>
    initialStep(mode),
  );
  const [isShaking, setIsShaking] = useState(false);
  const { playKeypad, playError } = useAudio();

  useEffect(() => {
    if (!isOpen) return;
    setPin("");
    setNewPin("");
    setConfirmPin("");
    setError("");
    setIsShaking(false);
    setStep(initialStep(mode));
  }, [isOpen, mode, user]);

  useEffect(() => {
    if (!isOpen) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 100);
    return () => window.clearTimeout(id);
  }, [isOpen, step]);

  useEffect(() => {
    if (!isShaking) return;
    const id = window.setTimeout(() => setIsShaking(false), 450);
    return () => window.clearTimeout(id);
  }, [isShaking]);

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

  const triggerError = (message: string, reset?: () => void) => {
    setError(message);
    setIsShaking(true);
    playError();
    reset?.();
  };

  useEffect(() => {
    if (mode !== "enter" || pin.length !== PIN_LENGTH || isLoading) return;
    const id = window.setTimeout(async () => {
      setError("");
      try {
        const success = await onSubmit(pin);
        if (!success) {
          triggerError("Incorrect PIN", () => setPin(""));
        }
      } catch (submitError) {
        consoleError("PIN submit failed:", submitError);
        triggerError(
          getErrorMessage(submitError, "Unable to verify PIN. Please try again."),
          () => setPin(""),
        );
      }
    }, 100);
    return () => window.clearTimeout(id);
  }, [pin, mode, isLoading, onSubmit, playError]);

  const { value: currentValue, setValue: setCurrentValue, title } = useMemo(() => {
    if (step === "current") {
      return {
        value: pin,
        setValue: setPin,
        title:
          mode === "enter"
            ? `Sign in as ${user}`
            : "Enter current PIN",
      };
    }
    if (step === "new") {
      return {
        value: newPin,
        setValue: setNewPin,
        title:
          mode === "set"
            ? isRequiredSetup
              ? `Set a PIN for ${user}`
              : `Create PIN for ${user}`
            : "Choose new PIN",
      };
    }
    return {
      value: confirmPin,
      setValue: setConfirmPin,
      title: "Confirm new PIN",
    };
  }, [confirmPin, isRequiredSetup, mode, newPin, pin, step, user]);

  const needsSubmitButton = mode !== "enter";
  const submitLabel =
    step === "confirm"
      ? isRequiredSetup
        ? "Save PIN"
        : "Save"
      : "Continue";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === "enter") {
      return;
    }

    setError("");

    try {
      if (mode === "set") {
        if (step === "new") {
          if (currentValue.length !== PIN_LENGTH) {
            triggerError(`Enter ${PIN_LENGTH} digits`);
            return;
          }
          setStep("confirm");
          setError("");
          return;
        }
        if (confirmPin !== newPin) {
          triggerError("PINs do not match", () => setConfirmPin(""));
          return;
        }
        const success = await onSubmit(newPin);
        if (!success) triggerError("Unable to save PIN");
        return;
      }

      if (step === "current") {
        if (currentValue.length !== PIN_LENGTH) {
          triggerError(`Enter ${PIN_LENGTH} digits`);
          return;
        }
        const success = await onSubmit(pin);
        if (!success) {
          triggerError("Incorrect PIN", () => setPin(""));
          return;
        }
        setStep("new");
        setError("");
        return;
      }

      if (step === "new") {
        if (currentValue.length !== PIN_LENGTH) {
          triggerError(`Enter ${PIN_LENGTH} digits`);
          return;
        }
        setStep("confirm");
        setError("");
        return;
      }

      if (confirmPin !== newPin) {
        triggerError("PINs do not match", () => setConfirmPin(""));
        return;
      }

      const success = await onSubmit(pin, newPin);
      if (!success) triggerError("Unable to update PIN");
    } catch (submitError) {
      consoleError("PIN submit failed:", submitError);
      triggerError(
        getErrorMessage(submitError, "Unable to save PIN. Please try again."),
      );
    }
  };

  const handleNumberClick = (num: number) => {
    if (currentValue.length < PIN_LENGTH) {
      setCurrentValue(currentValue + num.toString());
      setError("");
      playKeypad(num);
    }
  };

  const handleBackspace = () => {
    if (currentValue.length > 0) {
      setCurrentValue(currentValue.slice(0, -1));
      setError("");
      playKeypad("del");
    }
  };

  const handlePinInput = (nextValue: string) => {
    const sanitized = nextValue.replace(/\D/g, "").slice(0, PIN_LENGTH);
    if (sanitized.length > currentValue.length) {
      const digit = Number(sanitized[sanitized.length - 1]);
      if (!Number.isNaN(digit)) {
        playKeypad(digit);
      }
    } else if (sanitized.length < currentValue.length) {
      playKeypad("del");
    }
    setCurrentValue(sanitized);
    setError("");
  };

  if (!isOpen) return null;

  return (
    <section
      className="pin-panel"
      role="region"
      aria-labelledby="pin-dialog-title"
    >
      <form ref={formRef} className="pin-panel__form" onSubmit={handleSubmit}>
        <div className="pin-panel__header">
          <h2 id="pin-dialog-title" className="pin-panel__title">
            {title}
          </h2>
          <button
            type="button"
            className="pin-panel__cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            {isRequiredSetup ? "Log out" : "Cancel"}
          </button>
        </div>

        <div
          className={`pin-panel__dots${isShaking ? " pin-panel__dots--shake" : ""}`}
          aria-hidden="true"
        >
          {Array.from({ length: PIN_LENGTH }).map((_, index) => {
            const filled = index < currentValue.length;
            const active = currentValue.length === index;
            return (
              <div
                key={index}
                className={[
                  "pin-panel__dot",
                  filled ? "pin-panel__dot--filled" : "",
                  active ? "pin-panel__dot--active" : "",
                  error ? "pin-panel__dot--error" : "",
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
                  onClick={handleBackspace}
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
                onClick={() => handleNumberClick(num as number)}
                disabled={isLoading}
              >
                {num}
              </button>
            );
          })}
        </div>

        <input
          ref={inputRef}
          className="pin-panel__sr-input"
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={PIN_LENGTH}
          value={currentValue}
          onChange={(event) => handlePinInput(event.target.value)}
          disabled={isLoading}
          autoComplete="off"
          aria-label="PIN entry"
        />

        {error ? (
          <p className="pin-panel__error" role="alert">
            {error}
          </p>
        ) : null}

        {needsSubmitButton ? (
          <button
            type="submit"
            className="pin-panel__submit"
            disabled={currentValue.length !== PIN_LENGTH || isLoading}
          >
            {isLoading ? "Saving…" : submitLabel}
          </button>
        ) : null}
      </form>
    </section>
  );
};

export default PinDialog;
