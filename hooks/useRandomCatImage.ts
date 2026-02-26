import { useState, useEffect, useCallback } from 'react';

const CAT_API = 'https://api.thecatapi.com/v1/images/search?limit=3';
const CATAAS_RANDOM = 'https://cataas.com/cat';

/**
 * Fetches random cat image URL(s) from The Cat API (with Cataas as fallback).
 * Returns [sources, refetch] for use with ImageWithFallback; call refetch to load a new cat.
 */
export function useRandomCatImage(): [string[], () => void] {
  const [sources, setSources] = useState<string[]>([]);
  const [refetchKey, setRefetchKey] = useState(0);

  const refetch = useCallback(() => {
    setRefetchKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchCatUrls() {
      try {
        const res = await fetch(CAT_API);
        if (!res.ok) throw new Error('Cat API error');
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) throw new Error('No images');
        const urls = data.map((item: { url?: string }) => item.url).filter(Boolean);
        if (urls.length > 0 && !cancelled) setSources(urls);
        else if (!cancelled) setSources([CATAAS_RANDOM]);
      } catch {
        if (!cancelled) setSources([CATAAS_RANDOM]);
      }
    }

    fetchCatUrls();
    return () => {
      cancelled = true;
    };
  }, [refetchKey]);

  return [sources, refetch];
}
