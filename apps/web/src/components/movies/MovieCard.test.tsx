/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { Movie } from "@/shared/types";
import { MovieCard } from "./MovieCard";

const sampleMovie: Movie = {
  id: "test-movie-1",
  title: "Inception",
  year: 2010,
  addedBy: "Aaron",
  watchedBy: ["Aaron", "Electra"],
  watchingBy: [],
  createdAt: "2026-01-01",
};

describe("MovieCard badge and dim toggles", () => {
  it("renders watcher stack and dim-watched attributes by default", () => {
    const { container } = render(
      <MovieCard
        movie={sampleMovie}
        currentUser="Aaron"
        activeUsers={["Aaron", "Electra"]}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const card = container.querySelector(".movie-item-card");
    expect(card).toHaveAttribute("data-show-badges", "true");
    expect(card).toHaveAttribute("data-dim-watched", "true");
    expect(container.querySelector(".movie-item-watchers")).toBeInTheDocument();
  });

  it("omits watcher stack and updates attribute when showBadges is false", () => {
    const { container } = render(
      <MovieCard
        movie={sampleMovie}
        currentUser="Aaron"
        activeUsers={["Aaron", "Electra"]}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        showBadges={false}
      />
    );

    const card = container.querySelector(".movie-item-card");
    expect(card).toHaveAttribute("data-show-badges", "false");
    expect(container.querySelector(".movie-item-watchers")).not.toBeInTheDocument();
  });

  it("sets data-dim-watched to false when dimWatched is false", () => {
    const { container } = render(
      <MovieCard
        movie={sampleMovie}
        currentUser="Aaron"
        activeUsers={["Aaron", "Electra"]}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        dimWatched={false}
      />
    );

    const card = container.querySelector(".movie-item-card");
    expect(card).toHaveAttribute("data-dim-watched", "false");
  });
});
