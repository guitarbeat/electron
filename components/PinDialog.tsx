import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { User } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import { colors, spacing, typography, zIndex, radius, motion } from '../design-system/tokens';

interface PinDialogProps {
  isOpen: boolean;
  user: User;
  mode: 'enter' | 'set' | 'change';
  onSubmit: (pin: string, newPin?: string) => Promise<boolean>;
  onCancel: () => void;
  onRemove?: () => void;
  isLoading?: boolean;
}

const PinDialog: React.FC<PinDialogProps> = ({
  isOpen,
  user,
  mode,
  onSubmit,
  onCancel,
  onRemove,
  isLoading = false,
}) => {
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [step, setStep] = useState<'current' | 'new' | 'confirm'>('current');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setNewPin('');
      setConfirmPin('');
      setError('');
      setIsShaking(false);
      setStep(mode === 'enter' ? 'current' : mode === 'set' ? 'new' : 'current');
      document.body.classList.add('modal-open');
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.classList.remove('modal-open');
    }
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
        if (event.key === 'Escape') {
          onCancel();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onCancel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'enter') {
      if (pin.length !== 4) {
        setError('PIN must be 4 digits');
        setIsShaking(true);
        return;
      }
      const success = await onSubmit(pin);
      if (!success) {
        setError('Incorrect PIN');
        setIsShaking(true);
        setPin('');
        inputRef.current?.focus();
      }
    } else if (mode === 'set') {
      if (step === 'new') {
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
        await onSubmit(newPin);
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
    if (mode === 'enter') return `Enter PIN for ${user}`;
    if (mode === 'set') return `Set PIN for ${user}`;
    if (mode === 'change') {
      if (step === 'current') return 'Enter Current PIN';
      if (step === 'new') return 'Enter New PIN';
      return 'Confirm New PIN';
    }
    return 'PIN';
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
        <Card variant="elevated" style={{ maxWidth: '350px', width: '100%', padding: spacing.xl }}>
          <h2
            id="pin-dialog-title"
            style={{
              marginTop: 0,
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              color: colors.accent,
              marginBottom: spacing.lg,
              textAlign: 'center',
            }}
          >
            {getTitle()}
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: spacing.lg }}>
              <input
                ref={inputRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={getCurrentValue()}
                onChange={(e) => handlePinInput(e.target.value, getCurrentSetter())}
                placeholder="••••"
                style={{
                  width: '100%',
                  padding: spacing.lg,
                  backgroundColor: '#162447',
                  border: `2px solid ${error ? colors.error : colors.borderInset}`,
                  borderRadius: radius.md,
                  color: colors.textPrimary,
                  fontSize: typography.fontSize['2xl'],
                  fontFamily: typography.fontFamily.mono.join(', '),
                  textAlign: 'center',
                  letterSpacing: '0.5em',
                  outline: 'none',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
                  transition: `all ${motion.duration.normal} ${motion.easing.easeOut}`,
                  animation: isShaking ? 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both' : 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.accent;
                  e.currentTarget.style.boxShadow = `inset 0 2px 4px rgba(0,0,0,0.3), 0 0 0 2px ${colors.accent}40`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = error ? colors.error : colors.borderInset;
                  e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.3)';
                }}
                disabled={isLoading}
                autoComplete="off"
              />
              {error && (
                <p
                  style={{
                    marginTop: spacing.sm,
                    fontSize: typography.fontSize.sm,
                    color: colors.error,
                    textAlign: 'center',
                  }}
                >
                  {error}
                </p>
              )}
              <p
                style={{
                  marginTop: spacing.sm,
                  fontSize: typography.fontSize.xs,
                  color: colors.textSecondary,
                  textAlign: 'center',
                }}
              >
                Enter a 4-digit PIN
              </p>
            </div>

            <div style={{ display: 'flex', gap: spacing.md, flexDirection: 'column' }}>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                disabled={getCurrentValue().length !== 4}
                style={{ width: '100%' }}
              >
                {mode === 'enter' ? 'Unlock' : step === 'confirm' ? 'Set PIN' : 'Next'}
              </Button>

              <div style={{ display: 'flex', gap: spacing.sm }}>
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={onCancel}
                  disabled={isLoading}
                  style={{ flex: 1 }}
                >
                  Cancel
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
