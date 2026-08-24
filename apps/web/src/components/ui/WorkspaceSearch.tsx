import React, {
  useState,
  useCallback,
  useRef,
  forwardRef,
  type FormEvent,
  type ReactNode,
  type Ref,
  type HTMLAttributes,
} from "react";
import { cn } from "@/utils/shared";

// ── Icons ───────────────────────────────────────────────────────────────────

export const SearchFieldLensIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 18,
  className = "",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7.5" />
    <line x1="21" y1="21" x2="16.5" y2="16.5" />
  </svg>
);

export const ClearInputIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const SparkleFilterIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 2l2.4 6.9L21.3 12l-6.9 3.1L12 22l-2.4-6.9L2.7 12l6.9-3.1L12 2z" />
  </svg>
);

// ── Types ───────────────────────────────────────────────────────────────────

export interface WorkspaceComboboxConfig {
  expanded: boolean;
  controlsId?: string;
  activeDescendantId?: string;
}

export interface WorkspaceSearchShellProps {
  icon?: ReactNode;
  isAutocompleteActive?: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  input: ReactNode;
  autocomplete?: ReactNode;
  actions?: ReactNode;
  error?: string | null;
  shellRef?: Ref<HTMLDivElement>;
  onShellFocusCapture?: () => void;
  onShellBlurCapture?: () => void;
}

export interface WorkspaceSearchFieldProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "aria-label"
  > {
  inputRef?: React.Ref<HTMLInputElement>;
  value?: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
  ariaLabel?: string;
  combobox?: WorkspaceComboboxConfig | null;
  clearButtonAriaLabel?: string;
  "aria-label"?: string;
}

// ── WorkspaceSearchShell ────────────────────────────────────────────────────

export const WorkspaceSearchShell: React.FC<WorkspaceSearchShellProps> = ({
  icon,
  isAutocompleteActive = false,
  onSubmit,
  input,
  autocomplete,
  actions,
  error,
  shellRef,
  onShellFocusCapture,
  onShellBlurCapture,
}) => {
  return (
    <div className="workspace-search__stage">
      <form
        className={cn(
          "workspace-search__search-form",
          isAutocompleteActive && "is-autocomplete-active"
        )}
        onSubmit={onSubmit}
        noValidate
      >
        <div
          ref={shellRef as React.Ref<HTMLDivElement>}
          className={cn(
            "workspace-search__search-shell",
            icon && "workspace-search__search-shell--with-icon"
          )}
          onFocusCapture={onShellFocusCapture}
          onBlurCapture={onShellBlurCapture}
        >
          <div className="workspace-search__search-icon" aria-hidden="true">
            {icon ?? <SearchFieldLensIcon size={18} />}
          </div>

          <div className="workspace-search__search-input-wrap">
            {input}
          </div>

          {actions && (
            <div className="workspace-search__search-actions">
              {actions}
            </div>
          )}
        </div>

        {autocomplete}
      </form>

      {error ? (
        <div className="workspace-search__error" role="alert">
          <span className="workspace-search__error-dot" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}
    </div>
  );
};

// ── WorkspaceSearchActions ──────────────────────────────────────────────────

export const WorkspaceSearchActions: React.FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn("workspace-search__search-actions-cluster", className)}>
    {children}
  </div>
);

// ── WorkspaceSearchField ────────────────────────────────────────────────────

export const WorkspaceSearchField = forwardRef<
  HTMLInputElement,
  WorkspaceSearchFieldProps
>(
  (
    {
      inputRef,
      value = "",
      onChange,
      onClear,
      ariaLabel,
      combobox,
      className,
      clearButtonAriaLabel = "Clear search input",
      type = "text",
      "aria-label": ariaLabelProp,
      placeholder = "Add a movie, show, or place...",
      onFocus,
      onBlur,
      ...rest
    },
    forwardedRef
  ) => {
    const internalRef = useRef<HTMLInputElement | null>(null);

    const handleRef = useCallback(
      (node: HTMLInputElement | null) => {
        internalRef.current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
        }
        if (typeof inputRef === "function") {
          inputRef(node);
        } else if (inputRef) {
          (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
        }
      },
      [forwardedRef, inputRef]
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value);
    };

    const handleClearClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (onClear) {
        onClear();
      } else {
        onChange?.("");
      }
      internalRef.current?.focus();
    };

    const hasValue = Boolean(value && value.trim().length > 0);

    return (
      <div className="workspace-search__field-container">
        <input
          ref={handleRef}
          type={type}
          value={value}
          onChange={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          aria-label={ariaLabel || ariaLabelProp || "Search input"}
          role={combobox ? "combobox" : rest.role}
          aria-expanded={combobox ? combobox.expanded : undefined}
          aria-controls={combobox ? combobox.controlsId : undefined}
          aria-autocomplete={combobox ? "list" : undefined}
          aria-activedescendant={combobox ? combobox.activeDescendantId : undefined}
          className={cn("workspace-search__search-field", className)}
          autoComplete="off"
          spellCheck={false}
          {...rest}
        />

        {hasValue && (
          <button
            type="button"
            tabIndex={-1}
            className="workspace-search__clear-btn"
            onClick={handleClearClick}
            aria-label={clearButtonAriaLabel}
            title={clearButtonAriaLabel}
          >
            <ClearInputIcon size={12} />
          </button>
        )}
      </div>
    );
  }
);
WorkspaceSearchField.displayName = "WorkspaceSearchField";

// ── Autocomplete Subcomponents ──────────────────────────────────────────────

export interface WorkspaceAutocompletePanelProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "aria-label"> {
  isOpen?: boolean;
  ariaLabel?: string;
  "aria-label"?: string;
}

export const WorkspaceAutocompletePanel = forwardRef<
  HTMLDivElement,
  WorkspaceAutocompletePanelProps
>(({ isOpen = true, ariaLabel, className, children, "aria-label": ariaLabelProp, ...rest }, ref) => {
  if (!isOpen) return null;
  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={ariaLabel || ariaLabelProp}
      className={cn("workspace-search__autocomplete is-open", className)}
      {...rest}
    >
      <div className="workspace-search__autocomplete-inner">
        {children}
      </div>
    </div>
  );
});
WorkspaceAutocompletePanel.displayName = "WorkspaceAutocompletePanel";

export const WorkspaceAutocompleteLoading: React.FC = () => (
  <div
    className="workspace-search__autocomplete-loading"
    role="status"
    aria-label="Searching catalog..."
  >
    <div className="workspace-search__loading-dots">
      <span className="workspace-search__autocomplete-loading-dot" />
      <span className="workspace-search__autocomplete-loading-dot" />
      <span className="workspace-search__autocomplete-loading-dot" />
    </div>
    <span className="workspace-search__loading-label">Searching catalog...</span>
  </div>
);

export interface WorkspaceAutocompleteStatusProps {
  children: React.ReactNode;
  role?: "status" | "alert";
}

export const WorkspaceAutocompleteStatus: React.FC<WorkspaceAutocompleteStatusProps> = ({
  children,
  role = "status",
}) => (
  <div
    className={cn(
      "workspace-search__autocomplete-status",
      role === "alert" && "is-error"
    )}
    role={role}
  >
    {role === "alert" && <span className="workspace-search__status-dot" aria-hidden="true" />}
    <span>{children}</span>
  </div>
);

export interface WorkspaceAutocompleteOptionProps {
  id: string;
  isActive: boolean;
  onSelect: () => void;
  onHover?: () => void;
  children: React.ReactNode;
}

export const WorkspaceAutocompleteOption: React.FC<WorkspaceAutocompleteOptionProps> = ({
  id,
  isActive,
  onSelect,
  onHover,
  children,
}) => (
  <button
    id={id}
    type="button"
    role="option"
    aria-selected={isActive}
    className={cn(
      "workspace-search__autocomplete-option",
      isActive && "is-active"
    )}
    onPointerDown={(event) => {
      event.preventDefault();
      onSelect();
    }}
    onMouseEnter={onHover}
  >
    {children}
  </button>
);

export interface WorkspaceAutocompleteCopyProps {
  title: string;
  meta?: string;
}

export const WorkspaceAutocompleteCopy: React.FC<WorkspaceAutocompleteCopyProps> = ({
  title,
  meta,
}) => (
  <span className="workspace-search__autocomplete-copy">
    <span className="workspace-search__autocomplete-title">{title}</span>
    {meta ? (
      <span className="workspace-search__autocomplete-meta">{meta}</span>
    ) : null}
  </span>
);

export interface WorkspaceAutocompletePosterProps {
  src?: string;
  fallbackLetter: string;
}

export const WorkspaceAutocompletePosterImage: React.FC<{
  src: string;
  fallbackLetter: string;
}> = ({ src, fallbackLetter }) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="workspace-search__autocomplete-poster-fallback" aria-hidden>
        {fallbackLetter}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt=""
      decoding="async"
      loading="lazy"
      className={cn(
        "workspace-search__autocomplete-poster-image",
        loaded && "is-loaded"
      )}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
    />
  );
};

export const WorkspaceAutocompletePoster: React.FC<WorkspaceAutocompletePosterProps> = ({
  src,
  fallbackLetter,
}) => (
  <span className="workspace-search__autocomplete-poster">
    {src ? (
      <WorkspaceAutocompletePosterImage
        key={src}
        src={src}
        fallbackLetter={fallbackLetter}
      />
    ) : (
      <span className="workspace-search__autocomplete-poster-fallback" aria-hidden>
        {fallbackLetter}
      </span>
    )}
  </span>
);

export interface WorkspaceAutocompleteGroupProps {
  children: React.ReactNode;
}

export const WorkspaceAutocompleteGroup: React.FC<WorkspaceAutocompleteGroupProps> = ({
  children,
}) => (
  <div className="workspace-search__autocomplete-group" role="presentation">
    <span className="workspace-search__autocomplete-group-text">{children}</span>
  </div>
);

export interface WorkspaceAutocompleteNoMatchPanelProps {
  children: React.ReactNode;
}

export const WorkspaceAutocompleteNoMatchPanel: React.FC<WorkspaceAutocompleteNoMatchPanelProps> = ({
  children,
}) => (
  <div className="workspace-search__autocomplete is-open" role="status">
    <div className="workspace-search__autocomplete-inner">
      <p className="workspace-search__autocomplete-status">{children}</p>
    </div>
  </div>
);
