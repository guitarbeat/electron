import { MovieDetailsModal } from "./MovieDetailsModal";
import { MovieEditModal } from "./MovieEditModal";
import { SuggestionCard } from "./SuggestionCard";
import { MovieCard } from "./MovieCard";
import { QuizDriftCard } from "./QuizDriftCard";
import { SpinDriftCard } from "./SpinDriftCard";
import { ChatDriftCard } from "./ChatDriftCard";
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
  const wallContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [selectedMovie, setSelectedMovie] = React.useState<Movie | null>(null);
  const [selectedOrigin, setSelectedOrigin] =
    React.useState<MovieTransitionOrigin | null>(null);
  const [isUpdatingWatchStatus, setIsUpdatingWatchStatus] =
    React.useState(false);
  const [editMovie, setEditMovie] = React.useState<Movie | null>(null);

  const openMovieDetails = React.useCallback(
    (movie: Movie, origin?: MovieTransitionOrigin | null) => {
      setSelectedMovie(movie);
      setSelectedOrigin(origin ?? null);
    },
    [],
  );

  const closeMovieDetails = React.useCallback(() => {
    setSelectedMovie(null);
    setSelectedOrigin(null);
  }, []);

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

  const { tileWidth, tileHeight, gap, dynamicColumns } = React.useMemo(() => {
    if (isMobile || viewportWidth < 640) {
      const slotW = 125; // 105px card + 20px gap
      const targetCols = Math.max(3, Math.floor(viewportWidth / slotW));
      return {
        tileWidth: 105,
        tileHeight: 158,
        gap: 18,
        dynamicColumns: targetCols % 2 === 0 ? targetCols : targetCols + 1,
      };
    }
    if (viewportWidth < 1024) {
      const slotW = 148; // 124px card + 24px gap
      const targetCols = Math.max(4, Math.floor(viewportWidth / slotW));
      return {
        tileWidth: 124,
        tileHeight: 186,
        gap: 22,
        dynamicColumns: targetCols % 2 === 0 ? targetCols : targetCols + 1,
      };
    }
    if (viewportWidth < 1600) {
      const slotW = 166; // 138px card + 28px gap
      const targetCols = Math.max(6, Math.floor(viewportWidth / slotW));
      return {
        tileWidth: 138,
        tileHeight: 207,
        gap: 26,
        dynamicColumns: targetCols % 2 === 0 ? targetCols : targetCols + 1,
      };
    }
    const slotW = 180; // 148px card + 32px gap
    const targetCols = Math.max(8, Math.floor(viewportWidth / slotW));
    return {
      tileWidth: 148,
      tileHeight: 222,
      gap: 28,
      dynamicColumns: targetCols % 2 === 0 ? targetCols : targetCols + 1,
    };
  }, [isMobile, viewportWidth]);

  const collectionState = getWorkspaceCollectionState({
    itemCount: sections.queue.length + sections.completed.length,
    suggestionCount: sections.suggestions.length,
    isLoadingItems: isLoading,
    isLoadingSuggestions: isSuggestionsLoading,
  });

  const resolvedSelectedMovie = React.useMemo(() => {
    if (!selectedMovie) {
      return null;
    }

    return (
      [...sections.queue, ...sections.completed].find(
        (movie) => movie.id === selectedMovie.id,
      ) ?? selectedMovie
    );
  }, [selectedMovie, sections.queue, sections.completed]);

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
          onOpenDetails={openMovieDetails}
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

    // Deduplicate movies across queue and completed
    const seenMovieIds = new Set<string>();
    const uniqueMovies: Movie[] = [];
    for (const movie of [...sections.queue, ...sections.completed]) {
      if (movie && movie.id && !seenMovieIds.has(movie.id)) {
        seenMovieIds.add(movie.id);
        uniqueMovies.push(movie);
      }
    }

    // Deduplicate suggestions
    const seenSuggestionIds = new Set<string>();
    const uniqueSuggestions: MovieSuggestion[] = [];
    for (const suggestion of sections.suggestions) {
      if (suggestion && suggestion.id && !seenSuggestionIds.has(suggestion.id)) {
        seenSuggestionIds.add(suggestion.id);
        uniqueSuggestions.push(suggestion);
      }
    }

    const suggestionCards = uniqueSuggestions.map((suggestion) => (
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
    const movieCards = uniqueMovies.map(renderMovie);

    // Provide single unique interactive cards (no duplicates)
    const hasItems = uniqueMovies.length > 0 || uniqueSuggestions.length > 0;
    const quizCards = hasItems
      ? [
          <QuizDriftCard
            key="quiz-drift-card-unique"
            currentUser={currentUser}
            isCompact={isMobile}
            isQuizCard
            data-quiz-card
          />,
        ]
      : [];

    const spinCards = hasItems
      ? [
          <SpinDriftCard
            key="spin-drift-card-unique"
            isCompact={isMobile}
            isSpinCard
            data-spin-card
          />,
        ]
      : [];

    const chatCards = hasItems
      ? [
          <ChatDriftCard
            key="chat-drift-card-unique"
            currentUser={currentUser}
            isCompact={isMobile}
            isChatCard
            data-chat-card
          />,
        ]
      : [];

    return interleaveCollectionItems(
      suggestionCards,
      movieCards,
      posterPlaceCards,
      quizCards,
      spinCards,
      chatCards,
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
    openMovieDetails,
  ]);
  const handleTileClick = (item: unknown) => {
    if (!React.isValidElement(item) || !item.props) {
      return;
    }

    const props = item.props as {
      movie?: Movie;
      "data-quiz-card"?: boolean;
      isQuizCard?: boolean;
      "data-spin-card"?: boolean;
      isSpinCard?: boolean;
      "data-chat-card"?: boolean;
      isChatCard?: boolean;
    };

    if (props["data-quiz-card"] || props.isQuizCard) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("open-quiz-experience"));
      }
      return;
    }

    if (props["data-spin-card"] || props.isSpinCard) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("open-spin-experience"));
      }
      return;
    }

    if (props["data-chat-card"] || props.isChatCard) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("open-chat-experience"));
      }
      return;
    }

    const movie = props.movie;
    if (!movie) {
      return;
    }

    const container = document.querySelector(`[data-movie-id="${movie.id}"]`);
    const poster = container?.querySelector(".movie-item-poster-wrap");
    const rect = poster?.getBoundingClientRect();
    const origin = rect
      ? {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }
      : null;

    openMovieDetails(movie, origin);
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
        <div
          ref={wallContainerRef}
          className={isMobile ? "movies-wall-container movies-wall-container--mobile" : "movies-wall-container"}
          style={{ position: "relative", width: "100%", height: "100%", flex: 1, overflow: "hidden", borderRadius: 0 }}
        >
          <DriftWall
            items={unifiedCards}
            columns={dynamicColumns}
            tileWidth={tileWidth}
            tileHeight={tileHeight}
            gap={gap}
            tilt={0}
            turn={0}
            roll={0}
            perspective={1000}
            depth={0}
            speed={isMobile ? 22 : 32}
            direction="up"
            variance={0}
            parallax={0}
            lift={24}
            fade={0.08}
            dim={0.96}
            overlayColor="#060010"
            radius={isMobile ? 10 : 12}
            pauseOnHover
            grayscale={false}
            onTileClick={handleTileClick}
            scrollStorageKey="movies-workspace-wall"
            isPaused={Boolean(selectedMovie)}
            className={selectedMovie ? "drift-wall--modal-open" : ""}
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

      {resolvedSelectedMovie ? (
        <React.Suspense fallback={null}>
          <MovieDetailsModal
            movie={resolvedSelectedMovie}
            isOpen={Boolean(resolvedSelectedMovie)}
            origin={selectedOrigin}
            container={wallContainerRef.current}
            contained={true}
            currentUser={currentUser}
            activeUsers={activeUsers}
            isWatchedByCurrentUser={Boolean(
              currentUser &&
                resolvedSelectedMovie.watchedBy.includes(currentUser),
            )}
            isUpdatingWatchStatus={isUpdatingWatchStatus}
            onToggleWatched={
              currentUser
                ? async () => {
                    setIsUpdatingWatchStatus(true);
                    try {
                      await actions.toggleWatched(resolvedSelectedMovie.id);
                    } finally {
                      setIsUpdatingWatchStatus(false);
                    }
                  }
                : undefined
            }
            onToggleUserWatched={
              activeUsers.length > 0
                ? async (user) => {
                    setIsUpdatingWatchStatus(true);
                    try {
                      await actions.toggleWatched(
                        resolvedSelectedMovie.id,
                        user,
                      );
                    } finally {
                      setIsUpdatingWatchStatus(false);
                    }
                  }
                : undefined
            }
            onEdit={
              currentUser
                ? () => {
                    setEditMovie(resolvedSelectedMovie);
                  }
                : undefined
            }
            onClose={closeMovieDetails}
          />
        </React.Suspense>
      ) : null}

      {editMovie ? (
        <MovieEditModal
          movie={editMovie}
          isOpen={Boolean(editMovie)}
          isMobile={isMobile}
          onClose={() => setEditMovie(null)}
          onSubmit={async (updates) => {
            await actions.editMovie(editMovie.id, updates);
            setEditMovie(null);
          }}
          onDelete={() => {
            onDeleteRequest(editMovie);
            setEditMovie(null);
          }}
        />
      ) : null}
    </div>
  );
};

