// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ViewportProvider } from "@/app/providerContexts";
import { MovieInlineBooklet } from "./MovieInlineBooklet";
import type { Movie } from "@/shared/types";

const sampleMovie: Movie = {
  id: "movie-1",
  title: "Mulholland Drive",
  year: "2001",
  runtime: "147 min",
  genre: "Mystery, Thriller",
  director: "David Lynch",
  imdbRating: "7.9",
  plot: "After a car wreck on the winding Mulholland Drive renders a woman amnesiac, she and a perky Hollywood-hopeful search for clues and answers across Los Angeles.",
  addedBy: "Aaron",
  watchedBy: ["Aaron"],
  watchingBy: ["Electra"],
  createdAt: "2026-01-15T00:00:00.000Z",
};

describe("MovieInlineBooklet", () => {
  it("opens as a two-page booklet, notifies onStartClose immediately on click, and calls onClose after flipping shut", () => {
    vi.useFakeTimers();
    const onStartClose = vi.fn();
    const onClose = vi.fn();
    const onToggleUserWatched = vi.fn();

    render(
      <ViewportProvider>
        <MovieInlineBooklet
          movie={sampleMovie}
          currentUser="Aaron"
          activeUsers={["Aaron"]}
          isWatchedByCurrentUser={true}
          isUpdatingWatchStatus={false}
          onToggleUserWatched={onToggleUserWatched}
          onStartClose={onStartClose}
          onClose={onClose}
        />
      </ViewportProvider>,
    );

    const booklet = screen.getByRole("region", { name: "Mulholland Drive booklet" });
    expect(booklet).toBeTruthy();

    // Advance past initial open timer so the cover flips open
    vi.advanceTimersByTime(50);

    // Right page shows title, compact metadata line, and plot without duplicate OVERVIEW header or footer
    expect(screen.getByText("Mulholland Drive")).toBeTruthy();
    expect(screen.getByText("2001 · 147m · Mystery · ★ 7.9")).toBeTruthy();
    expect(screen.getByText(/After a car wreck on the winding Mulholland Drive/i)).toBeTruthy();
    expect(screen.queryByText(/^Overview$/i)).toBeNull();
    expect(screen.queryByText(/Watched by Aaron/i)).toBeNull();

    // Left page has stacked user actions; clicking watch buttons does not close the booklet
    const aaronBtn = screen.getByRole("button", { name: /Aaron: Watched/i });
    fireEvent.click(aaronBtn);
    expect(onToggleUserWatched).toHaveBeenCalledWith("Aaron");
    expect(onStartClose).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    const bothBtn = screen.getByRole("button", {
      name: /Watched by both: Tap to mark watched for both Aaron and Electra/i,
    });
    fireEvent.click(bothBtn);
    expect(onToggleUserWatched).toHaveBeenCalledWith("Both");
    expect(onStartClose).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    // Clicking the booklet again immediately triggers onStartClose (so neighbors slide back) and calls onClose after flipping shut
    fireEvent.click(screen.getByText("Mulholland Drive"));
    expect(booklet.getAttribute("data-booklet-closing")).toBe("true");
    expect(onStartClose).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();

    vi.advanceTimersByTime(450);
    expect(onClose).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
