import { useState, useEffect, useCallback } from 'react';

const CAT_API = 'https://api.thecatapi.com/v1/images/search?limit=3';
const CATAAS_RANDOM = 'https://cataas.com/cat';

export interface UseRandomCatImageResult {
  sources: string[];
  refetch: () => void;
  isLoading: boolean;
}

/**
 * Fetches random cat image URL(s) from The Cat API (with Cataas as fallback).
 * Returns { sources, refetch, isLoading } for use with ImageWithFallback.
 */
export function useRandomCatImage(): UseRandomCatImageResult {
  const [sources, setSources] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refetchKey, setRefetchKey] = useState(0);

  const refetch = useCallback(() => {
    setRefetchKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    async function fetchCatUrls() {
      try {
        const res = await fetch(CAT_API);
        if (!res.ok) throw new Error('Cat API error');
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) throw new Error('No images');
        const urls = data.map((item: { url?: string }) => item.url).filter((u): u is string => Boolean(u));
        if (urls.length > 0 && !cancelled) setSources(urls);
        else if (!cancelled) setSources([CATAAS_RANDOM]);
      } catch {
        if (!cancelled) setSources([CATAAS_RANDOM]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchCatUrls();
    return () => {
      cancelled = true;
    };
  }, [refetchKey]);

  return { sources, refetch, isLoading };
}
