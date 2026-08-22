import React from "react";
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

export const WorkspaceSearchActions: FC<{ children: ReactNode }> = ({
  children,
}) => <div className="workspace-search__search-actions">{children}</div>;

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
  <div className="workspace-search__stage">
    <form
      className={`workspace-search__search-form workspace-search__search-form--stack${
        isAutocompleteActive ? " is-autocomplete-active" : ""
      }`}
      onSubmit={onSubmit}
    >
      <div
        ref={shellRef as React.Ref<HTMLDivElement>}
        className={`workspace-search__search-shell${
          icon ? " workspace-search__search-shell--with-icon" : ""
        }`}
        onFocusCapture={onShellFocusCapture}
        onBlurCapture={onShellBlurCapture}
      >
        {icon ? (
          <span className="workspace-search__search-icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <div className="workspace-search__search-input-wrap">{input}</div>
        {actions}
      </div>
      {autocomplete}
    </form>

    {error ? (
      <div className="workspace-search__error" role="alert">
        {error}
      </div>
    ) : null}
  </div>
);

export default WorkspaceSearchShell;
