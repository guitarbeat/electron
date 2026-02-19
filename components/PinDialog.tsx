import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { colors, spacing, radius, typography, shadows, zIndex } from '../design-system/tokens';
import Card from './ui/Card';
import Button from './ui/Button';

interface PinDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (pin: string, newPin?: string) => Promise<boolean | void>;
  mode: 'enter' | 'set' | 'change';
  user: string;
  onRemove?: () => void;
}

const PIN_LENGTH = 4;

const PinDialog: React.FC<PinDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  user,
  onRemove,
}) => {
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'current' | 'new' | 'confirm'>('current');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setNewPin('');
      setConfirmPin('');
      setError('');
      setStep('current');
      setIsLoading(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isShaking) {
      const timer = setTimeout(() => setIsShaking(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isShaking]);

  const onCancel = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    try {
      await processSubmit();
    } finally {
      setIsLoading(false);
    }
  };

  const processSubmit = async () => {
    if (mode === 'enter') {
      const success = await onSubmit(pin);
      if (!success) {
        setError('Incorrect PIN');
        setIsShaking(true);
        setPin('');
        inputRef.current?.focus();
      }
    } else if (mode === 'set') {
      if (step === 'current') {
        if (pin.length !== 4) {
          setError('PIN must be 4 digits');
          setIsShaking(true);
          return;
        }
        setStep('confirm');
        setError('');
        setTimeout(() => inputRef.current?.focus(), 100);
      } else if (newPin !== pin) {
        setError('PINs do not match');
        setIsShaking(true);
        setNewPin('');
        setConfirmPin(''); // Reset confirm step input (mapped to newPin in 'set' mode logic below actually uses 'newPin' state for confirm? Wait, logic check.)
        // Actually, looking at render:
        // For 'set' mode:
        // step 'current' uses 'pin' state. (Subtitle: Choose 4 digit)
        // step 'confirm' uses 'newPin' state?? No wait.
        // Let's look at getCurrentValue:
        // if step 'current' -> pin.
        // if step 'new' -> newPin.
        // if step 'confirm' -> confirmPin.

        // In 'set' mode logic above:
        // step 'current' checks pin length. Sets step to 'confirm'.
        // step 'confirm' (else block): checks newPin !== pin.
        // Wait, if step is confirm, getCurrentValue returns confirmPin.
        // But here it compares newPin vs pin?

        // Let's re-read the original code logic for 'set' mode from previous file content if possible or infer.
        // The previous code had:
        // if (mode === 'set') {
        //   if (step === 'current') { ... setStep('confirm') ... }
        //   else { // confirm step
        //      if (pin !== newPin) ...
        // }
        // But wait, in 'set' mode, we typically enter a pin, then confirm it.
        // step 'current' (enter pin) -> pin state.
        // step 'confirm' (confirm pin) -> confirmPin state (based on getCurrentValue).

        // Let's fix the logic to match standard pin set flow:
        // 1. Enter PIN (stored in 'pin')
        // 2. Confirm PIN (stored in 'confirmPin')
        // 3. Compare 'pin' vs 'confirmPin'

        // However, keeping consistent with existing component state usage:
        // mode 'set':
        // step 'current': input -> pin. Title "Create a PIN".
        // step 'confirm': input -> confirmPin (via getCurrentValue). Title "Verify New PIN" (mapped from getTitle logic?)
        // getTitle: if mode 'set' -> "Create a PIN". Doesn't change for step?
        // getSubtitle: if mode 'set' -> "Choose a 4-digit...".

        // Actually, standard UI usually asks to re-enter.
        // Let's assume 'set' mode uses:
        // 1. 'pin' for first entry.
        // 2. 'newPin' or 'confirmPin' for second?
        // getCurrentValue: step 'current' -> pin. step 'new' -> newPin. step 'confirm' -> confirmPin.

        // In 'set' mode, we probably just go 'current' -> 'confirm'.
        // So input 1 is 'pin'. Input 2 is 'confirmPin'.

        if (confirmPin !== pin) {
          setError('PINs do not match');
          setIsShaking(true);
          setConfirmPin('');
          inputRef.current?.focus();
          return;
        }
        await onSubmit(pin);
      }
    } else if (mode === 'change') {
      if (step === 'current') {
        if (pin.length !== 4) {
          setError('PIN must be 4 digits');
          setIsShaking(true);
          return;
        }
        const success = await onSubmit(pin);
        if (!success) {
          setError('Incorrect current PIN');
          setIsShaking(true);
          setPin('');
          inputRef.current?.focus();
          return;
        }
        setStep('new');
        setError('');
        setTimeout(() => inputRef.current?.focus(), 100);
      } else if (step === 'new') {
        if (newPin.length !== 4) {
          setError('PIN must be 4 digits');
          setIsShaking(true);
          return;
        }
        setStep('confirm');
        setError('');
        setTimeout(() => inputRef.current?.focus(), 100);
      } else if (step === 'confirm') {
        if (confirmPin !== newPin) {
          setError('PINs do not match');
          setIsShaking(true);
          setConfirmPin('');
          inputRef.current?.focus();
          return;
        }
        await onSubmit(pin, newPin);
      }
    }
  };

  const handlePinInput = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
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
    if (mode === 'set') {
      if (step === 'confirm') return 'Type it once more to confirm';
      return 'Choose a 4-digit code to protect your profile';
    }
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

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.overlay,
        backdropFilter: 'blur(4px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: zIndex.modal,
        padding: spacing.md,
      }}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-dialog-title"
    >
      <style>
        {`
          @keyframes shake {
            10%, 90% { transform: translate3d(-1px, 0, 0); }
            20%, 80% { transform: translate3d(2px, 0, 0); }
            30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
            40%, 60% { transform: translate3d(4px, 0, 0); }
          }
        `}
      </style>
      <div onClick={(e) => e.stopPropagation()}>
        <Card
          variant="elevated"
          style={{
            maxWidth: '400px',
            width: '100%',
            padding: spacing.xl,
            borderRadius: radius.card,
            border: `1px solid ${colors.border}`,
            background: `linear-gradient(180deg, ${colors.surface} 0%, #1a1f2e 100%)`,
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: spacing.xl }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                backgroundColor: `${colors.accent}15`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                marginBottom: spacing.md,
                border: `1px solid ${colors.accent}30`,
                fontSize: '24px',
              }}
            >
              {mode === 'enter' ? '🔐' : '🆕'}
            </div>
            <h2
              id="pin-dialog-title"
              style={{
                marginTop: 0,
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.bold,
                color: colors.textPrimary,
                marginBottom: spacing.xs,
              }}
            >
              {getTitle()}
            </h2>
            <p
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.textSecondary,
                margin: 0,
              }}
            >
              {getSubtitle()}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: spacing.xl }}>
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
                  const val = getCurrentValue()[i];
                  const isActive = getCurrentValue().length === i;
                  return (
                    <div
                      key={i}
                      style={{
                        width: '56px',
                        height: '64px',
                        backgroundColor: val ? `${colors.accent}20` : '#162447',
                        border: `2px solid ${
                          error
                            ? colors.error
                            : isActive
                              ? colors.accent
                              : val
                                ? `${colors.accent}40`
                                : colors.borderInset
                        }`,
                        borderRadius: radius.lg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: typography.fontSize['3xl'],
                        color: colors.accent,
                        boxShadow: isActive ? `0 0 15px ${colors.accent}30` : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {val ? '•' : ''}
                    </div>
                  );
                })}
              </div>

              <input
                ref={inputRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={getCurrentValue()}
                onChange={(e) => handlePinInput(e.target.value, getCurrentSetter())}
                style={{
                  position: 'absolute',
                  opacity: 0,
                  pointerEvents: 'none',
                }}
                disabled={isLoading}
                autoComplete="off"
              />

              {error && (
                <div
                  style={{
                    marginTop: spacing.sm,
                    padding: `${spacing.xs} ${spacing.md}`,
                    backgroundColor: `${colors.error}15`,
                    borderRadius: radius.md,
                    border: `1px solid ${colors.error}30`,
                  }}
                >
                  <p
                    style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.error,
                      textAlign: 'center',
                      margin: 0,
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
                size="lg"
                isLoading={isLoading}
                disabled={getCurrentValue().length !== 4}
                style={{
                  width: '100%',
                  height: '56px',
                  fontSize: typography.fontSize.lg,
                  borderRadius: radius.lg,
                  boxShadow: getCurrentValue().length === 4 && !isLoading ? shadows.glow : 'none',
                }}
              >
                {mode === 'enter' ? 'Unlock Profile' : step === 'confirm' ? 'Save PIN' : 'Continue'}
              </Button>

              <div style={{ display: 'flex', gap: spacing.sm }}>
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={onCancel}
                  disabled={isLoading}
                  style={{ flex: 1, color: colors.textSecondary }}
                >
                  Go Back
                </Button>
                {mode === 'change' && onRemove && step === 'current' && (
                  <Button
                    type="button"
                    variant="danger"
                    size="md"
                    onClick={onRemove}
                    disabled={isLoading}
                    style={{ flex: 1 }}
                  >
                    Remove PIN
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
