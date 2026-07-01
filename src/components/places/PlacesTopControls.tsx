import React, { useRef } from "react";
import { Input } from "@/ui/FormFields";
import { PlusIcon, Spinner } from "@/common/Icons";
import type { PlaceSuggestion } from "@/shared/types";

interface PlacesTopControlsProps {
  queueCount: number;
  visitedCount: number;
  pinnedCount: number;
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
    const isBusy = isAdding || Boolean(isSuggesting);
    const hasQuery = searchQuery.trim().length > 0;
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const autocompleteSuggestions = normalizedQuery
      ? suggestionAutocompleteResults.filter((suggestion) =>
          suggestion.name.toLowerCase().includes(normalizedQuery),
        )
      : [];
    const showAddAction = hasQuery && canEdit;
    const showSuggestAction = hasQuery && Boolean(onSuggest);
    const autocompleteId = React.useId();

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
      <>
        <div className="watchlist-top-controls__stage">
          <form
            className="watchlist-top-controls__search-form"
            onSubmit={(e) => {
              e.preventDefault();
              inputRef.current?.blur();
              if (!canEdit && onSuggest) {
                void onSuggest();
                return;
              }
              void onSubmit();
            }}
          >
            <div className="watchlist-top-controls__search-shell watchlist-top-controls__search-shell--with-icon">
              <span
                className="watchlist-top-controls__search-icon"
                aria-hidden="true"
              >
                📍
              </span>
              <Input
                ref={inputRef}
                className="watchlist-top-controls__search-field places-add-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape" && searchQuery) {
                    event.preventDefault();
                    setSearchQuery("");
                    inputRef.current?.blur();
                  }
                }}
                placeholder="Add a place or destination"
                aria-label="Place name"
                role={
                  autocompleteSuggestions.length > 0 ? "combobox" : undefined
                }
                aria-autocomplete={
                  autocompleteSuggestions.length > 0 ? "list" : undefined
                }
                aria-expanded={
                  autocompleteSuggestions.length > 0 ? true : undefined
                }
                aria-controls={
                  autocompleteSuggestions.length > 0
                    ? autocompleteId
                    : undefined
                }
                autoComplete="off"
                fullWidth
              />
              {hasQuery && searchQuery && (
                <button
                  type="button"
                  className="watchlist-top-controls__search-clear"
                  onClick={() => {
                    setSearchQuery("");
                    inputRef.current?.focus();
                  }}
                  aria-label="Clear search"
                  title="Clear search"
                  style={{
                    position: "absolute",
                    right: autocompleteSuggestions.length > 0 ? "12px" : "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--color-text-secondary)",
                    cursor: "pointer",
                    fontSize: "1.2rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "4px",
                    opacity: 0.6,
                    transition: "opacity 0.2s",
                    zIndex: 2,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
                >
                  ✕
                </button>
              )}
              {hasQuery && autocompleteSuggestions.length > 0 && (
                <div
                  id={autocompleteId}
                  className="watchlist-top-controls__autocomplete is-open"
                  role="listbox"
                  aria-label="Place suggestions"
                >
                  {autocompleteSuggestions.slice(0, 5).map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      role="option"
                      aria-selected={false}
                      className="watchlist-top-controls__autocomplete-option"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        setSearchQuery(suggestion.name);
                        inputRef.current?.focus();
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
              )}
            </div>

            {(showAddAction || showSuggestAction) && (
              <div className="watchlist-top-controls__search-actions">
                {showAddAction && (
                  <button
                    type="submit"
                    className="watchlist-top-controls__search-button ui-button ui-button--primary ui-button--md"
                    disabled={isBusy}
                    aria-label="Add place to your list"
                    title="Add directly to list"
                  >
                    {isAdding ? (
                      <Spinner size={16} />
                    ) : (
                      <>
                        <PlusIcon size={14} /> Add
                      </>
                    )}
                  </button>
                )}
                {showSuggestAction && onSuggest && (
                  <button
                    type="button"
                    className="watchlist-top-controls__search-button ui-button ui-button--ghost ui-button--md"
                    onClick={() => void onSuggest()}
                    disabled={isBusy}
                    aria-label="Suggest place for review"
                    title="Suggest for review"
                    style={{ borderStyle: "dashed" }}
                  >
                    {isSuggesting ? <Spinner size={16} /> : <>💡 Suggest</>}
                  </button>
                )}
              </div>
            )}
          </form>

          {suggestionError && (
            <div className="places-top-controls__error" role="alert">
              {suggestionError}
            </div>
          )}
        </div>
      </>
    );
  },
);

PlacesTopControls.displayName = "PlacesTopControls";

export default PlacesTopControls;
