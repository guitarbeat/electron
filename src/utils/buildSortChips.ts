import type { MagicToggleOption } from "@/components/ui/MagicToggle";

export interface SortChipDefinition<T extends string> {
  value: T;
  desktopLabel: string;
  mobileLabel?: string;
  ariaLabel: string;
}

export interface SortChipSets<T extends string> {
  desktop: MagicToggleOption<T>[];
  mobile: MagicToggleOption<T>[];
}

/** Build desktop and mobile sort chip options from a single definition list. */
export function buildSortChips<T extends string>(
  definitions: SortChipDefinition<T>[],
): SortChipSets<T> {
  return {
    desktop: definitions.map(({ value, desktopLabel, ariaLabel }) => ({
      value,
      label: desktopLabel,
      ariaLabel,
    })),
    mobile: definitions.map(
      ({ value, desktopLabel, mobileLabel, ariaLabel }) => ({
        value,
        label: mobileLabel ?? desktopLabel,
        ariaLabel,
      }),
    ),
  };
}
