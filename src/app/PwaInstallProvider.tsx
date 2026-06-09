import '@khmyznikov/pwa-install';
import type { PWAInstallElement } from '@khmyznikov/pwa-install';
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { PwaInstallContext, type PwaInstallContextValue } from './PwaInstallContext.ts';
import { useToast } from '@/app/useProviders';

// eslint-disable-next-line react-refresh/only-export-components
export const usePwaInstall = (): PwaInstallContextValue => {
  const context = useContext(PwaInstallContext);
  if (!context) {
    throw new Error('usePwaInstall must be used within PwaInstallProvider');
  }
  return context;
};

const readStandaloneMode = (): boolean =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true);

const syncTintColor = (element: PWAInstallElement | null): void => {
  if (!element || typeof document === 'undefined') {
    return;
  }

  const accent = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-accent')
    .trim();

  if (accent) {
    element.styles = { '--tint-color': accent };
  }
};

interface PwaInstallProviderProps {
  children: ReactNode;
}

/**
 * Hosts `<pwa-install>` and exposes install UI to the app shell (header chip, toasts).
 * @see https://github.com/khmyznikov/pwa-install
 */
export const PwaInstallProvider: React.FC<PwaInstallProviderProps> = ({ children }) => {
  const { showToast } = useToast();
  const elementRef = useRef<PWAInstallElement | null>(null);
  const autoPromptShownRef = useRef(false);

  const [canInstall, setCanInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(readStandaloneMode);

  const openInstallDialog = useCallback(() => {
    const element = elementRef.current;
    if (!element || isStandalone) {
      return;
    }

    syncTintColor(element);
    element.showDialog(true);
  }, [isStandalone]);

  const attachElement = useCallback((element: PWAInstallElement | null) => {
    elementRef.current = element;
    if (!element) {
      return;
    }

    syncTintColor(element);

    if (window.__electronDeferredInstallPrompt) {
      element.externalPromptEvent = window.__electronDeferredInstallPrompt;
    }

    setCanInstall(element.isInstallAvailable);
    setIsStandalone(element.isUnderStandaloneMode || readStandaloneMode());
  }, []);

  useEffect(() => {
    const refreshStandalone = () => {
      setIsStandalone(readStandaloneMode());
    };

    document.addEventListener('visibilitychange', refreshStandalone);
    return () => {
      document.removeEventListener('visibilitychange', refreshStandalone);
    };
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return undefined;
    }

    const handleAvailable = () => {
      setCanInstall(true);
      syncTintColor(element);

      if (autoPromptShownRef.current || element.isUnderStandaloneMode) {
        return;
      }

      autoPromptShownRef.current = true;
      window.setTimeout(() => {
        if (!element.isUnderStandaloneMode && element.isInstallAvailable) {
          element.showDialog();
        }
      }, 1400);
    };

    const handleSuccess = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      setCanInstall(false);
      setIsStandalone(true);
      showToast({
        type: 'success',
        message: detail?.message ?? 'Electron is installed. Open it from your home screen or dock.',
      });
    };

    const handleInstalled = () => {
      setCanInstall(false);
      setIsStandalone(true);
    };

    const handleThemeChange = () => {
      syncTintColor(element);
    };

    element.addEventListener('pwa-install-available-event', handleAvailable);
    element.addEventListener('pwa-install-success-event', handleSuccess);
    window.addEventListener('appinstalled', handleInstalled);

    const themeObserver = new MutationObserver(handleThemeChange);
    themeObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      element.removeEventListener('pwa-install-available-event', handleAvailable);
      element.removeEventListener('pwa-install-success-event', handleSuccess);
      window.removeEventListener('appinstalled', handleInstalled);
      themeObserver.disconnect();
    };
  }, [showToast]);

  const value = useMemo(
    () => ({
      canInstall,
      isStandalone,
      openInstallDialog,
    }),
    [canInstall, isStandalone, openInstallDialog]
  );

  if (isStandalone) {
    return (
      <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>
    );
  }

  return (
    <PwaInstallContext.Provider value={value}>
      {children}
      <pwa-install
        ref={attachElement}
        manifestUrl="/manifest.json"
        useLocalStorage
        manualApple
        manualChrome
        installDescription="Install Electron on your home screen or dock for quick launch, fullscreen viewing, and offline access to your shared queue."
      />
    </PwaInstallContext.Provider>
  );
};
