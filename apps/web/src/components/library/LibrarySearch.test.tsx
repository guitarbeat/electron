/** @vitest-environment jsdom */
import React, { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const fixtures = vi.hoisted(() => ({
  addMovie: vi.fn(),
  search: vi.fn(),
  metadata: vi.fn(),
  openMovie: vi.fn(),
}));
vi.mock("@/app/providerContexts", () => ({
  NavbarToastViewport: () => <div />,
  useUser: () => ({ currentUser: "Aaron" }),
  useToast: () => ({ showToast: vi.fn() }),
}));
vi.mock("@/hooks/movies", () => ({
  useMovies: () => ({ movies: [], addMovie: fixtures.addMovie, deleteMovie: vi.fn() }),
}));
vi.mock("@/hooks/suggestions", () => ({ useSuggestions: () => ({ addSuggestion: vi.fn() }) }));
vi.mock("@/services/metadata", () => ({
  searchMovieAutocomplete: fixtures.search,
  getCachedMovieAutocomplete: () => null,
  fetchOmdbMetadataCached: fixtures.metadata,
}));
vi.mock("@/components/movies", () => ({
  MOVIE_AUTOCOMPLETE_DEBOUNCE_MS: 1,
  MOVIE_AUTOCOMPLETE_MIN_QUERY_LENGTH: 2,
  MovieRecommendationComposer: () => null,
}));
vi.mock("@/components/ui", () => ({
  ProfileMenu: () => <div>Profiles</div>,
  Button: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => <button onClick={onClick}>{children}</button>,
  WorkspaceSearchActions: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  WorkspaceAutocompletePanel: ({ children, id }: { children: React.ReactNode; id: string }) => <div id={id} role="listbox">{children}</div>,
  WorkspaceAutocompleteGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  WorkspaceAutocompleteStatus: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  WorkspaceAutocompleteLoading: () => <div>Loading catalog</div>,
  WorkspaceAutocompletePoster: () => null,
  WorkspaceAutocompleteCopy: ({ title, meta }: { title: string; meta: string }) => <span>{title} {meta}</span>,
  WorkspaceAutocompleteOption: ({ children, onSelect, id }: { children: React.ReactNode; onSelect: () => void; id: string }) => <button id={id} role="option" aria-selected="false" onClick={onSelect}>{children}</button>,
}));
import LibrarySearch from "./LibrarySearch";

function Dock() {
  const [query, setQuery] = useState("");
  return <><output aria-label="Library query">{query}</output><LibrarySearch searchQuery={query} onSearchQueryChange={setQuery} onOpenMovie={fixtures.openMovie} /></>;
}

beforeEach(() => {
  vi.clearAllMocks();
  fixtures.search.mockResolvedValue([]);
  fixtures.metadata.mockResolvedValue({ imdbRating: "8.8" });
  fixtures.addMovie.mockResolvedValue({ id: "new-movie" });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 0));
  vi.stubGlobal("cancelAnimationFrame", (id: number) => window.clearTimeout(id));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const searchTrigger = () => screen.getByRole("button", { name: "Search movies (/)" });
const addTrigger = () => screen.getByRole("button", { name: "Add a movie or show (Cmd+K)" });

describe("independent command dock controls", () => {
  it("starts compact, focuses Search with /, and resets it with Escape", async () => {
    render(<Dock />);
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    fireEvent.keyDown(document, { key: "/" });
    const input = screen.getByRole("searchbox");
    await waitFor(() => expect(input).toHaveFocus());
    fireEvent.change(input, { target: { value: "Nolan" } });
    expect(screen.getByLabelText("Library query")).toHaveTextContent("Nolan");
    expect(fixtures.search).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(searchTrigger()).toHaveFocus();
    expect(screen.getByLabelText("Library query")).toBeEmptyDOMElement();
  });

  it("switches to Add with Ctrl+K without changing the library query", async () => {
    render(<Dock />);
    fireEvent.click(searchTrigger());
    const search = screen.getByRole("searchbox");
    fireEvent.change(search, { target: { value: "Nolan" } });
    fireEvent.keyDown(search, { key: "k", ctrlKey: true });
    const add = screen.getByRole("combobox");
    await waitFor(() => expect(add).toHaveFocus());
    expect(screen.queryByRole("button", { name: "Add movie" })).not.toBeInTheDocument();
    fireEvent.change(add, { target: { value: "Arrival" } });
    expect(screen.getByRole("button", { name: "Add movie" })).toBeEnabled();
    expect(search).toHaveValue("Nolan");
    fireEvent.keyDown(add, { key: "Escape" });
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(addTrigger()).toHaveFocus();
    expect(search).toHaveValue("Nolan");
  });

  it("stages a catalog result on Enter and saves that selection on the next Enter", async () => {
    fixtures.search.mockResolvedValue([{ title: "Arrival", year: "2016", imdbID: "tt2543164", type: "movie" }]);
    render(<Dock />);
    fireEvent.click(addTrigger());
    const input = screen.getByRole("combobox");
    await waitFor(() => expect(input).toHaveFocus());
    fireEvent.change(input, { target: { value: "Arriv" } });
    await screen.findByRole("option", { name: /Arrival/ });
    await screen.findByText(/IMDb 8.8/);
    expect(input).toHaveFocus();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(input).toHaveValue("Arrival");
    expect(fixtures.addMovie).not.toHaveBeenCalled();
    fireEvent.submit(input.closest("form")!);
    await waitFor(() => expect(fixtures.addMovie).toHaveBeenCalledWith("Arrival", { imdbID: "tt2543164", type: "movie" }));
    await waitFor(() => expect(input).toHaveValue(""));
  });

  it("keeps the draft and exposes the save failure so it can be retried", async () => {
    fixtures.addMovie.mockRejectedValue(new Error("Shared sync is unavailable"));
    render(<Dock />);
    fireEvent.click(addTrigger());
    const input = screen.getByRole("combobox");
    await waitFor(() => expect(input).toHaveFocus());
    fireEvent.change(input, { target: { value: "Arrival" } });
    fireEvent.submit(input.closest("form")!);
    expect(await screen.findByRole("alert")).toHaveTextContent("Shared sync is unavailable");
    expect(input).toHaveValue("Arrival");
    expect(screen.getByRole("button", { name: "Add movie" })).toBeEnabled();
  });
});
