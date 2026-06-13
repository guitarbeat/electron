import React, { useEffect, useMemo, useRef, useState } from 'react';
import { applyTheme } from '@/theme/applyTheme';
import type { ThemeName } from '@/theme/themes';
import { radius, spacing } from '@/theme/tokens';
import './CohesionAudit.css';

const colorVars = [
  '--color-accent',
  '--color-accent-hover',
  '--color-accent-light',
  '--color-secondary',
  '--color-tertiary',
  '--color-quaternary',
  '--color-quinary',
  '--color-text-primary',
  '--color-text-secondary',
  '--color-text-tertiary',
  '--color-border-subtle',
  '--color-background',
  '--color-surface-0',
  '--color-surface-1',
  '--color-surface-2',
  '--color-surface-3',
];

const hardcodedColors = [
  { label: 'GameDrawer Spin (was)', value: '#667eea' },
  { label: 'GameDrawer Match (was)', value: '#f093fb' },
  { label: 'GameDrawer Quiz (was)', value: '#4facfe' },
  { label: 'AppHeader surface (was)', value: 'rgba(255,255,255,0.06)' },
  { label: 'AppHeader border (was)', value: 'rgba(255,255,255,0.12)' },
];

const fonts = [
  { label: '--font-display (titles)', cssVar: '--font-display' },
  { label: '--font-interface (UI/body)', cssVar: '--font-interface' },
  { label: '--font-mono (code)', cssVar: '--font-mono' },
];

const surfaceVars = [
  '--color-surface-0',
  '--color-surface-1',
  '--color-surface-2',
  '--color-surface-3',
];

const radiusEntries = Object.entries(radius);

const useResolvedVar = (cssVar: string, deps: unknown[] = []): string => {
  const [value, setValue] = useState('');

  useEffect(() => {
    setValue(getComputedStyle(document.body).getPropertyValue(cssVar).trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cssVar, ...deps]);

  return value;
};

const ColorSwatch: React.FC<{ cssVar: string; theme: ThemeName }> = ({ cssVar, theme }) => {
  const value = useResolvedVar(cssVar, [theme]);

  return (
    <div className="cohesion-audit__swatch">
      <div className="cohesion-audit__swatch-chip" style={{ background: `var(${cssVar})` }} />
      <span className="cohesion-audit__swatch-name">{cssVar}</span>
      <span className="cohesion-audit__swatch-value">{value || '-'}</span>
    </div>
  );
};

interface ChecklistItem {
  label: string;
  pass: boolean;
  detail?: string;
}

const SnapshotChecklist: React.FC<{
  sampleRef: React.RefObject<HTMLDivElement | null>;
  theme: ThemeName;
}> = ({ sampleRef, theme }) => {
  const [items, setItems] = useState<ChecklistItem[]>([]);

  useEffect(() => {
    const el = sampleRef.current;
    if (!el) return;

    const titleEl = el.querySelector<HTMLElement>('[data-cohesion-title]') ?? el;
    const bodyEl = el.querySelector<HTMLElement>('[data-cohesion-body]') ?? el;
    const computed = getComputedStyle(el);
    const titleComputed = getComputedStyle(titleEl);
    const bodyComputed = getComputedStyle(bodyEl);

    const containsPapyrus = (value: string) => /papyrus/i.test(value);
    const containsHardcodedHex =
      computed.backgroundImage !== 'none'
        ? /#(667eea|f093fb|4facfe|764ba2|f5576c|00f2fe)/i.test(computed.backgroundImage)
        : false;
    const radiusIsTokenLike =
      /^(0|6|10|14|16|20)px$/.test(computed.borderRadius) || computed.borderRadius === '9999px';

    setItems([
      {
        label: 'Title uses the display font',
        pass: containsPapyrus(titleComputed.fontFamily),
        detail: titleComputed.fontFamily.split(',')[0],
      },
      {
        label: 'Body uses the interface font',
        pass: !containsPapyrus(bodyComputed.fontFamily) || titleEl === bodyEl,
        detail: bodyComputed.fontFamily.split(',')[0],
      },
      {
        label: 'No legacy hardcoded gradient hex values',
        pass: !containsHardcodedHex,
        detail: containsHardcodedHex ? 'literal hex found' : 'ok',
      },
      {
        label: 'Border-radius matches the token scale',
        pass: radiusIsTokenLike,
        detail: computed.borderRadius,
      },
      {
        label: 'Background uses a themed surface',
        pass:
          computed.backgroundColor !== 'rgba(0, 0, 0, 0)' || computed.backgroundImage !== 'none',
        detail:
          computed.backgroundColor !== 'rgba(0, 0, 0, 0)'
            ? computed.backgroundColor
            : 'gradient',
      },
    ]);
  }, [sampleRef, theme]);

  return (
    <ul className="cohesion-audit__checklist">
      {items.map((item) => (
        <li
          key={item.label}
          className={`cohesion-audit__check ${item.pass ? 'is-pass' : 'is-warn'}`}
        >
          <span className="cohesion-audit__check-icon">{item.pass ? 'OK' : '!'}</span>
          <span>{item.label}</span>
          {item.detail ? <span className="cohesion-audit__check-detail">{item.detail}</span> : null}
        </li>
      ))}
    </ul>
  );
};

const CohesionAudit: React.FC = () => {
  const [theme, setTheme] = useState<ThemeName>(
    () => (document.body.getAttribute('data-theme') as ThemeName) || 'movies'
  );
  const watchlistRef = useRef<HTMLDivElement>(null);
  const placesRef = useRef<HTMLDivElement>(null);
  const gamesRef = useRef<HTMLDivElement>(null);
  const radii = useMemo(() => radiusEntries, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <div className="cohesion-audit">
      <div className="cohesion-audit__container">
        <header className="cohesion-audit__header">
          <div>
            <h1 className="cohesion-audit__title">Visual Cohesion Audit</h1>
            <p className="cohesion-audit__subtitle">
              Compare live subsystem styling against the shared theme tokens.
            </p>
          </div>
          <div className="cohesion-audit__theme-switch" role="tablist" aria-label="Theme">
            {(['movies', 'places'] as const).map((name) => (
              <button
                key={name}
                type="button"
                role="tab"
                aria-selected={theme === name}
                className={`cohesion-audit__theme-btn ${theme === name ? 'is-active' : ''}`}
                onClick={() => setTheme(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </header>

        <section className="cohesion-audit__section">
          <h2 className="cohesion-audit__section-title">Fonts</h2>
          <p className="cohesion-audit__section-note">
            Same sample sentence rendered with each font role.
          </p>
          {fonts.map((font) => (
            <div key={font.cssVar} className="cohesion-audit__font-row">
              <span className="cohesion-audit__font-label">
                {font.label} - <code>{font.cssVar}</code>
              </span>
              <span
                className="cohesion-audit__font-sample"
                style={{ fontFamily: `var(${font.cssVar})` }}
              >
                The quick brown fox jumps over the lazy dog. 0123456789
              </span>
            </div>
          ))}
        </section>

        <section className="cohesion-audit__section">
          <h2 className="cohesion-audit__section-title">Theme colors</h2>
          <p className="cohesion-audit__section-note">
            Resolved values for <code>body[data-theme=&quot;{theme}&quot;]</code>.
          </p>
          <div className="cohesion-audit__grid">
            {colorVars.map((cssVar) => (
              <ColorSwatch key={cssVar} cssVar={cssVar} theme={theme} />
            ))}
          </div>
        </section>

        <section className="cohesion-audit__section">
          <h2 className="cohesion-audit__section-title">Legacy hardcoded colors</h2>
          <p className="cohesion-audit__section-note">
            These literal values were present in `electron2` instead of using theme tokens.
          </p>
          <div className="cohesion-audit__grid">
            {hardcodedColors.map((entry) => (
              <div key={entry.label} className="cohesion-audit__swatch is-warning">
                <div className="cohesion-audit__swatch-chip" style={{ background: entry.value }} />
                <span className="cohesion-audit__warning-tag">hardcoded</span>
                <span className="cohesion-audit__swatch-name">{entry.label}</span>
                <span className="cohesion-audit__swatch-value">{entry.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="cohesion-audit__section">
          <h2 className="cohesion-audit__section-title">Radii</h2>
          <div className="cohesion-audit__grid">
            {radii.map(([name, value]) => (
              <div key={name} className="cohesion-audit__radius-box">
                <div className="cohesion-audit__radius-shape" style={{ borderRadius: value }} />
                <span className="cohesion-audit__radius-label">radius.{name}</span>
                <span className="cohesion-audit__radius-var">
                  var(--radius-{name}) - {value}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="cohesion-audit__section">
          <h2 className="cohesion-audit__section-title">Surface depth hierarchy</h2>
          <div className="cohesion-audit__surface-stack">
            {surfaceVars.map((cssVar) => (
              <div
                key={cssVar}
                className="cohesion-audit__surface"
                style={{ background: `var(${cssVar})` }}
              >
                <span className="cohesion-audit__surface-name">{cssVar}</span>
                <span className="cohesion-audit__surface-var">
                  spacing scale: {Object.keys(spacing).join(' - ')}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="cohesion-audit__section">
          <h2 className="cohesion-audit__section-title">Subsystem snapshots</h2>
          <p className="cohesion-audit__section-note">
            Representative cards with computed-style checks for drift.
          </p>

          <div className="cohesion-audit__snapshot">
            <h3 className="cohesion-audit__snapshot-title">Watchlist</h3>
            <div className="cohesion-audit__snapshot-frame">
              <div
                ref={watchlistRef}
                style={{
                  padding: 'var(--space-md, 1rem)',
                  borderRadius: 'var(--radius-card, 1rem)',
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border-subtle, rgba(255,255,255,0.1))',
                }}
              >
                <div
                  data-cohesion-title
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.1rem',
                    letterSpacing: '0.04em',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Sample Movie Title
                </div>
                <div
                  data-cohesion-body
                  style={{
                    fontFamily: 'var(--font-interface)',
                    fontSize: '0.875rem',
                    color: 'var(--color-text-secondary)',
                    marginTop: '0.4rem',
                  }}
                >
                  A representative watchlist card body line.
                </div>
              </div>
            </div>
            <SnapshotChecklist sampleRef={watchlistRef} theme={theme} />
          </div>

          <div className="cohesion-audit__snapshot">
            <h3 className="cohesion-audit__snapshot-title">Places</h3>
            <div className="cohesion-audit__snapshot-frame">
              <div
                ref={placesRef}
                style={{
                  padding: 'var(--space-md, 1rem)',
                  borderRadius: 'var(--radius-card, 1rem)',
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border-subtle, rgba(255,255,255,0.1))',
                }}
              >
                <div
                  data-cohesion-title
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.1rem',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Sample Place Name
                </div>
                <div
                  data-cohesion-body
                  style={{
                    fontFamily: 'var(--font-interface)',
                    fontSize: '0.875rem',
                    color: 'var(--color-text-secondary)',
                    marginTop: '0.4rem',
                  }}
                >
                  Address line - category tag
                </div>
              </div>
            </div>
            <SnapshotChecklist sampleRef={placesRef} theme={theme} />
          </div>

          <div className="cohesion-audit__snapshot">
            <h3 className="cohesion-audit__snapshot-title">Games</h3>
            <div className="cohesion-audit__snapshot-frame">
              <div
                ref={gamesRef}
                style={{
                  padding: 'var(--space-md, 1rem)',
                  borderRadius: 'var(--radius-md, 0.625rem)',
                  background: 'var(--gradient-primary)',
                  color: '#1a0d18',
                }}
              >
                <div
                  data-cohesion-title
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                  }}
                >
                  Spin Wheel
                </div>
                <div
                  data-cohesion-body
                  style={{
                    fontFamily: 'var(--font-interface)',
                    fontSize: '0.8125rem',
                    opacity: 0.85,
                    marginTop: '0.3rem',
                  }}
                >
                  Spin to pick a random movie
                </div>
              </div>
            </div>
            <SnapshotChecklist sampleRef={gamesRef} theme={theme} />
          </div>
        </section>
      </div>
    </div>
  );
};

export default CohesionAudit;
