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
import { resolvePosterUrl } from "@/utils/catPosters";

// ── Icons ───────────────────────────────────────────────────────────────────

export const SearchFieldLensIcon: React.FC<{
  size?: number;
  className?: string;
}> = ({ size = 18, className = "" }) => (
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

export const SparkleFilterIcon: React.FC<{ size?: number }> = ({
  size = 14,
}) => (
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

export interface WorkspaceSearchFieldProps extends Omit<
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
        className={cn("rounded-xl bg-slate-800/80 border border-slate-700/50 shadow-lg transition-all duration-150 hover:border-indigo-500/30 focus-within:border-indigo-500/70 focus-within:bg-slate-800 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.16)]",
          isAutocompleteActive && "is-autocomplete-active",
        )}
        onSubmit={onSubmit}
        noValidate
      >
        <div
          ref={shellRef as React.Ref<HTMLDivElement>}
          className={cn(
            "workspace-search__search-shell",
            icon && "workspace-search__search-shell--with-icon",
          )}
          onFocusCapture={onShellFocusCapture}
          onBlurCapture={onShellBlurCapture}
        >
          <div className="bg-transparent shadow-none transform-none text-slate-400 focus-within:text-indigo-400" aria-hidden="true">
            {icon ?? <SearchFieldLensIcon size={18} />}
          </div>

          <div className="flex-1 min-w-0 relative h-full">{input}</div>

          {actions && (
            <div className="flex items-center gap-1.5 px-1.5 h-full">{actions}</div>
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
  <div className={cn("flex items-center gap-1.5", className)}>
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
    forwardedRef,
  ) => {
    const internalRef = useRef<HTMLInputElement | null>(null);

    const handleRef = useCallback(
      (node: HTMLInputElement | null) => {
        internalRef.current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          (
            forwardedRef as React.MutableRefObject<HTMLInputElement | null>
          ).current = node;
        }
        if (typeof inputRef === "function") {
          inputRef(node);
        } else if (inputRef) {
          (
            inputRef as React.MutableRefObject<HTMLInputElement | null>
          ).current = node;
        }
      },
      [forwardedRef, inputRef],
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
      <div className="relative w-full h-11 flex items-center">
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
          aria-activedescendant={
            combobox ? combobox.activeDescendantId : undefined
          }
          className={cn("w-full h-full bg-transparent border-none text-slate-50 text-[0.95rem] px-3 focus:outline-none focus:ring-0 placeholder:text-slate-500", className)}
          autoComplete="off"
          spellCheck={false}
          {...rest}
        />

        {hasValue && (
          <button
            type="button"
            tabIndex={-1}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 bg-transparent hover:bg-slate-700/50 hover:text-slate-200 transition-colors cursor-pointer"
            onClick={handleClearClick}
            aria-label={clearButtonAriaLabel}
            title={clearButtonAriaLabel}
          >
            <ClearInputIcon size={12} />
          </button>
        )}
      </div>
    );
  },
);
WorkspaceSearchField.displayName = "WorkspaceSearchField";

// ── Autocomplete Subcomponents ──────────────────────────────────────────────

export interface WorkspaceAutocompletePanelProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "aria-label"
> {
  isOpen?: boolean;
  ariaLabel?: string;
  "aria-label"?: string;
}

export const WorkspaceAutocompletePanel = forwardRef<
  HTMLDivElement,
  WorkspaceAutocompletePanelProps
>(
  (
    {
      isOpen = true,
      ariaLabel,
      className,
      children,
      "aria-label": ariaLabelProp,
      ...rest
    },
    ref,
  ) => {
    if (!isOpen) return null;
    return (
      <div
        ref={ref}
        role="listbox"
        aria-label={ariaLabel || ariaLabelProp}
        className={cn("absolute top-[calc(100%+0.5rem)] left-0 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-[100] transform transition-all duration-200 opacity-100 translate-y-0", className)}
        {...rest}
      >
        <div className="max-h-[28rem] overflow-y-auto overscroll-contain flex flex-col p-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">{children}</div>
      </div>
    );
  },
);
WorkspaceAutocompletePanel.displayName = "WorkspaceAutocompletePanel";

export const WorkspaceAutocompleteLoading: React.FC = () => (
  <div
    className="p-6 flex flex-col items-center justify-center gap-3 text-slate-400"
    role="status"
    aria-label="Searching catalog..."
  >
    <div className="flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/60 animate-pulse" />
      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/60 animate-pulse" />
      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/60 animate-pulse" />
    </div>
    <span className="text-xs font-medium tracking-wide uppercase text-slate-500">
      Searching catalog...
    </span>
  </div>
);

export interface WorkspaceAutocompleteStatusProps {
  children: React.ReactNode;
  role?: "status" | "alert";
}

export const WorkspaceAutocompleteStatus: React.FC<
  WorkspaceAutocompleteStatusProps
> = ({ children, role = "status" }) => (
  <div
    className={cn("p-4 text-center text-sm text-slate-400",
      role === "alert" && "is-error",
    )}
    role={role}
  >
    {role === "alert" && (
      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" aria-hidden="true" />
    )}
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

export const WorkspaceAutocompleteOption: React.FC<
  WorkspaceAutocompleteOptionProps
> = ({ id, isActive, onSelect, onHover, children }) => (
  <button
    id={id}
    type="button"
    role="option"
    aria-selected={isActive}
    className={cn(
      "w-full flex items-center gap-3 p-2 rounded-lg text-left cursor-pointer transition-all duration-150 select-none",
      isActive && "bg-slate-800/80 shadow-sm border border-white/5",
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

export const WorkspaceAutocompleteCopy: React.FC<
  WorkspaceAutocompleteCopyProps
> = ({ title, meta }) => (
  <span className="flex flex-col min-w-0 flex-1 gap-0.5">
    <span className="text-[0.925rem] font-medium text-slate-100 truncate">{title}</span>
    {meta ? (
      <span className="text-xs text-slate-400 truncate">{meta}</span>
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
      <span
        className="w-full h-full bg-slate-800 flex items-center justify-center text-[0.6rem] text-slate-500 uppercase font-semibold tracking-wider"
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
      loading="lazy"
      className={cn(
        "workspace-search__autocomplete-poster-image",
        loaded && "is-loaded",
      )}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
    />
  );
};

export const WorkspaceAutocompletePoster: React.FC<
  WorkspaceAutocompletePosterProps
> = ({ src, fallbackLetter }) => {
  const activeSrc = resolvePosterUrl(src, fallbackLetter);
  return (
    <span className="w-10 h-14 rounded-md overflow-hidden shrink-0 bg-slate-800 relative shadow-sm border border-white/5">
      <WorkspaceAutocompletePosterImage
        key={activeSrc}
        src={activeSrc}
        fallbackLetter={fallbackLetter}
      />
    </span>
  );
};

export interface WorkspaceAutocompleteGroupProps {
  children: React.ReactNode;
}

export const WorkspaceAutocompleteGroup: React.FC<
  WorkspaceAutocompleteGroupProps
> = ({ children }) => (
  <div className="px-2 pt-3 pb-1.5" role="presentation">
    <span className="text-[0.65rem] font-bold tracking-wider text-slate-500 uppercase">
      {children}
    </span>
  </div>
);

export interface WorkspaceAutocompleteNoMatchPanelProps {
  children: React.ReactNode;
}

export const WorkspaceAutocompleteNoMatchPanel: React.FC<
  WorkspaceAutocompleteNoMatchPanelProps
> = ({ children }) => (
  <div className="absolute top-[calc(100%+0.5rem)] left-0 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-[100] transform transition-all duration-200 opacity-100 translate-y-0" role="status">
    <div className="max-h-[28rem] overflow-y-auto overscroll-contain flex flex-col p-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
      <p className="p-4 text-center text-sm text-slate-400">{children}</p>
    </div>
  </div>
);
