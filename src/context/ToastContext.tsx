import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Toast from '@/components/ui/Toast';
import { spacing } from '@/design-system/tokens';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastInput {
  message: string;
  type: ToastType;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
  onUndo?: () => void;
}

interface ToastRecord extends ToastInput {
  id: string;
}

interface ToastContextType {
  showToast: (toast: ToastInput) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const toastId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback((input: ToastInput) => {
    const id = toastId();
    const actionLabel = input.actionLabel || (input.onUndo ? 'Undo' : undefined);
    const onAction = input.onAction || input.onUndo;

    setToasts((current) => [
      ...current,
      {
        ...input,
        id,
        actionLabel,
        onAction,
      },
    ]);

    return id;
  }, []);

  const value = useMemo(
    () => ({
      showToast,
      dismissToast,
      clearToasts,
    }),
    [showToast, dismissToast, clearToasts]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        style={{
          position: 'fixed',
          top: spacing.md,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 250,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.sm,
          width: 'min(720px, calc(100vw - 1rem))',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <div key={toast.id} style={{ pointerEvents: 'auto' }}>
            <Toast
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onDismiss={() => dismissToast(toast.id)}
              actionLabel={toast.actionLabel}
              onAction={toast.onAction}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
