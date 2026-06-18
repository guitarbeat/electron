import React, { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/ui/Button";
import { Input } from "@/ui/FormFields";
import { PlusIcon, Spinner } from "@/common/Icons";
import type { PlaceSuggestion } from "@/shared/types";
import WorkspaceSearchShell from "@/components/ui/WorkspaceSearchShell";
import WorkspaceSearchClear from "@/components/ui/WorkspaceSearchClear";
import WorkspaceSearchActions from "@/components/ui/WorkspaceSearchActions";

interface PlacesTopControlsProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  suggestionAutocompleteResults?: PlaceSuggestion[];
  onSubmit: () => Promise<void> | void;
  onSuggest?: () => Promise<void> | void;
  isAdding: boolean;
  isSuggesting?: boolean;
  suggestionError: string | null;
  canEdit: boolean;
}

export interface PlacesTopControlsHandle {
  focusSearchInput: () => void;
}

const PlacesTopControls = React.forwardRef<
  PlacesTopControlsHandle,
  PlacesTopControlsProps
>(
  (
    {
      searchQuery,
      setSearchQuery,
      suggestionAutocompleteResults = [],
      onSubmit,
      onSuggest,
      isAdding,
      isSuggesting,
      suggestionError,
      canEdit,
    },
    forwardedRef,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRegionRef = useRef<HTMLDivElement>(null);
    const focusBoundaryFrameRef = useRef<number | null>(null);
    const [activeAutocompleteIndex, setActiveAutocompleteIndex] = useState(-1);
    const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
    const isBusy = isAdding || Boolean(isSuggesting);
    const hasQuery = searchQuery.trim().length > 0;
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const autocompleteSuggestions = normalizedQuery
      ? suggestionAutocompleteResults.filter((suggestion) =>
          suggestion.name.toLowerCase().includes(normalizedQuery),
        )
      : [];
    const visibleSuggestions = autocompleteSuggestions.slice(0, 5);
    const showAddAction = hasQuery && canEdit;
    const showSuggestAction = hasQuery && Boolean(onSuggest);
    const autocompleteId = React.useId();
    const hasAutocompletePanel = hasQuery && isAutocompleteOpen;
    const showSuggestionList = hasAutocompletePanel && visibleSuggestions.length > 0;
    const showNoMatchHint =
      hasAutocompletePanel && visibleSuggestions.length === 0;

    const clearFocusBoundaryCheck = useCallback(() => {
      if (focusBoundaryFrameRef.current !== null) {
        window.cancelAnimationFrame(focusBoundaryFrameRef.current);
        focusBoundaryFrameRef.current = null;
      }
    }, []);

    const openAutocomplete = useCallback(() => {
      if (!hasQuery) {
        return;
      }
      setIsAutocompleteOpen(true);
      setActiveAutocompleteIndex(-1);
    }, [hasQuery]);

    const hideAutocomplete = useCallback(() => {
      setIsAutocompleteOpen(false);
      setActiveAutocompleteIndex(-1);
    }, []);

    useEffect(() => {
      setActiveAutocompleteIndex(-1);
    }, [normalizedQuery, visibleSuggestions.length]);

    useEffect(() => {
      if (!hasQuery) {
        hideAutocomplete();
      }
    }, [hasQuery, hideAutocomplete]);

    useEffect(() => {
      const handlePointerDown = (event: PointerEvent) => {
        const target = event.target;
        if (!(target instanceof Node)) {
          return;
        }
        if (!autocompleteRegionRef.current?.contains(target)) {
          hideAutocomplete();
        }
      };

      document.addEventListener("pointerdown", handlePointerDown);
      return () => document.removeEventListener("pointerdown", handlePointerDown);
    }, [hideAutocomplete]);

    const selectSuggestion = (suggestion: PlaceSuggestion) => {
      setSearchQuery(suggestion.name);
      setActiveAutocompleteIndex(-1);
      hideAutocomplete();
      inputRef.current?.focus();
    };

    React.useImperativeHandle(
      forwardedRef,
      () => ({
        focusSearchInput: () => {
          const input = inputRef.current;
          if (!input) return;
          if (document.activeElement !== input) {
            input.focus();
          }
          openAutocomplete();
        },
      }),
      [openAutocomplete],
    );

    return (
      <WorkspaceSearchShell
        icon="📍"
        isAutocompleteActive={showSuggestionList || showNoMatchHint}
        shellRef={autocompleteRegionRef}
        onShellFocusCapture={() => {
          clearFocusBoundaryCheck();
          if (hasQuery) {
            openAutocomplete();
          }
        }}
        onShellBlurCapture={() => {
          clearFocusBoundaryCheck();
          focusBoundaryFrameRef.current = window.requestAnimationFrame(() => {
            focusBoundaryFrameRef.current = null;
            const nextIsFocused = Boolean(
              autocompleteRegionRef.current?.contains(document.activeElement),
            );
            if (!nextIsFocused) {
              hideAutocomplete();
            }
          });
        }}
        onSubmit={(event) => {
          event.preventDefault();
          hideAutocomplete();
          inputRef.current?.blur();
          if (!canEdit && onSuggest) {
            void onSuggest();
            return;
          }
          void onSubmit();
        }}
        error={suggestionError}
        showShortcutHint={!hasQuery}
        input={
          <>
            <Input
              ref={inputRef}
              className="watchlist-top-controls__search-field places-add-input"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim()) {
                  openAutocomplete();
                }
              }}
              onFocus={() => {
                if (hasQuery) {
                  openAutocomplete();
                }
              }}
              onKeyDown={(event) => {
                if (event.nativeEvent.isComposing) return;

                if (event.key === "ArrowDown") {
                  if (visibleSuggestions.length === 0) return;
                  event.preventDefault();
                  openAutocomplete();
                  setActiveAutocompleteIndex((currentIndex) =>
                    currentIndex < visibleSuggestions.length - 1
                      ? currentIndex + 1
                      : 0,
                  );
                  return;
                }
                if (event.key === "ArrowUp") {
                  if (visibleSuggestions.length === 0) return;
                  event.preventDefault();
                  openAutocomplete();
                  setActiveAutocompleteIndex((currentIndex) =>
                    currentIndex > 0
                      ? currentIndex - 1
                      : visibleSuggestions.length - 1,
                  );
                  return;
                }
                if (
                  event.key === "Enter" &&
                  isAutocompleteOpen &&
                  activeAutocompleteIndex >= 0 &&
                  visibleSuggestions[activeAutocompleteIndex]
                ) {
                  event.preventDefault();
                  selectSuggestion(
                    visibleSuggestions[activeAutocompleteIndex],
                  );
                  return;
                }
                if (event.key === "Escape") {
                  if (isAutocompleteOpen && hasQuery) {
                    event.preventDefault();
                    if (showSuggestionList || showNoMatchHint) {
                      hideAutocomplete();
                      return;
                    }
                  }
                  if (searchQuery) {
                    event.preventDefault();
                    setSearchQuery("");
                    setActiveAutocompleteIndex(-1);
                    hideAutocomplete();
                    inputRef.current?.blur();
                  }
                }
              }}
              placeholder="Search places to add or suggest"
              aria-label="Place name"
              role={hasAutocompletePanel ? "combobox" : undefined}
              aria-autocomplete={hasAutocompletePanel ? "list" : undefined}
              aria-expanded={showSuggestionList ? true : undefined}
              aria-controls={showSuggestionList ? autocompleteId : undefined}
              aria-activedescendant={
                activeAutocompleteIndex >= 0
                  ? `${autocompleteId}-option-${activeAutocompleteIndex}`
                  : undefined
              }
              autoComplete="off"
              fullWidth
            />
            {hasQuery ? (
              <WorkspaceSearchClear
                onClick={() => {
                  setSearchQuery("");
                  hideAutocomplete();
                  inputRef.current?.focus();
                }}
              />
            ) : null}
          </>
        }
        autocomplete={
          showSuggestionList ? (
            <div
              id={autocompleteId}
              className="watchlist-top-controls__autocomplete is-open"
              role="listbox"
              aria-label="Place suggestions"
            >
              {visibleSuggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  id={`${autocompleteId}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={index === activeAutocompleteIndex}
                  className={`watchlist-top-controls__autocomplete-option${
                    index === activeAutocompleteIndex ? " is-active" : ""
                  }`}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    selectSuggestion(suggestion);
                  }}
                >
                  <span className="watchlist-top-controls__autocomplete-copy">
                    <span className="watchlist-top-controls__autocomplete-title">
                      {suggestion.name}
                    </span>
                    <span className="watchlist-top-controls__autocomplete-meta">
                      Suggested place
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : showNoMatchHint ? (
            <div
              className="watchlist-top-controls__autocomplete is-open"
              role="status"
            >
              <p className="watchlist-top-controls__autocomplete-status">
                {canEdit
                  ? "No matching suggestions — use Add to save this place."
                  : "No matching suggestions — use Suggest to share this place."}
              </p>
            </div>
          ) : null
        }
        actions={
          showAddAction || showSuggestAction ? (
            <WorkspaceSearchActions>
              {showAddAction ? (
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="watchlist-top-controls__search-button"
                  disabled={isBusy}
                  aria-label="Add place to your list"
                  title="Add directly to list"
                  leftIcon={isAdding ? <Spinner size={16} /> : <PlusIcon size={14} />}
                >
                  {isAdding ? null : "Add"}
                </Button>
              ) : null}
              {showSuggestAction && onSuggest ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  className="watchlist-top-controls__search-button watchlist-top-controls__search-button--dashed"
                  onClick={() => void onSuggest()}
                  disabled={isBusy}
                  aria-label="Suggest place for review"
                  title="Suggest for review"
                >
                  {isSuggesting ? <Spinner size={16} /> : "Suggest"}
                </Button>
              ) : null}
            </WorkspaceSearchActions>
          ) : null
        }
      />
    );
  },
);

PlacesTopControls.displayName = "PlacesTopControls";

export default PlacesTopControls;
