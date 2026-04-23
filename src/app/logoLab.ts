import {
  DEFAULT_ELECTRON_MARK_VARIANT,
  isElectronMarkVariant,
  type ElectronMarkVariant,
} from '../branding/ElectronMarkData.ts';

export const LOGO_LAB_QUERY_PARAM = 'logo-lab';
export const LOGO_VARIANT_QUERY_PARAM = 'logo-variant';

const FALSEY_QUERY_VALUES = new Set(['0', 'false', 'no', 'off']);

export const isLogoLabEnabled = (search: string) => {
  const params = new URLSearchParams(search);
  const value = params.get(LOGO_LAB_QUERY_PARAM);

  if (value == null) {
    return false;
  }

  return !FALSEY_QUERY_VALUES.has(value.toLowerCase());
};

export const getRequestedLogoVariant = (search: string): ElectronMarkVariant => {
  const params = new URLSearchParams(search);
  const requested = params.get(LOGO_VARIANT_QUERY_PARAM);
  return isElectronMarkVariant(requested) ? requested : DEFAULT_ELECTRON_MARK_VARIANT;
};
