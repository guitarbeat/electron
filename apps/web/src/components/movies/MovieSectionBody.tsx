import { SuggestionCard } from "./SuggestionCard";
import { MovieCard } from "./MovieCard";
import DriftWall from "@/components/ui/DriftWall";
import { interleaveCollectionItems } from "@/components/ui/lib/posterMatrix";

import React from "react";
import type {
  Movie,
  User,
  MovieSuggestion,
} from "@/shared/types";

import {
  CollectionEmptyState,
  MoviesEmptyIllustration,
} from "@/components/ui";

import { spacing } from "@/theme/tokens";
import {
  getWorkspaceCollectionState,
} from "@/utils";

import {
MovieSections,
MovieBodyActions,
MovieTransitionOrigin,
} from "./shared";

interface Props_MovieSectionBody {
  sections: MovieSections;
  isLoading: boolean;
  isSuggestionsLoading: boolean;
  currentUser: User | null;
  activeUsers?: User[];
  isMobile: boolean;
  processingSuggestionId: string | null;
  successMovieId: string | null;
  onAcceptSuggestion: (s: MovieSuggestion) => void;
  onRejectSuggestion: (s: MovieSuggestion) => void;
  onDeleteRequest: (movie: Movie) => void;
  onToggleError: (msg: string) => void;
  actions: MovieBodyActions;
  posterPlaceCards?: React.ReactNode[];
}

export const MovieSectionBody: React.FC<Props_MovieSectionBody> = ({
  sections,
  isLoading,
  isSuggestionsLoading,
  currentUser,
  activeUsers = [],
  isMobile,
  processingSuggestionId,
  successMovieId,
  onAcceptSuggestion,
  onRejectSuggestion,
  onDeleteRequest,
  onToggleError,
  actions,
  posterPlaceCards = [],
}) => {
  const [_selectedMovie, setSelectedMovie] = React.useState<Movie | null>(null);
  const [_selectedOrigin, setSelectedOrigin] =
    React.useState<MovieTransitionOrigin | null>(null);

  const [viewportWidth, setViewportWidth] = React.useState<number>(() =>
    typeof window !== "undefined" ? window.innerWidth : 1440,
  );

  React.useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const dynamicColumns = React.useMemo(() => {
    if (isMobile || viewportWidth < 640) return 4;
    // Each column is tileWidth (120px) + gap (18px) = 138px.
    // Bleed 35% past screen bounds so the -14deg 3D perspective turn covers both edges completely.
    const targetCols = Math.ceil((viewportWidth * 1.35) / 138);
    return Math.max(6, targetCols);
  }, [isMobile, viewportWidth]);

  const collectionState = getWorkspaceCollectionState({
    itemCount: sections.queue.length + sections.completed.length,
    suggestionCount: sections.suggestions.length,
    isLoadingItems: isLoading,
    isLoadingSuggestions: isSuggestionsLoading,
  });

  const unifiedCards = React.useMemo(() => {
    const renderMovie = (movie: Movie) => {
      const hasPoster = Boolean(movie.posterUrl || movie.customPosterUrl);
      const element = (
        <MovieCard
          key={movie.id}
          movie={movie}
          currentUser={currentUser}
          activeUsers={activeUsers}
          onToggle={(user) => {
            actions.toggleWatched(movie.id, user);
          }}
          onToggleError={onToggleError}
          onEditMetadata={async (updates) => {
            await actions.editMovie(movie.id, updates);
          }}
          onDelete={() => onDeleteRequest(movie)}
          isHighlighted={successMovieId === movie.id}
          onOpenDetails={(m, origin) => {
            setSelectedMovie(m);
            setSelectedOrigin(origin ?? null);
          }}
        />
      );
      return React.cloneElement(element, { "data-height-ratio": hasPoster ? 1 : 0.55 } as React.HTMLAttributes<HTMLElement>);
    };

    if (collectionState === "loading") {
      const skeletonCount = isMobile ? 16 : dynamicColumns * 4;
      return Array.from({ length: skeletonCount }, (_, i) => {
        const isShort = i % 5 === 2;
        return (
          <div
            key={`loading-tile-${i}`}
            className="drift-wall-loading__tile"
            data-height-ratio={isShort ? 0.55 : 1}
            style={
              {
                "--loading-tile": Math.floor(i / dynamicColumns),
                "--loading-column": i % dynamicColumns,
                width: "100%",
                height: "100%",
              } as React.CSSProperties
            }
          />
        );
      });
    }

    const allPosters = [...sections.queue, ...sections.completed];
    const suggestionCards = sections.suggestions.map((suggestion) => (
      <SuggestionCard
        key={`suggestion-${suggestion.id}`}
        suggestion={suggestion}
        onAccept={() => void onAcceptSuggestion(suggestion)}
        onReject={() => void onRejectSuggestion(suggestion)}
        canRespond={Boolean(currentUser)}
        disableActions={!currentUser}
        isProcessing={processingSuggestionId === suggestion.id}
      />
    ));
    const movieCards = allPosters.map(renderMovie);

    return interleaveCollectionItems(
      suggestionCards,
      movieCards,
      posterPlaceCards,
    );
  }, [
    collectionState,
    isMobile,
    dynamicColumns,
    sections.queue,
    sections.completed,
    sections.suggestions,
    currentUser,
    activeUsers,
    processingSuggestionId,
    successMovieId,
    onAcceptSuggestion,
    onRejectSuggestion,
    posterPlaceCards,
    actions,
    onDeleteRequest,
    onToggleError,
  ]);
  const handleTileClick = (item: unknown) => {
    if (React.isValidElement(item) && item.props) {
      const props = item.props as Record<string, unknown>;
      const movie = props.movie as Movie | undefined;
      if (movie) {
        setSelectedMovie(movie);
      }
    }
  };

  // ── Full section body ─────────────────────────────────────────────────────
  return (
    <div
      className="unified-wall-content"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? spacing.md : spacing.lg,
      }}
    >
      {unifiedCards.length > 0 ? (
        <div style={{ position: "relative", width: "100%", height: "100%", flex: 1, overflow: "hidden", borderRadius: 0 }}>
          <DriftWall
            items={unifiedCards}
            columns={dynamicColumns}
            tileWidth={120}
            tileHeight={180}
            gap={isMobile ? 10 : 18}
            tilt={0}
            turn={-14}
            roll={0}
            perspective={2400}
            depth={120}
            speed={isMobile ? 25 : 42}
            direction="up"
            variance={0.7}
            parallax={0.6}
            lift={64}
            fade={0.12}
            dim={0.92}
            overlayColor="#060010"
            radius={isMobile ? 8 : 10}
            pauseOnHover
            grayscale={false}
            onTileClick={handleTileClick}
            scrollStorageKey="movies-workspace-wall"
          />
        </div>
      ) : (
        <CollectionEmptyState
          padding={isMobile ? spacing.md : spacing["3xl"]}
          className="poster-wall-empty"
        >
          <MoviesEmptyIllustration />
          <strong>No cards yet</strong>
          <span>Add a movie, suggestion, or place to fill this wall.</span>
        </CollectionEmptyState>
      )}
    </div>
  );
};

