import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { User } from '@/shared/types';
import { getModalOverlayStyle, isFocusWithin } from '@/components/ui/lib/modalPrimitives';
import { getErrorMessage, consoleError } from '@/utils';

interface PinDialogProps {
  isOpen: boolean;
  user: User;
  mode: 'enter' | 'set' | 'change';
  onSubmit: (pin: string, newPin?: string) => Promise<boolean>;
  onCancel: () => void;
  isLoading?: boolean;
  isRequiredSetup?: boolean;
}

const PIN_LENGTH = 4;

const styles = {
  overlay: {
    background: 'rgba(30, 0, 40, 0.55)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
  },
  card: {
    maxWidth: '320px',
    width: '100%',
    borderRadius: '24px',
    padding: '28px 24px 22px',
    background: 'linear-gradient(160deg, #2a0a3e 0%, #1a0628 60%, #2d0a40 100%)',
    boxShadow: '0 0 0 2px rgba(255,255,255,0.08), 0 0 40px rgba(200,80,255,0.25), 0 24px 48px rgba(0,0,0,0.6)',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  rainbowTop: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(90deg, #ff6eb4, #c964e8, #7dd3fc, #86efac, #fde68a, #ff6eb4)',
    backgroundSize: '200% 100%',
    animation: 'pin-rainbow-slide 3s linear infinite',
  },
  sparkleCorner: {
    position: 'absolute' as const,
    fontSize: '18px',
    opacity: 0.7,
    pointerEvents: 'none' as const,
    animation: 'pin-twinkle 2s ease-in-out infinite',
  },
  title: {
    margin: '6px 0 20px',
    fontSize: '15px',
    fontWeight: 700,
    color: '#f0abfc',
    textAlign: 'center' as const,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    textShadow: '0 0 12px rgba(200,80,255,0.7), 0 0 24px rgba(255,110,180,0.4)',
    fontFamily: '"Comic Neue", "Comic Sans MS", "Chalkboard SE", cursive',
  },
  dot: (filled: boolean, active: boolean, hasError: boolean) => ({
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    transition: 'all 0.18s ease',
    background: filled
      ? 'linear-gradient(135deg, #e040fb 0%, #c026d3 100%)'
      : active
      ? 'rgba(200,80,255,0.15)'
      : 'rgba(255,255,255,0.04)',
    border: `2px solid ${hasError ? '#f43f5e' : active ? '#e879f9' : filled ? '#c026d3' : 'rgba(255,255,255,0.1)'}`,
    boxShadow: filled
      ? '0 0 12px rgba(200,80,255,0.6), inset 0 1px 0 rgba(255,255,255,0.25)'
      : active
      ? '0 0 8px rgba(200,80,255,0.3)'
      : 'none',
  }),
  dotInner: (filled: boolean) => ({
    color: filled ? '#fff' : 'transparent',
    textShadow: filled ? '0 1px 3px rgba(0,0,0,0.4)' : 'none',
    fontSize: filled ? '14px' : '0',
    transition: 'all 0.15s ease',
  }),
  keypadGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    marginBottom: '14px',
  },
  numBtn: (isPressed: boolean) => ({
    height: '52px',
    borderRadius: '16px',
    border: '1.5px solid rgba(200,80,255,0.25)',
    background: 'linear-gradient(160deg, rgba(120,40,180,0.45) 0%, rgba(80,10,120,0.55) 100%)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 3px 8px rgba(0,0,0,0.35)',
    cursor: 'pointer',
    fontSize: '20px',
    fontWeight: 700,
    color: '#f0d4ff',
    fontFamily: '"Comic Neue", "Comic Sans MS", "Chalkboard SE", cursive',
    letterSpacing: '0.02em',
    textShadow: '0 1px 3px rgba(0,0,0,0.4)',
    transition: 'all 0.12s ease',
    transform: isPressed ? 'scale(0.93)' : 'scale(1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    outline: 'none',
  }),
  delBtn: {
    height: '52px',
    borderRadius: '16px',
    border: '1.5px solid rgba(255,110,180,0.2)',
    background: 'linear-gradient(160deg, rgba(80,10,60,0.5) 0%, rgba(60,5,40,0.6) 100%)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 3px 8px rgba(0,0,0,0.35)',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 700,
    color: '#f9a8d4',
    letterSpacing: '0.1em',
    transition: 'all 0.12s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    outline: 'none',
  },
  unlockBtn: (active: boolean, loading: boolean) => ({
    width: '100%',
    height: '48px',
    borderRadius: '16px',
    border: 'none',
    background: active && !loading
      ? 'linear-gradient(135deg, #e040fb 0%, #ff6eb4 50%, #e040fb 100%)'
      : 'rgba(255,255,255,0.06)',
    backgroundSize: '200% 100%',
    animation: active && !loading ? 'pin-btn-shimmer 2s linear infinite' : 'none',
    boxShadow: active && !loading
      ? '0 0 16px rgba(224,64,251,0.5), 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)'
      : 'none',
    cursor: active && !loading ? 'pointer' : 'not-allowed',
    fontSize: '14px',
    fontWeight: 700,
    color: active && !loading ? '#fff' : 'rgba(255,255,255,0.25)',
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    fontFamily: '"Comic Neue", "Comic Sans MS", "Chalkboard SE", cursive',
    textShadow: active && !loading ? '0 1px 3px rgba(0,0,0,0.35)' : 'none',
    transition: 'all 0.2s ease',
    outline: 'none',
  }),
  cancelBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'rgba(200,120,240,0.55)',
    fontSize: '12px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    fontStyle: 'italic',
    padding: '8px 0 0',
    width: '100%',
    textAlign: 'center' as const,
    transition: 'color 0.15s',
    outline: 'none',
  },
  errorMsg: {
    fontSize: '12px',
    color: '#fb7185',
    textAlign: 'center' as const,
    margin: '6px 0 0',
    fontWeight: 600,
    textShadow: '0 0 8px rgba(244,63,94,0.4)',
    letterSpacing: '0.04em',
    fontFamily: '"Comic Neue", "Comic Sans MS", cursive',
  },
};

const keyframes = `
@keyframes pin-rainbow-slide {
  0% { background-position: 0% 0; }
  100% { background-position: 200% 0; }
}
@keyframes pin-twinkle {
  0%, 100% { opacity: 0.5; transform: scale(1) rotate(0deg); }
  50% { opacity: 1; transform: scale(1.2) rotate(15deg); }
}
@keyframes pin-btn-shimmer {
  0% { background-position: 0% 0; }
  100% { background-position: 200% 0; }
}
@keyframes pin-shake {
  0%, 100% { transform: translateX(0); }
  15% { transform: translateX(-6px); }
  30% { transform: translateX(5px); }
  45% { transform: translateX(-4px); }
  60% { transform: translateX(3px); }
  75% { transform: translateX(-2px); }
}
@keyframes pin-pop-in {
  0% { opacity: 0; transform: scale(0.85) translateY(8px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
`;

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
  const focusTimerRef = useRef<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [pressedKey, setPressedKey] = useState<number | string | null>(null);

  const [step, setStep] = useState<'current' | 'new' | 'confirm'>(() =>
    mode === 'enter' ? 'current' : mode === 'set' ? 'new' : 'current'
  );
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      focusTimerRef.current = window.setTimeout(() => inputRef.current?.focus(), 100);
    }
    return () => {
      if (focusTimerRef.current !== null) {
        window.clearTimeout(focusTimerRef.current);
        focusTimerRef.current = null;
      }
    };
  }, [isOpen, mode]);

  useEffect(() => {
    if (isShaking) {
      const timer = setTimeout(() => setIsShaking(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isShaking]);

  useEffect(() => {
    if (mode !== 'enter' || pin.length !== PIN_LENGTH || isLoading) return;
    const timer = window.setTimeout(async () => {
      setError('');
      const success = await onSubmit(pin);
      if (!success) {
        setError('Incorrect PIN ✗');
        setIsShaking(true);
        setPin('');
      }
    }, 100);
    return () => window.clearTimeout(timer);
  }, [pin, mode, isLoading, onSubmit]);

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && isFocusWithin(dialogRef.current)) {
          event.preventDefault();
          onCancel();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onCancel]);

  const triggerError = (message: string, reset?: () => void) => {
    setError(message);
    setIsShaking(true);
    reset?.();
  };

  const validatePinLength = (value: string): boolean => {
    if (value.length !== PIN_LENGTH) {
      triggerError(`PIN must be ${PIN_LENGTH} digits`);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (mode === 'enter') {
        if (!validatePinLength(pin)) return;
        const success = await onSubmit(pin);
        if (!success) triggerError('Incorrect PIN ✗', () => setPin(''));
        return;
      }

      if (mode === 'set') {
        if (step === 'new') {
          if (!validatePinLength(newPin)) return;
          setStep('confirm');
          setError('');
          return;
        }
        if (step === 'confirm') {
          if (confirmPin !== newPin) {
            triggerError("PINs don't match!", () => setConfirmPin(''));
            return;
          }
          const success = await onSubmit(newPin);
          if (!success) triggerError('Unable to save PIN. Try again!');
          return;
        }
      }

      if (mode !== 'change') return;

      if (step === 'current') {
        if (!validatePinLength(pin)) return;
        const success = await onSubmit(pin);
        if (!success) {
          triggerError('Incorrect PIN ✗', () => setPin(''));
          return;
        }
        setStep('new');
        setError('');
        return;
      }

      if (step === 'new') {
        if (!validatePinLength(newPin)) return;
        setStep('confirm');
        setError('');
        return;
      }

      if (confirmPin !== newPin) {
        triggerError("PINs don't match!", () => setConfirmPin(''));
        return;
      }

      const success = await onSubmit(pin, newPin);
      if (!success) triggerError('Unable to update PIN. Try again!');
    } catch (submitError) {
      consoleError('PIN submit failed:', submitError);
      triggerError(getErrorMessage(submitError, 'Unable to save PIN. Please try again.'));
    }
  };

  const handleNumberClick = (num: number) => {
    const setter = getCurrentSetter();
    const value = getCurrentValue();
    if (value.length < PIN_LENGTH) {
      setter(value + num.toString());
      setError('');
    }
    setPressedKey(num);
    setTimeout(() => setPressedKey(null), 120);
  };

  const handleBackspace = () => {
    const setter = getCurrentSetter();
    const value = getCurrentValue();
    if (value.length > 0) {
      setter(value.slice(0, -1));
      setError('');
    }
    setPressedKey('del');
    setTimeout(() => setPressedKey(null), 120);
  };

  const handlePinInput = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const cleaned = value.replace(/\D/g, '').slice(0, PIN_LENGTH);
    setter(cleaned);
    setError('');
  };

  const getTitle = () => {
    if (mode === 'enter') return `✨ Unlock ${user}'s Profile ✨`;
    if (mode === 'set') return isRequiredSetup ? `🔐 Secure ${user}'s Profile` : `🔐 Create a PIN for ${user}`;
    if (mode === 'change') {
      if (step === 'current') return '🔑 Current PIN';
      if (step === 'new') return '✨ New PIN';
      return '💖 Confirm New PIN';
    }
    return '🔐 Security PIN';
  };

  const getCurrentValue = () => {
    if (step === 'current') return pin;
    if (step === 'new') return newPin;
    return confirmPin;
  };

  const getCurrentSetter = () => {
    if (step === 'current') return setPin;
    if (step === 'new') return setNewPin;
    return setConfirmPin;
  };

  const currentValue = getCurrentValue();

  if (!isOpen) return null;

  const canSubmit = currentValue.length === PIN_LENGTH && !isLoading;

  return createPortal(
    <>
      <style>{keyframes}</style>
      <div
        style={{ ...getModalOverlayStyle('rgba(0,0,0,0.15)'), ...styles.overlay }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pin-dialog-title"
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close PIN dialog"
          tabIndex={-1}
          style={{
            position: 'absolute',
            inset: 0,
            border: 'none',
            padding: 0,
            margin: 0,
            background: 'transparent',
            cursor: 'pointer',
          }}
        />
        <div
          ref={dialogRef}
          style={{
            position: 'relative',
            zIndex: 1,
            animation: 'pin-pop-in 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div style={styles.card}>
            {/* Rainbow top strip */}
            <div style={styles.rainbowTop} aria-hidden="true" />

            {/* Title */}
            <h2 id="pin-dialog-title" style={styles.title}>
              {getTitle()}
            </h2>

            <form onSubmit={handleSubmit}>
              {/* PIN dots */}
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  animation: isShaking ? 'pin-shake 0.5s cubic-bezier(.36,.07,.19,.97) both' : 'none',
                }}
              >
                {Array.from({ length: PIN_LENGTH }).map((_, i) => {
                  const filled = i < currentValue.length;
                  const active = currentValue.length === i;
                  return (
                    <div key={i} style={styles.dot(filled, active, !!error)}>
                      <span style={styles.dotInner(filled)} aria-hidden="true">★</span>
                    </div>
                  );
                })}
              </div>

              {/* Keypad */}
              <div style={styles.keypadGrid}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((num, i) => {
                  if (num === null) return <div key={`empty-${i}`} />;
                  if (num === 'del') {
                    return (
                      <button
                        key="del"
                        type="button"
                        onClick={handleBackspace}
                        aria-label="Backspace"
                        style={{
                          ...styles.delBtn,
                          transform: pressedKey === 'del' ? 'scale(0.92)' : 'scale(1)',
                        }}
                      >
                        DEL
                      </button>
                    );
                  }
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleNumberClick(num as number)}
                      style={styles.numBtn(pressedKey === num)}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>

              {/* Hidden accessible input */}
              <input
                ref={inputRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={PIN_LENGTH}
                value={currentValue}
                onChange={(e) => handlePinInput(e.target.value, getCurrentSetter())}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                disabled={isLoading}
                autoComplete="off"
                aria-label="PIN entry"
              />

              {error && (
                <p role="alert" style={styles.errorMsg}>{error}</p>
              )}

              {/* Unlock button */}
              <button
                type="submit"
                disabled={!canSubmit}
                style={{ ...styles.unlockBtn(canSubmit, isLoading), marginTop: error ? '12px' : '16px' }}
              >
                {isLoading
                  ? '✨ ...'
                  : mode === 'enter'
                  ? '🔓 Unlock'
                  : step === 'confirm'
                  ? (isRequiredSetup ? '💾 Save PIN' : '💾 Save')
                  : 'Next →'}
              </button>

              {/* Cancel */}
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                style={styles.cancelBtn}
              >
                {isRequiredSetup ? 'log out' : 'cancel'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default PinDialog;
