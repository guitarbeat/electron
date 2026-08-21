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
    className={`workspace-search__autocomplete${isOpen ? " is-open" : ""}`}
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
    className="workspace-search__autocomplete-loading"
    role="status"
    aria-label="Searching"
  >
    <span className="workspace-search__autocomplete-loading-dot" />
    <span className="workspace-search__autocomplete-loading-dot" />
    <span className="workspace-search__autocomplete-loading-dot" />
  </div>
);

interface WorkspaceAutocompleteStatusProps {
  children: React.ReactNode;
  role?: "status" | "alert";
}

export const WorkspaceAutocompleteStatus: React.FC<
  WorkspaceAutocompleteStatusProps
> = ({ children, role = "status" }) => (
  <div className="workspace-search__autocomplete-status" role={role}>
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
    className={`workspace-search__autocomplete-option${
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
  <span className="workspace-search__autocomplete-copy">
    <span className="workspace-search__autocomplete-title">{title}</span>
    {meta ? (
      <span className="workspace-search__autocomplete-meta">{meta}</span>
    ) : null}
  </span>
);

interface WorkspaceAutocompletePosterProps {
  src?: string;
  fallbackLetter: string;
}

const WorkspaceAutocompletePosterImage: React.FC<{
  src: string;
  fallbackLetter: string;
}> = ({ src, fallbackLetter }) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className="workspace-search__autocomplete-poster-fallback"
        aria-hidden
      >
        {fallbackLetter}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt=""
      decoding="async"
      className={`workspace-search__autocomplete-poster-image${
        loaded ? " is-loaded" : ""
      }`}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
    />
  );
};

export const WorkspaceAutocompletePoster: React.FC<
  WorkspaceAutocompletePosterProps
> = ({ src, fallbackLetter }) => (
  <span className="workspace-search__autocomplete-poster">
    {src ? (
      <WorkspaceAutocompletePosterImage
        key={src}
        src={src}
        fallbackLetter={fallbackLetter}
      />
    ) : (
      <span
        className="workspace-search__autocomplete-poster-fallback"
        aria-hidden
      >
        {fallbackLetter}
      </span>
    )}
  </span>
);

interface WorkspaceAutocompleteGroupProps {
  children: React.ReactNode;
}

export const WorkspaceAutocompleteGroup: React.FC<
  WorkspaceAutocompleteGroupProps
> = ({ children }) => (
  <div className="workspace-search__autocomplete-group" role="presentation">
    {children}
  </div>
);

interface WorkspaceAutocompleteNoMatchPanelProps {
  children: React.ReactNode;
}

export const WorkspaceAutocompleteNoMatchPanel: React.FC<
  WorkspaceAutocompleteNoMatchPanelProps
> = ({ children }) => (
  <div
    className="workspace-search__autocomplete is-open"
    role="status"
  >
    <p className="workspace-search__autocomplete-status">{children}</p>
  </div>
);
