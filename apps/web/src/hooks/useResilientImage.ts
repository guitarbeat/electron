import { useState, useCallback } from "react";

export interface UseResilientImageOptions {
  fallbackSrc?: string;
}

export function useResilientImage(initialSrc?: string, options?: UseResilientImageOptions) {
  const fallbackSrc = options?.fallbackSrc || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%231e293b'/%3E%3C/svg%3E";
  const [src, setSrc] = useState(initialSrc || fallbackSrc);
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    if (!hasError) {
      setHasError(true);
      setSrc(fallbackSrc);
    }
  }, [fallbackSrc, hasError]);

  return {
    src,
    hasError,
    handleError,
    setSrc,
  };
}

export default useResilientImage;
