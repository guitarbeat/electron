export const ELECTRON_MARK_VARIANTS = [
  'pulse-ae',
  'orbit-e',
  'orbit-a',
  'static-gem',
  'split-spark',
] as const;

export type ElectronMarkVariant = (typeof ELECTRON_MARK_VARIANTS)[number];

export const DEFAULT_ELECTRON_MARK_VARIANT: ElectronMarkVariant = 'pulse-ae';

export interface ElectronMarkPalette {
  accent: string;
  accentLight: string;
  secondary: string;
  tertiary: string;
  highlight: string;
  shadow: string;
  mono: string;
}

export interface ElectronMarkMeta {
  name: string;
  label: string;
  eyebrow: string;
  description: string;
  recommended?: boolean;
}

export interface ElectronMarkSvgOptions {
  size?: number | string;
  title?: string;
  monochrome?: boolean;
  palette?: Partial<ElectronMarkPalette>;
  idPrefix?: string;
}

interface ElectronMarkIds {
  primaryGradient: string;
  secondaryGradient: string;
  glowGradient: string;
}

interface ElectronMarkPaint {
  primary: string;
  secondary: string;
  highlight: string;
  glow?: string;
}

const DEFAULT_PALETTE: ElectronMarkPalette = {
  accent: '#ff7fc6',
  accentLight: '#ffc2e6',
  secondary: '#95dcff',
  tertiary: '#a78af2',
  highlight: '#ffffff',
  shadow: '#12081d',
  mono: '#f8fafc',
};

export const ELECTRON_MARK_META: Record<ElectronMarkVariant, ElectronMarkMeta> = {
  'pulse-ae': {
    name: 'Pulse AE',
    label: 'AE monogram',
    eyebrow: 'Angular slash',
    description: 'An angular E whose central slash doubles as an electric A-like pulse.',
    recommended: true,
  },
  'orbit-e': {
    name: 'Orbit E',
    label: 'Electra emblem',
    eyebrow: 'Rounded orbit',
    description: 'A rounded E core wrapped by an off-center spark ring for a softer Electra feel.',
  },
  'orbit-a': {
    name: 'Orbit A',
    label: 'Aaron emblem',
    eyebrow: 'Warm orbit',
    description: 'A bold A glyph wrapped by the same off-center spark ring, tuned for Aaron.',
  },
  'static-gem': {
    name: 'Static Gem',
    label: 'Faceted sigil',
    eyebrow: 'Negative-space counter',
    description: 'A jewel-like sigil with a cutaway lowercase e implied through the central counter.',
  },
  'split-spark': {
    name: 'Split Spark',
    label: 'Compact glyph',
    eyebrow: 'Favicon-first',
    description: 'Three E bars interrupted by mirrored spark diagonals for the strongest tiny-size read.',
  },
};

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

const getResolvedPalette = (palette?: Partial<ElectronMarkPalette>): ElectronMarkPalette => ({
  ...DEFAULT_PALETTE,
  ...palette,
});

const getResolvedSize = (size?: number | string) => {
  if (typeof size === 'number') {
    return `${size}`;
  }

  return size ?? '64';
};

const getMarkIds = (idPrefix: string): ElectronMarkIds => ({
  primaryGradient: `${idPrefix}-primary`,
  secondaryGradient: `${idPrefix}-secondary`,
  glowGradient: `${idPrefix}-glow`,
});

const buildSharedDefs = (palette: ElectronMarkPalette, ids: ElectronMarkIds) => `
<defs>
  <linearGradient id="${ids.primaryGradient}" x1="14" y1="14" x2="50" y2="52" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="${palette.accentLight}" />
    <stop offset="0.42" stop-color="${palette.accent}" />
    <stop offset="1" stop-color="${palette.secondary}" />
  </linearGradient>
  <linearGradient id="${ids.secondaryGradient}" x1="19" y1="12" x2="48" y2="49" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="${palette.highlight}" />
    <stop offset="0.18" stop-color="${palette.secondary}" />
    <stop offset="1" stop-color="${palette.tertiary}" />
  </linearGradient>
  <radialGradient id="${ids.glowGradient}" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(32 31) rotate(90) scale(24)">
    <stop offset="0" stop-color="${palette.highlight}" stop-opacity="0.38" />
    <stop offset="0.54" stop-color="${palette.accent}" stop-opacity="0.24" />
    <stop offset="1" stop-color="${palette.secondary}" stop-opacity="0" />
  </radialGradient>
</defs>`;

const buildPulseAe = (paint: ElectronMarkPaint) => `
${paint.glow ? `<circle cx="32" cy="32" r="23" fill="${paint.glow}" opacity="0.55" />` : ''}
<path d="M21 16V48" stroke="${paint.primary}" stroke-width="6" stroke-linecap="round" />
<path d="M21 18H46" stroke="${paint.primary}" stroke-width="6" stroke-linecap="round" />
<path d="M21 32H37" stroke="${paint.secondary}" stroke-width="6" stroke-linecap="round" />
<path d="M21 46H47" stroke="${paint.primary}" stroke-width="6" stroke-linecap="round" />
<path d="M44 18L31 32H39L24 46" stroke="${paint.secondary}" stroke-width="6.2" stroke-linecap="round" stroke-linejoin="round" />
<path d="M46 17L33 31.5H40.5L26 46" stroke="${paint.highlight}" stroke-opacity="0.84" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
<circle cx="48" cy="16" r="2.4" fill="${paint.highlight}" fill-opacity="0.92" />
`;

const buildOrbitE = (paint: ElectronMarkPaint) => `
${paint.glow ? `<circle cx="32" cy="32" r="24" fill="${paint.glow}" opacity="0.4" />` : ''}
<path d="M41.5 13.5C49.8 17.5 53.8 27.2 51.3 36.2C48.4 46.4 38.3 52.3 28 50.7C17.8 49.1 10.3 40.2 11.2 29.8C11.8 22.4 16 16.4 22.3 13.5" stroke="${paint.secondary}" stroke-width="5.2" stroke-linecap="round" fill="none" />
<path d="M45.5 16.5L50.5 12L53 18.8" stroke="${paint.highlight}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" fill="none" />
<path d="M24.5 18.5V45.5" stroke="${paint.primary}" stroke-width="6" stroke-linecap="round" />
<path d="M24.5 20.5H40.5" stroke="${paint.primary}" stroke-width="6" stroke-linecap="round" />
<path d="M24.5 32H37" stroke="${paint.secondary}" stroke-width="6" stroke-linecap="round" />
<path d="M24.5 43.5H40.5" stroke="${paint.primary}" stroke-width="6" stroke-linecap="round" />
<circle cx="47.5" cy="18.5" r="2" fill="${paint.highlight}" fill-opacity="0.92" />
`;

const buildOrbitA = (paint: ElectronMarkPaint) => `
${paint.glow ? `<circle cx="32" cy="32" r="24" fill="${paint.glow}" opacity="0.4" />` : ''}
<path d="M41.5 13.5C49.8 17.5 53.8 27.2 51.3 36.2C48.4 46.4 38.3 52.3 28 50.7C17.8 49.1 10.3 40.2 11.2 29.8C11.8 22.4 16 16.4 22.3 13.5" stroke="${paint.secondary}" stroke-width="5.2" stroke-linecap="round" fill="none" />
<path d="M45.5 16.5L50.5 12L53 18.8" stroke="${paint.highlight}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" fill="none" />
<path d="M22 45.5L32 19L42 45.5" stroke="${paint.primary}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
<path d="M25.5 33.5H38.5" stroke="${paint.secondary}" stroke-width="6" stroke-linecap="round" />
<circle cx="47.5" cy="18.5" r="2" fill="${paint.highlight}" fill-opacity="0.92" />
`;

const buildStaticGem = (paint: ElectronMarkPaint) => `
${paint.glow ? `<circle cx="32" cy="32" r="24" fill="${paint.glow}" opacity="0.42" />` : ''}
<path fill-rule="evenodd" d="M32 7.5L49.5 18.5L44.5 46.5L32 56.5L19.5 46.5L14.5 18.5L32 7.5ZM32 20C38.63 20 44 25.37 44 32C44 38.63 38.63 44 32 44C25.37 44 20 38.63 20 32C20 25.37 25.37 20 32 20ZM31.5 29H47V35H31.5V29Z" fill="${paint.primary}" />
<path d="M14.5 18.5L32 28.5L49.5 18.5" stroke="${paint.highlight}" stroke-opacity="0.26" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
<path d="M32 7.5V28.5" stroke="${paint.highlight}" stroke-opacity="0.18" stroke-width="2.4" stroke-linecap="round" />
<path d="M32 28.5V56.5" stroke="${paint.highlight}" stroke-opacity="0.14" stroke-width="2.2" stroke-linecap="round" />
<path d="M19.5 46.5L32 28.5L44.5 46.5" stroke="${paint.secondary}" stroke-opacity="0.6" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
`;

const buildSplitSpark = (paint: ElectronMarkPaint) => `
${paint.glow ? `<circle cx="32" cy="32" r="22" fill="${paint.glow}" opacity="0.48" />` : ''}
<path d="M18 19H46" stroke="${paint.primary}" stroke-width="6.5" stroke-linecap="round" />
<path d="M18 32H40" stroke="${paint.secondary}" stroke-width="6.5" stroke-linecap="round" />
<path d="M18 45H46" stroke="${paint.primary}" stroke-width="6.5" stroke-linecap="round" />
<path d="M44.5 19L32 32L44.5 45" stroke="${paint.secondary}" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round" />
<path d="M27 19L39 32L27 45" stroke="${paint.highlight}" stroke-opacity="0.86" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
<circle cx="17" cy="32" r="2.2" fill="${paint.highlight}" fill-opacity="0.85" />
`;

const buildVariantMarkup = (variant: ElectronMarkVariant, paint: ElectronMarkPaint) => {
  switch (variant) {
    case 'pulse-ae':
      return buildPulseAe(paint);
    case 'orbit-e':
      return buildOrbitE(paint);
    case 'orbit-a':
      return buildOrbitA(paint);
    case 'static-gem':
      return buildStaticGem(paint);
    case 'split-spark':
      return buildSplitSpark(paint);
    default:
      return buildPulseAe(paint);
  }
};

export const isElectronMarkVariant = (value: string | null | undefined): value is ElectronMarkVariant =>
  value != null && ELECTRON_MARK_VARIANTS.some((variant) => variant === value);

export const getElectronMarkSvgMarkup = (
  variant: ElectronMarkVariant,
  options: ElectronMarkSvgOptions = {}
) => {
  const resolvedTitle = options.title?.trim() || '';
  const resolvedSize = escapeXml(getResolvedSize(options.size));
  const palette = getResolvedPalette(options.palette);

  const escapedPalette: ElectronMarkPalette = {
    accent: escapeXml(palette.accent),
    accentLight: escapeXml(palette.accentLight),
    secondary: escapeXml(palette.secondary),
    tertiary: escapeXml(palette.tertiary),
    highlight: escapeXml(palette.highlight),
    shadow: escapeXml(palette.shadow),
    mono: escapeXml(palette.mono),
  };

  const idPrefix = escapeXml(
    options.idPrefix ?? `${variant}-${options.monochrome ? 'mono' : 'color'}`
  );
  const ids = getMarkIds(idPrefix);
  const titleId = `${idPrefix}-title`;

  const paint: ElectronMarkPaint = options.monochrome
    ? {
        primary: escapedPalette.mono,
        secondary: escapedPalette.mono,
        highlight: escapedPalette.mono,
      }
    : {
        primary: `url(#${ids.primaryGradient})`,
        secondary: `url(#${ids.secondaryGradient})`,
        highlight: escapedPalette.highlight,
        glow: `url(#${ids.glowGradient})`,
      };

  const a11yAttributes = resolvedTitle
    ? `role="img" aria-labelledby="${titleId}"`
    : 'aria-hidden="true"';
  const titleMarkup = resolvedTitle
    ? `<title id="${titleId}">${escapeXml(resolvedTitle)}</title>`
    : '';
  const defsMarkup = options.monochrome ? '' : buildSharedDefs(escapedPalette, ids);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${resolvedSize}" height="${resolvedSize}" viewBox="0 0 64 64" fill="none" ${a11yAttributes}>${titleMarkup}${defsMarkup}${buildVariantMarkup(variant, paint)}</svg>`;
};

export const getElectronMarkDataUri = (
  variant: ElectronMarkVariant,
  options: ElectronMarkSvgOptions = {}
) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(getElectronMarkSvgMarkup(variant, options))}`;
