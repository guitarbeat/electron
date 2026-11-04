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
  it("renders a frameless two-page spread with metadata, watch controls, plot, and flips shut when a page is clicked", () => {
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
          onClose={onClose}
        />
      </ViewportProvider>,
    );

    expect(screen.getByRole("region", { name: "Mulholland Drive booklet" })).toBeTruthy();
    expect(screen.getByText("Mulholland Drive")).toBeTruthy();
    expect(screen.getByText(/After a car wreck on the winding Mulholland Drive/i)).toBeTruthy();

    // No Cover / Spread / Fold closed button bar
    expect(screen.queryByRole("group", { name: "Booklet pages" })).toBeNull();

    const aaronBtn = screen.getByRole("button", { name: /Aaron: Watched/i });
    fireEvent.click(aaronBtn);
    expect(onToggleUserWatched).toHaveBeenCalledWith("Aaron");

    const bothBtn = screen.getByRole("button", {
      name: /Watched by both: Tap to mark watched for both Aaron and Electra/i,
    });
    fireEvent.click(bothBtn);
    expect(onToggleUserWatched).toHaveBeenCalledWith("Both");

    // Clicking an open booklet page flips it shut and calls onClose
    const openPage = screen.getByRole("button", { name: /Page 1 of 2/i });
    fireEvent.click(openPage);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
