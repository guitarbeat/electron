import type { Movie } from "../shared/types.js";

/**
 * Text & Date Formatting Utilities
 */

export const normalizeMovieTitle = (title: string): string =>
  title.trim().toLowerCase().replace(/\s+/g, " ");

export const findMovieByNormalizedTitle = (
  movies: readonly Movie[],
  title: string,
): Movie | undefined => {
  const normalized = normalizeMovieTitle(title);
  return movies.find(
    (movie) => normalizeMovieTitle(movie.title) === normalized,
  );
};

/**
 * Formats a message timestamp as a short time (e.g. "3:45 PM") for messages sent
 * today, or as a short date (e.g. "Jan 5") for older messages.
 */
export const formatMessageTimestamp = (date: string): string => {
  try {
    const timestamp = new Date(date);
    const now = new Date();

    if (Number.isNaN(timestamp.getTime()) || Number.isNaN(now.getTime())) {
      return "";
    }

    const diffSeconds = Math.floor(
      (now.getTime() - timestamp.getTime()) / 1000,
    );

    if (diffSeconds < 0) {
      return "";
    }

    if (diffSeconds < 86400) {
      const hours = timestamp.getHours();
      const minutes = timestamp.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
    }

    return timestamp.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
};

/**
 * Formats a memory/record timestamp as a full date-time string
 * (e.g. "Jan 5, 2025, 3:45 PM").
 */
export const formatMemoryTimestamp = (createdAt: string): string => {
  const parsedDate = new Date(createdAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Unknown date";
  }

  return parsedDate.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};
