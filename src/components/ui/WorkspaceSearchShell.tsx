import type { FC, FormEvent, ReactNode, Ref } from "react";

interface WorkspaceSearchShellProps {
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

const WorkspaceSearchShell: FC<WorkspaceSearchShellProps> = ({
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
}) => (
  <div className="watchlist-top-controls__stage">
    <form
      className={`watchlist-top-controls__search-form watchlist-top-controls__search-form--stack${
        isAutocompleteActive ? " is-autocomplete-active" : ""
      }`}
      onSubmit={onSubmit}
    >
      <div
        ref={shellRef}
        className={`watchlist-top-controls__search-shell${
          icon ? " watchlist-top-controls__search-shell--with-icon" : ""
        }`}
        onFocusCapture={onShellFocusCapture}
        onBlurCapture={onShellBlurCapture}
      >
        {icon ? (
          <span className="watchlist-top-controls__search-icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <div className="watchlist-top-controls__search-input-wrap">{input}</div>
      </div>
      {autocomplete}
      {actions}
    </form>

    {error ? (
      <div className="watchlist-top-controls__error" role="alert">
        {error}
      </div>
    ) : null}
  </div>
);

export default WorkspaceSearchShell;
