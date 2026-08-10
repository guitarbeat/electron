import React, { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/ui/Button";
import { MapPinIcon, PlusIcon, Spinner } from "@/common/Icons";
import type { PlaceSuggestion } from "@/shared/types";
import WorkspaceSearchShell, {
  WorkspaceSearchActions,
} from "@/components/ui/WorkspaceSearchShell";
import WorkspaceSearchField from "@/components/ui/WorkspaceSearchField";
import {
  WorkspaceAutocompleteCopy,
  WorkspaceAutocompleteNoMatchPanel,
  WorkspaceAutocompleteOption,
  WorkspaceAutocompletePanel,
} from "@/components/ui/WorkspaceAutocomplete";
import {
  getListEnterSelectionIndex,
  getNextListIndex,
} from "@/components/ui/lib/workspaceListAutocomplete";
import {
  useAutocompleteFocusBoundary,
  useWorkspaceAutocompleteDismiss,
  useWorkspaceSearchInputHandle,
} from "@/components/ui/lib/useWorkspaceAutocompleteDismiss";

interface PlacesTopControlsProps {
  queueCount?: number;
  visitedCount?: number;
  pinnedCount?: number;
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

    const { onFocusCapture, onBlurCapture } =
      useAutocompleteFocusBoundary(autocompleteRegionRef, hideAutocomplete);

    useWorkspaceAutocompleteDismiss(autocompleteRegionRef, hideAutocomplete);

    const focusSearchInput = useWorkspaceSearchInputHandle(
      inputRef,
      openAutocomplete,
    );

    useEffect(() => {
      setActiveAutocompleteIndex(-1);
    }, [normalizedQuery, visibleSuggestions.length]);

    useEffect(() => {
      if (!hasQuery) {
        hideAutocomplete();
      }
    }, [hasQuery, hideAutocomplete]);

    const selectSuggestion = (suggestion: PlaceSuggestion) => {
      setSearchQuery(suggestion.name);
      setActiveAutocompleteIndex(-1);
      hideAutocomplete();
      inputRef.current?.focus();
    };

    React.useImperativeHandle(
      forwardedRef,
      () => ({
        focusSearchInput,
      }),
      [focusSearchInput],
    );

    return (
      <WorkspaceSearchShell
        icon={<MapPinIcon size={16} />}
        isAutocompleteActive={showSuggestionList || showNoMatchHint}
        shellRef={autocompleteRegionRef}
        onShellFocusCapture={() => {
          onFocusCapture();
          if (hasQuery) {
            openAutocomplete();
          }
        }}
        onShellBlurCapture={() => {
          onBlurCapture();
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
        input={
          <WorkspaceSearchField
            inputRef={inputRef}
            value={searchQuery}
            onChange={(nextValue) => {
              setSearchQuery(nextValue);
              if (nextValue.trim()) {
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
                  getNextListIndex(currentIndex, "next", visibleSuggestions.length),
                );
                return;
              }
              if (event.key === "ArrowUp") {
                if (visibleSuggestions.length === 0) return;
                event.preventDefault();
                openAutocomplete();
                setActiveAutocompleteIndex((currentIndex) =>
                  getNextListIndex(currentIndex, "previous", visibleSuggestions.length),
                );
                return;
              }
              if (event.key === "Enter" && isAutocompleteOpen) {
                const selectedIndex = getListEnterSelectionIndex(
                  activeAutocompleteIndex,
                  visibleSuggestions.length,
                );
                if (
                  selectedIndex < 0 ||
                  !visibleSuggestions[selectedIndex] ||
                  activeAutocompleteIndex < 0
                ) {
                  return;
                }
                event.preventDefault();
                selectSuggestion(visibleSuggestions[selectedIndex]);
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
            placeholder="Where to next? Search a place to add."
            ariaLabel="Search places to add or suggest"
            combobox={
              hasAutocompletePanel
                ? {
                    expanded: showSuggestionList,
                    controlsId: autocompleteId,
                    activeDescendantId:
                      activeAutocompleteIndex >= 0
                        ? `${autocompleteId}-option-${activeAutocompleteIndex}`
                        : undefined,
                  }
                : null
            }
            onClear={() => {
              setSearchQuery("");
              hideAutocomplete();
              inputRef.current?.focus();
            }}
          />
        }
        autocomplete={
          showSuggestionList ? (
            <WorkspaceAutocompletePanel
              id={autocompleteId}
              ariaLabel="Place suggestions"
            >
              {visibleSuggestions.map((suggestion, index) => (
                <WorkspaceAutocompleteOption
                  key={suggestion.id}
                  id={`${autocompleteId}-option-${index}`}
                  isActive={index === activeAutocompleteIndex}
                  onSelect={() => selectSuggestion(suggestion)}
                >
                  <WorkspaceAutocompleteCopy
                    title={suggestion.name}
                    meta="Suggested place"
                  />
                </WorkspaceAutocompleteOption>
              ))}
            </WorkspaceAutocompletePanel>
          ) : showNoMatchHint ? (
            <WorkspaceAutocompleteNoMatchPanel>
              {canEdit
                ? "No matching suggestions — use Add to save this place."
                : "No matching suggestions — use Suggest to share this place."}
            </WorkspaceAutocompleteNoMatchPanel>
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
                  className="workspace-search__search-button"
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
                  className="workspace-search__search-button workspace-search__search-button--dashed"
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
