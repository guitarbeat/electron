import React, { useRef, useState, useEffect } from "react";
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
    const [activeAutocompleteIndex, setActiveAutocompleteIndex] = useState(-1);
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

    useEffect(() => {
      setActiveAutocompleteIndex(-1);
    }, [normalizedQuery, visibleSuggestions.length]);

    const selectSuggestion = (suggestion: PlaceSuggestion) => {
      setSearchQuery(suggestion.name);
      setActiveAutocompleteIndex(-1);
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
        },
      }),
      [],
    );

    return (
      <WorkspaceSearchShell
        icon="📍"
        isAutocompleteActive={hasQuery && visibleSuggestions.length > 0}
        onSubmit={(event) => {
          event.preventDefault();
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
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(event) => {
                if (event.nativeEvent.isComposing) return;

                if (event.key === "ArrowDown") {
                  if (visibleSuggestions.length === 0) return;
                  event.preventDefault();
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
                  setActiveAutocompleteIndex((currentIndex) =>
                    currentIndex > 0
                      ? currentIndex - 1
                      : visibleSuggestions.length - 1,
                  );
                  return;
                }
                if (
                  event.key === "Enter" &&
                  activeAutocompleteIndex >= 0 &&
                  visibleSuggestions[activeAutocompleteIndex]
                ) {
                  event.preventDefault();
                  selectSuggestion(
                    visibleSuggestions[activeAutocompleteIndex],
                  );
                  return;
                }
                if (event.key === "Escape" && searchQuery) {
                  event.preventDefault();
                  setSearchQuery("");
                  setActiveAutocompleteIndex(-1);
                  inputRef.current?.blur();
                }
              }}
              placeholder="Search places to add or suggest"
              aria-label="Place name"
              role={
                visibleSuggestions.length > 0 ? "combobox" : undefined
              }
              aria-autocomplete={
                visibleSuggestions.length > 0 ? "list" : undefined
              }
              aria-expanded={
                visibleSuggestions.length > 0 ? true : undefined
              }
              aria-controls={
                visibleSuggestions.length > 0 ? autocompleteId : undefined
              }
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
                  inputRef.current?.focus();
                }}
              />
            ) : null}
          </>
        }
        autocomplete={
          hasQuery && visibleSuggestions.length > 0 ? (
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
                    index === activeAutocompleteIndex
                      ? " is-active"
                      : ""
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
