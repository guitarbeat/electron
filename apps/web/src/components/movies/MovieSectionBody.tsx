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

    // Provide quiz and spin cards moving along with movies on the drift wall
    const totalCount =
      allPosters.length +
      sections.suggestions.length +
      (posterPlaceCards?.length || 0);
    const bonusCardCount = totalCount > 24 ? 3 : totalCount > 10 ? 2 : 1;

    const quizCards = Array.from({ length: bonusCardCount }, (_, idx) => (
      <QuizDriftCard
        key={`quiz-drift-card-${idx}`}
        currentUser={currentUser}
        isCompact={isMobile}
      />
    ));

    const spinCards = Array.from({ length: bonusCardCount }, (_, idx) => (
      <SpinDriftCard
        key={`spin-drift-card-${idx}`}
        isCompact={isMobile}
      />
    ));

    const chatCards = Array.from({ length: bonusCardCount }, (_, idx) => (
      <ChatDriftCard
        key={`chat-drift-card-${idx}`}
        currentUser={currentUser}
        isCompact={isMobile}
      />
    ));

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
          style={{ position: "relative", width: "100%", height: "100%", flex: 1, overflow: "hidden", borderRadius: 0 }}
        >
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

