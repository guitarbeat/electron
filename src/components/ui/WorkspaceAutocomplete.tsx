import React, { useState } from "react";

interface WorkspaceAutocompletePanelProps {
  id: string;
  isOpen?: boolean;
  ariaLabel: string;
  onPointerDown?: () => void;
  children: React.ReactNode;
}

export const WorkspaceAutocompletePanel: React.FC<
  WorkspaceAutocompletePanelProps
> = ({ id, isOpen = true, ariaLabel, onPointerDown, children }) => (
  <div
    id={id}
    className={`watchlist-top-controls__autocomplete${isOpen ? " is-open" : ""}`}
    role="listbox"
    aria-label={ariaLabel}
    onPointerDown={() => {
      onPointerDown?.();
    }}
  >
    {children}
  </div>
);

export const WorkspaceAutocompleteLoading: React.FC = () => (
  <div
    className="watchlist-top-controls__autocomplete-loading"
    role="status"
    aria-label="Searching"
  >
    <span className="watchlist-top-controls__autocomplete-loading-dot" />
    <span className="watchlist-top-controls__autocomplete-loading-dot" />
    <span className="watchlist-top-controls__autocomplete-loading-dot" />
  </div>
);

interface WorkspaceAutocompleteStatusProps {
  children: React.ReactNode;
  role?: "status" | "alert";
}

export const WorkspaceAutocompleteStatus: React.FC<
  WorkspaceAutocompleteStatusProps
> = ({ children, role = "status" }) => (
  <div className="watchlist-top-controls__autocomplete-status" role={role}>
    {children}
  </div>
);

interface WorkspaceAutocompleteOptionProps {
  id: string;
  isActive: boolean;
  onSelect: () => void;
  onHover?: () => void;
  children: React.ReactNode;
}

export const WorkspaceAutocompleteOption: React.FC<
  WorkspaceAutocompleteOptionProps
> = ({ id, isActive, onSelect, onHover, children }) => (
  <button
    id={id}
    type="button"
    role="option"
    aria-selected={isActive}
    className={`watchlist-top-controls__autocomplete-option${
      isActive ? " is-active" : ""
    }`}
    onPointerDown={(event) => {
      event.preventDefault();
      onSelect();
    }}
    onMouseEnter={onHover}
  >
    {children}
  </button>
);

interface WorkspaceAutocompleteCopyProps {
  title: string;
  meta?: string;
}

export const WorkspaceAutocompleteCopy: React.FC<
  WorkspaceAutocompleteCopyProps
> = ({ title, meta }) => (
  <span className="watchlist-top-controls__autocomplete-copy">
    <span className="watchlist-top-controls__autocomplete-title">{title}</span>
    {meta ? (
      <span className="watchlist-top-controls__autocomplete-meta">{meta}</span>
    ) : null}
  </span>
);

interface WorkspaceAutocompletePosterProps {
  src?: string;
  fallbackLetter: string;
}

const WorkspaceAutocompletePosterImage: React.FC<{ src: string }> = ({
  src,
}) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <img
      src={src}
      alt=""
      className={`watchlist-top-controls__autocomplete-poster-image${
        loaded ? " is-loaded" : ""
      }`}
      onLoad={() => setLoaded(true)}
    />
  );
};

export const WorkspaceAutocompletePoster: React.FC<
  WorkspaceAutocompletePosterProps
> = ({ src, fallbackLetter }) => (
  <span className="watchlist-top-controls__autocomplete-poster">
    {src ? (
      <WorkspaceAutocompletePosterImage src={src} />
    ) : (
      <span
        className="watchlist-top-controls__autocomplete-poster-fallback"
        aria-hidden
      >
        {fallbackLetter}
      </span>
    )}
  </span>
);

interface WorkspaceAutocompleteNoMatchPanelProps {
  children: React.ReactNode;
}

export const WorkspaceAutocompleteNoMatchPanel: React.FC<
  WorkspaceAutocompleteNoMatchPanelProps
> = ({ children }) => (
  <div
    className="watchlist-top-controls__autocomplete is-open"
    role="status"
  >
    <p className="watchlist-top-controls__autocomplete-status">{children}</p>
  </div>
);
