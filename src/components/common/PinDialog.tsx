import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { User } from '@/types';
import { Card, Button } from '@/components/ui';
import { getModalOverlayStyle, isFocusWithin } from '@/components/ui/modalPrimitives';
import { colors, spacing, typography, radius, shadows } from '@/design-system';

interface PinDialogProps {
  isOpen: boolean;
  user: User;
  mode: 'enter' | 'set' | 'change';
  onSubmit: (pin: string, newPin?: string) => Promise<boolean>;
  onCancel: () => void;
  onRemove?: () => void;
  isLoading?: boolean;
}

const PIN_LENGTH = 4;

const PinDialog: React.FC<PinDialogProps> = ({
  isOpen,
  user,
  mode,
  onSubmit,
  onCancel,
  onRemove,
  isLoading = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const focusTimerRef = useRef<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

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
        if (!validatePinLength(pin)) {
          return;
        }
        const success = await onSubmit(pin);
        if (!success) {
          triggerError('Incorrect PIN', () => setPin(''));
        }
        return;
      }

      if (mode === 'set') {
        if (step === 'new') {
          if (!validatePinLength(newPin)) {
            return;
          }
          setStep('confirm');
          setError('');
          return;
        }

        if (step === 'confirm') {
          if (confirmPin !== newPin) {
            triggerError('PINs do not match', () => setConfirmPin(''));
            return;
          }
          const success = await onSubmit(newPin);
          if (!success) {
            triggerError('Unable to save PIN. Please try again.');
          }
          return;
        }
      }

      if (mode !== 'change') {
        return;
      }

      if (step === 'current') {
        if (!validatePinLength(pin)) {
          return;
        }
        const success = await onSubmit(pin);
        if (!success) {
          triggerError('Incorrect current PIN', () => setPin(''));
          return;
        }
        setStep('new');
        setError('');
        return;
      }

      if (step === 'new') {
        if (!validatePinLength(newPin)) {
          return;
        }
        setStep('confirm');
        setError('');
        return;
      }

      if (confirmPin !== newPin) {
        triggerError('PINs do not match', () => setConfirmPin(''));
        return;
      }

      const success = await onSubmit(pin, newPin);
      if (!success) {
        triggerError('Unable to update PIN. Please try again.');
      }
    } catch (submitError) {
      console.error('PIN submit failed:', submitError);
      triggerError('Unable to save PIN. Please try again.');
    }
  };

  const handleNumberClick = (num: number) => {
    const setter = getCurrentSetter();
    const value = getCurrentValue();
    if (value.length < PIN_LENGTH) {
      setter(value + num.toString());
      setError('');
    }
  };

  const handleBackspace = () => {
    const setter = getCurrentSetter();
    const value = getCurrentValue();
    if (value.length > 0) {
      setter(value.slice(0, -1));
      setError('');
    }
  };

  const handlePinInput = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const cleaned = value.replace(/\D/g, '').slice(0, PIN_LENGTH);
    setter(cleaned);
    setError('');
  };

  const getTitle = () => {
    if (mode === 'enter') return `Unlock ${user}'s Profile`;
    if (mode === 'set') return `Create a PIN for ${user}`;
    if (mode === 'change') {
      if (step === 'current') return 'Confirm Current PIN';
      if (step === 'new') return 'Create New PIN';
      return 'Verify New PIN';
    }
    return 'Security PIN';
  };

  const getSubtitle = () => {
    if (mode === 'enter') return 'Enter your 4-digit code to continue';
    if (mode === 'set') return 'Choose a 4-digit code to protect your profile';
    if (mode === 'change') {
      if (step === 'current') return 'Please enter your current PIN first';
      if (step === 'new') return 'Choose your new 4-digit code';
      return 'Type it once more to confirm';
    }
    return 'Secure your account';
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

  return createPortal(
    <div
      style={{
        ...getModalOverlayStyle('rgba(0, 0, 0, 0.15)'), // Very subtle overlay
        backdropFilter: 'none',
        transition: 'all 0.3s ease',
      }}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-dialog-title"
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'pop-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <Card
          variant="elevated"
          style={{
            maxWidth: '320px', // Slimmer
            width: '100%',
            padding: `${spacing.lg} ${spacing.xl}`, // Reduced padding
            borderRadius: radius.lg,
            border: `1px solid rgba(255, 255, 255, 0.1)`,
            background: 'rgba(20, 25, 40, 0.75)', // Glassy
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: spacing.lg }}>
            <h2
              id="pin-dialog-title"
              style={{
                marginTop: 0,
                fontSize: typography.fontSize.lg, // Smaller title
                fontWeight: typography.fontWeight.semibold,
                color: colors.textPrimary,
                marginBottom: '4px',
                letterSpacing: typography.letterSpacing.wide,
                fontFamily: typography.fontFamilyValue.heading,
                textTransform: typography.presets.buttonLabel.textTransform,
              }}
            >
              {getTitle()}
            </h2>
            <p
              style={{
                fontSize: typography.fontSize.xs,
                color: colors.textSecondary,
                margin: 0,
                opacity: 0.8,
              }}
            >
              {getSubtitle()}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: spacing.lg }}>
              <div
                style={{
                  display: 'flex',
                  gap: spacing.sm,
                  justifyContent: 'center',
                  marginBottom: spacing.md,
                  animation: isShaking ? 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both' : 'none',
                }}
              >
                {Array.from({ length: PIN_LENGTH }).map((_, i) => {
                  const val = currentValue[i];
                  const isActive = currentValue.length === i;
                  return (
                    <div
                      key={i}
                      style={{
                        width: '44px', // Smaller dots
                        height: '52px',
                        backgroundColor: val ? `${colors.accent}25` : 'rgba(0, 0, 0, 0.2)',
                        border: `1.5px solid ${
                          error
                            ? colors.error
                            : isActive
                              ? colors.accent
                              : val
                                ? `${colors.accent}40`
                                : 'rgba(255, 255, 255, 0.1)'
                        }`,
                        borderRadius: radius.md,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: typography.fontSize.xl,
                        fontFamily: typography.fontFamily.heading.join(', '),
                        color: colors.accent,
                        boxShadow: isActive ? `0 0 10px ${colors.accent}20` : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {val ? '*' : ''}
                    </div>
                  );
                })}
              </div>

              {/* Numeric Keypad */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: spacing.sm,
                  marginBottom: spacing.md,
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].map((num, i) => {
                  if (num === '') return <div key={`empty-${i}`} />;
                  if (num === 'del') {
                    return (
                      <Button
                        key="del"
                        variant="ghost"
                        type="button"
                        onClick={handleBackspace}
                        aria-label="Backspace"
                        style={{
                          height: '48px',
                          fontSize: typography.fontSize.base,
                          color: colors.textSecondary,
                        }}
                      >
                        DEL
                      </Button>
                    );
                  }
                  return (
                    <Button
                      key={num}
                      variant="ghost"
                      type="button"
                      onClick={() => handleNumberClick(num as number)}
                      style={{
                        height: '48px',
                        fontSize: typography.fontSize.xl,
                        fontWeight: typography.fontWeight.semibold,
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      {num}
                    </Button>
                  );
                })}
              </div>

              <input
                ref={inputRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={PIN_LENGTH}
                value={currentValue}
                onChange={(e) => handlePinInput(e.target.value, getCurrentSetter())}
                style={{
                  position: 'absolute',
                  opacity: 0,
                  pointerEvents: 'none',
                }}
                disabled={isLoading}
                autoComplete="off"
                aria-label="PIN entry"
              />

              {error && (
                <div
                  role="alert"
                  style={{
                    marginTop: spacing.md,
                    padding: '4px 8px',
                    borderRadius: radius.sm,
                  }}
                >
                  <p
                    style={{
                      fontSize: typography.fontSize.xs,
                      color: colors.error,
                      textAlign: 'center',
                      margin: 0,
                      fontWeight: 500,
                    }}
                  >
                    {error}
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: spacing.md, flexDirection: 'column' }}>
              <Button
                type="submit"
                variant="primary"
                size="md" // Smaller button
                isLoading={isLoading}
                disabled={currentValue.length !== PIN_LENGTH}
                style={{
                  width: '100%',
                  fontSize: typography.fontSize.base,
                  borderRadius: radius.lg,
                  boxShadow:
                    currentValue.length === PIN_LENGTH && !isLoading ? shadows.glow : 'none',
                }}
              >
                {mode === 'enter' ? 'Unlock' : step === 'confirm' ? 'Save' : 'Next'}
              </Button>

              <div style={{ display: 'flex', gap: spacing.sm }}>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  disabled={isLoading}
                  style={{ flex: 1, color: colors.textSecondary, fontSize: typography.fontSize.xs }}
                >
                  Cancel
                </Button>
                {mode === 'change' && onRemove && step === 'current' && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={onRemove}
                    disabled={isLoading}
                    style={{ flex: 1, fontSize: typography.fontSize.xs }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>,
    document.body
  );
};

export default PinDialog;
