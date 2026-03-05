import { useCallback } from 'react';

interface UseToolHideOptions {
  isEmbedded: boolean;
  onRequestClose?: () => void;
  setIsMinimized: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useToolHide({ isEmbedded, onRequestClose, setIsMinimized }: UseToolHideOptions) {
  return useCallback(() => {
    if (isEmbedded) {
      onRequestClose?.();
      return;
    }
    setIsMinimized(true);
  }, [isEmbedded, onRequestClose, setIsMinimized]);
}
