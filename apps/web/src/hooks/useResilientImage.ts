import { useState, useEffect, useCallback, useMemo } from "react";
import { getCatPosterUrl } from "@/utils/catPosters";
import { getCachedPosterUrlSync } from "@/services/posterCache";
import {
  getCachedObjectUrlSync,
  getImageBlob,
} from "@/utils/imageCache";

export type ImageStatus = "loading" | "loaded" | "primary-error" | "fallback-error";

export interface UseResilientImageOptions {
  src?: string | null;
  fallbackSrc?: string;
  seed?: string;
  catFallback?: boolean;
  onLoad?: (event?: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  onError?: (event?: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export interface UseResilientImageResult {
  currentSrc: string | null;
  isPrimary: boolean;
  isCatFallback: boolean;
  isGraphicPlaceholder: boolean;
  isLoading: boolean;
  hasError: boolean;
  status: ImageStatus;
  handleLoad: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  handleError: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  retry: () => void;
}

/**
 * Hook to manage resilient image loading with multi-tier fallback:
 * 1. Primary Source (with IndexedDB blob cache sync checking)
 * 2. Cat API deterministic fallback poster
 * 3. Y2K-inspired themed vector placeholder graphic
 */
export function useResilientImage(options: UseResilientImageOptions): UseResilientImageResult {
  const {
    src,
    fallbackSrc,
    seed,
    catFallback = true,
    onLoad,
    onError,
  } = options;

  const resolvedFallbackCat = useMemo(() => {
    if (fallbackSrc) return fallbackSrc;
    if (catFallback) {
      return getCatPosterUrl(seed || src || "y2k-cat-placeholder");
    }
    return null;
  }, [fallbackSrc, catFallback, seed, src]);

  const [hasPrimaryError, setHasPrimaryError] = useState(false);
  const [hasFallbackError, setHasFallbackError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [cachedSrc, setCachedSrc] = useState<string | null>(() => {
    if (!src) return null;
    return getCachedObjectUrlSync(src) || getCachedPosterUrlSync(src);
  });

  // Reset error states when primary source changes
  useEffect(() => {
    let isCancelled = false;
    setHasPrimaryError(false);
    setHasFallbackError(false);
    setIsLoaded(false);

    if (!src || src === "N/A" || src.trim() === "") {
      setHasPrimaryError(true);
      return;
    }

    const syncCached = getCachedObjectUrlSync(src) || getCachedPosterUrlSync(src);
    if (syncCached) {
      setCachedSrc(syncCached);
    } else {
      setCachedSrc(null);
      getImageBlob(src)
        .then((blob) => {
          if (isCancelled) return;
          if (blob) {
            try {
              const objUrl = URL.createObjectURL(blob);
              setCachedSrc(objUrl);
            } catch {
              // Ignore blob URL errors and let standard img tag load
            }
          }
        })
        .catch(() => {
          // Fall back to direct src
        });
    }

    return () => {
      isCancelled = true;
    };
  }, [src]);

  const activeSrc = useMemo(() => {
    if (!hasPrimaryError && src && src !== "N/A" && src.trim() !== "") {
      return cachedSrc || src;
    }
    if (!hasFallbackError && resolvedFallbackCat) {
      return resolvedFallbackCat;
    }
    return null;
  }, [hasPrimaryError, hasFallbackError, src, cachedSrc, resolvedFallbackCat]);

  const isPrimary = !hasPrimaryError && Boolean(src && src !== "N/A" && src.trim() !== "");
  const isCatFallback = hasPrimaryError && Boolean(!hasFallbackError && resolvedFallbackCat);
  const isGraphicPlaceholder = !activeSrc || hasFallbackError;

  const handleLoad = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setIsLoaded(true);
      onLoad?.(event);
    },
    [onLoad]
  );

  const handleError = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
      if (!hasPrimaryError) {
        setHasPrimaryError(true);
        setIsLoaded(false);
      } else {
        setHasFallbackError(true);
        setIsLoaded(true);
      }
      onError?.(event);
    },
    [hasPrimaryError, onError]
  );

  const retry = useCallback(() => {
    setHasPrimaryError(false);
    setHasFallbackError(false);
    setIsLoaded(false);
  }, []);

  const status: ImageStatus = useMemo(() => {
    if (hasFallbackError || (!activeSrc && hasPrimaryError)) return "fallback-error";
    if (hasPrimaryError) return "primary-error";
    if (isLoaded) return "loaded";
    return "loading";
  }, [hasFallbackError, hasPrimaryError, activeSrc, isLoaded]);

  return {
    currentSrc: activeSrc,
    isPrimary,
    isCatFallback,
    isGraphicPlaceholder,
    isLoading: !isLoaded && Boolean(activeSrc),
    hasError: isGraphicPlaceholder,
    status,
    handleLoad,
    handleError,
    retry,
  };
}
