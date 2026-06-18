import type { FC, KeyboardEvent, RefObject } from "react";
import { Input } from "@/ui/FormFields";
import WorkspaceSearchClear from "@/components/ui/WorkspaceSearchClear";

export interface WorkspaceSearchFieldComboboxProps {
  expanded: boolean;
  controlsId: string;
  activeDescendantId?: string;
}

export interface WorkspaceSearchFieldProps {
  inputRef: RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  placeholder: string;
  ariaLabel: string;
  onClear: () => void;
  combobox?: WorkspaceSearchFieldComboboxProps | null;
}

const WorkspaceSearchField: FC<WorkspaceSearchFieldProps> = ({
  inputRef,
  value,
  onChange,
  onFocus,
  onKeyDown,
  placeholder,
  ariaLabel,
  onClear,
  combobox = null,
}) => (
  <>
    <Input
      ref={inputRef}
      className="watchlist-top-controls__search-field"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      aria-label={ariaLabel}
      role={combobox ? "combobox" : undefined}
      aria-autocomplete={combobox ? "list" : undefined}
      aria-expanded={combobox ? combobox.expanded : undefined}
      aria-controls={combobox?.controlsId}
      aria-activedescendant={combobox?.activeDescendantId}
      autoComplete="off"
      fullWidth
    />
    {value ? <WorkspaceSearchClear onClick={onClear} /> : null}
  </>
);

export default WorkspaceSearchField;
