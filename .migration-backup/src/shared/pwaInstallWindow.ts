declare global {
  interface Window {
    __electronDeferredInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

export {};
