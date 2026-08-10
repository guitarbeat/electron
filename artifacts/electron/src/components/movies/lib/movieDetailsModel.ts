import type { GalleryPhoto } from "@/components/ui/interactive-folder-gallery";
import type { Movie, SharedMemory, User } from "@/shared/types";
import type { MovieTransitionOrigin } from "../MovieCard";

const USERS: User[] = ["Aaron", "Electra"];
const CINEMATIC_FALLBACKS = [
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1535016120720-40c646be5580?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=800&auto=format&fit=crop",
];

export function buildGalleryPhotos(memories: SharedMemory[], movie: Movie): GalleryPhoto[] {
  const photos = memories
    .filter((memory) => Boolean(memory.imageUrl))
    .slice(0, 5)
    .map((memory) => ({ id: `memory-${memory.id}`, image: memory.imageUrl! }));
  if (movie.posterUrl && movie.posterUrl !== "N/A" && photos.length < 3) {
    photos.push({ id: `poster-${movie.id}`, image: movie.posterUrl });
  }
  for (let index = 0; photos.length < 5 && index < CINEMATIC_FALLBACKS.length; index += 1) {
    photos.push({ id: `fb-${index}`, image: CINEMATIC_FALLBACKS[index] });
  }
  return photos.slice(0, 5);
}

export const clampMovieTransitionOrigin = (origin: MovieTransitionOrigin | null) =>
  origin
    ? {
        top: `${origin.top}px`,
        left: `${origin.left}px`,
        width: `${origin.width}px`,
        height: `${origin.height}px`,
      }
    : { top: "50dvh", left: "50vw", width: "18rem", height: "27rem" };

export const getMovieDialogMetrics = (isMobile: boolean) => {
  const viewportWidth = typeof window === "undefined" ? 1280 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 800 : window.innerHeight;
  return {
    targetWidth: Math.min(viewportWidth - 32, isMobile ? 544 : 1440),
    targetHeight: Math.min(viewportHeight - 32, isMobile ? 768 : 900),
  };
};

export const getMovieWatchStatus = (movie: Movie, memoryCount: number) => {
  if (movie.watchedBy.length === USERS.length) {
    return {
      label: "Seen together",
      title: "Already a shared watch",
      detail: memoryCount > 0
        ? "You both finished this one, and the poster is already carrying your notes."
        : "You both marked this watched already.",
    };
  }
  if (movie.watchedBy.length === 1) {
    const watcher = movie.watchedBy[0];
    const remaining = USERS.find((user) => !movie.watchedBy.includes(user));
    return {
      label: `${watcher} watched`,
      title: `${watcher} is ahead on this one`,
      detail: remaining ? `${remaining} still has this waiting in the queue.` : "One watch logged so far.",
    };
  }
  return {
    label: "Still queued",
    title: "Still sitting in the lineup",
    detail: memoryCount > 0
      ? `${movie.addedBy} queued it, and there is already a note attached to the poster.`
      : `${movie.addedBy} queued it for a future night.`,
  };
};

export const getMovieNotePreview = (note: string): string => {
  const trimmed = note.trim();
  return trimmed.length <= 96 ? trimmed : `${trimmed.slice(0, 93).trimEnd()}...`;
};

export const getSecondaryMovieMemories = (
  memories: SharedMemory[],
  featuredId: string | undefined,
  canManage: boolean,
): SharedMemory[] =>
  canManage ? [] : memories.filter((memory) => memory.id !== featuredId).slice(0, 2);
