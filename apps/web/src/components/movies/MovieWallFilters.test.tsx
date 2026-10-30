/** @vitest-environment jsdom */
import { useState } from "react";
import { afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { Movie } from "@/shared/types";
import { TopFrameProvider, TopFrameViewport } from "@/app/TopFramePanels";
import { MovieWallFilters } from "./MovieWallFilters";
import { DEFAULT_MOVIE_WALL_FILTERS, filterMovieWall } from "./movieWallFilterUtils";

const movies: Movie[] = [
  { id: "queue", title: "Queued Film", addedBy: "Aaron", watchedBy: [], createdAt: "2026-01-01" },
  { id: "watching", title: "Started Film", addedBy: "Aaron", watchedBy: [], watchingBy: ["Electra"], createdAt: "2026-01-02" },
  { id: "seen", title: "Finished Film", addedBy: "Aaron", watchedBy: ["Aaron", "Electra"], createdAt: "2026-01-03" },
];
function Filters() {
  const [filters, setFilters] = useState(DEFAULT_MOVIE_WALL_FILTERS);
  const visible = filterMovieWall(movies, filters);
  return <><MovieWallFilters movies={movies} filters={filters} onChange={setFilters} resultCount={visible.length} /><output aria-label="Visible titles">{visible.map(movie => movie.title).join(", ")}</output></>;
}
afterEach(cleanup);

it("keeps portalled filter interactions inside the expanding frame until closed", () => {
  const { container } = render(<TopFrameProvider><TopFrameViewport /><Filters /></TopFrameProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Filter", exact: true }));
  const dialog = screen.getByRole("dialog", { name: "Movie filters" });
  expect(container.querySelector(".top-frame-panels")).toContainElement(dialog);
  fireEvent.pointerDown(dialog);
  expect(dialog).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Close filters" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("offers three shared artwork buttons that filter the wall and toggle off", () => {
  render(<Filters />);
  for (const [label, title] of [["Queue", "Queued Film"], ["Watching", "Started Film"], ["Seen", "Finished Film"]]) {
    const button = screen.getByRole("button", { name: `${label}: 1 titles` });
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Visible titles")).toHaveTextContent(new RegExp(`^${title}$`));
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByLabelText("Visible titles")).toHaveTextContent("Queued Film");
    expect(screen.getByLabelText("Visible titles")).toHaveTextContent("Started Film");
    expect(screen.getByLabelText("Visible titles")).toHaveTextContent("Finished Film");
  }
});
