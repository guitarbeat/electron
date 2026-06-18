import { useEffect, useState } from "react";

interface UseWorkspaceSectionSpyOptions {
  enabled?: boolean;
  /** Re-bind observers when section DOM mounts or unmounts (e.g. counts change). */
  refreshKey?: string;
  /** Top reading-zone inset (default 28%). Increase when map chrome sits above sections. */
  topInset?: string;
}

/**
 * Tracks which workspace section is currently in the reading zone below the
 * sticky header + bento controls.
 */
export function useWorkspaceSectionSpy(
  sectionIds: readonly string[],
  { enabled = true, refreshKey = "", topInset = "28%" }: UseWorkspaceSectionSpyOptions = {},
): string | null {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      setActiveSectionId(null);
      return undefined;
    }

    let observer: IntersectionObserver | null = null;
    let cancelled = false;

    const bindObserver = () => {
      observer?.disconnect();

      const elements = sectionIds
        .map((id) => document.getElementById(id))
        .filter((element): element is HTMLElement => element instanceof HTMLElement);

      if (elements.length === 0) {
        setActiveSectionId(null);
        return;
      }

      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting && entry.intersectionRatio > 0)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

          const nextId = visible[0]?.target.id ?? null;
          if (nextId) {
            setActiveSectionId(nextId);
          }
        },
        {
          root: null,
          rootMargin: `-${topInset} 0px -52% 0px`,
          threshold: [0, 0.12, 0.3, 0.5, 0.75],
        },
      );

      elements.forEach((element) => observer?.observe(element));
    };

    const frameId = window.requestAnimationFrame(() => {
      if (!cancelled) {
        bindObserver();
      }
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
      observer?.disconnect();
    };
  }, [enabled, refreshKey, sectionIds]);

  return activeSectionId;
}
