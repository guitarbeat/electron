import React, { useEffect, useMemo, useState } from 'react';
import { LOGO_LAB_QUERY_PARAM, LOGO_VARIANT_QUERY_PARAM } from '@/app/logoLab';
import Card from '@/ui/LegacyCard';
import ElectronMark from './ElectronMark.tsx';
import { DEFAULT_ELECTRON_FAVICON_PATH } from './LogoAssets';
import {
  DEFAULT_ELECTRON_MARK_VARIANT,
  ELECTRON_MARK_META,
  ELECTRON_MARK_VARIANTS,
  getElectronMarkDataUri,
  type ElectronMarkVariant,
} from "./ElectronMarkData";

const FAVICON_PREVIEW_SIZES = [16, 32, 48] as const;

const getDefaultAppHref = () => {
  if (typeof window === "undefined") {
    return "/";
  }

  const url = new URL(window.location.href);
  url.searchParams.delete(LOGO_LAB_QUERY_PARAM);
  url.searchParams.delete(LOGO_VARIANT_QUERY_PARAM);

  const nextSearch = url.searchParams.toString();
  return `${url.pathname}${nextSearch ? `?${nextSearch}` : ""}${url.hash}`;
};

const getManagedFaviconLink = () => {
  if (typeof document === "undefined") {
    return null;
  }

  let link = document.head.querySelector<HTMLLinkElement>(
    'link[data-managed-favicon="electron"]',
  );
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.setAttribute("data-managed-favicon", "electron");
    document.head.appendChild(link);
  }

  return link;
};

interface ElectronLogoLabProps {
  initialVariant?: ElectronMarkVariant;
}

const ElectronLogoLab: React.FC<ElectronLogoLabProps> = ({
  initialVariant = DEFAULT_ELECTRON_MARK_VARIANT,
}) => {
  const [activeVariant, setActiveVariant] =
    useState<ElectronMarkVariant>(initialVariant);
  const activeMeta = ELECTRON_MARK_META[activeVariant];
  const defaultAppHref = useMemo(() => getDefaultAppHref(), []);
  const previewQuery = `?${LOGO_LAB_QUERY_PARAM}=1&${LOGO_VARIANT_QUERY_PARAM}=${activeVariant}`;

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const previousTitle = document.title;
    document.title = `electron logo lab: ${activeMeta.name.toLowerCase()}`;

    return () => {
      document.title = previousTitle;
    };
  }, [activeMeta.name]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set(LOGO_LAB_QUERY_PARAM, "1");
    url.searchParams.set(LOGO_VARIANT_QUERY_PARAM, activeVariant);
    window.history.replaceState(
      {},
      "",
      `${url.pathname}?${url.searchParams.toString()}${url.hash}`,
    );
  }, [activeVariant]);

  useEffect(() => {
    const link = getManagedFaviconLink();
    if (!link) {
      return;
    }

    link.type = "image/svg+xml";
    link.href = getElectronMarkDataUri(activeVariant, {
      size: 64,
      title: `${activeMeta.name} favicon`,
    });
  }, [activeMeta.name, activeVariant]);

  useEffect(() => {
    return () => {
      const link = getManagedFaviconLink();
      if (link) {
        link.type = "image/png";
        link.href = DEFAULT_ELECTRON_FAVICON_PATH;
      }
    };
  }, []);

  return (
    <main
      className="electron-logo-lab"
      aria-labelledby="electron-logo-lab-title"
    >
      <section className="electron-logo-lab__intro">
        <div className="electron-logo-lab__copy">
          <p className="electron-logo-lab__eyebrow">Electron Logo Lab</p>
          <h1 id="electron-logo-lab-title" className="electron-logo-lab__title">
            Four first-pass marks for Aaron + Electra
          </h1>
          <p className="electron-logo-lab__lede">
            Each concept is tuned for the real icon footprint inside the
            floating action bubble and checked again at favicon sizes. The
            favicon can use the chrome AE logo, while the default app route
            keeps a cleaner utility bubble.
          </p>
        </div>

        <div className="electron-logo-lab__status">
          <span className="electron-logo-lab__status-badge">
            Live tab preview: {activeMeta.name}
          </span>
          <code className="electron-logo-lab__status-query">
            {previewQuery}
          </code>
          <a className="electron-logo-lab__status-link" href={defaultAppHref}>
            Open default app
          </a>
        </div>
      </section>

      <section
        className="electron-logo-lab__grid"
        aria-label="Electron logo concepts"
      >
        {ELECTRON_MARK_VARIANTS.map((variant) => {
          const meta = ELECTRON_MARK_META[variant];
          const isActive = variant === activeVariant;

          return (
            <Card
              key={variant}
              className={`electron-logo-lab__card${isActive ? " is-active" : ""}`}
              variant="interactive"
              glow={isActive}
              onClick={() => setActiveVariant(variant)}
              aria-pressed={isActive}
            >
              <div className="electron-logo-lab__card-top">
                <div>
                  <p className="electron-logo-lab__card-eyebrow">
                    {meta.eyebrow}
                  </p>
                  <h2 className="electron-logo-lab__card-title">{meta.name}</h2>
                </div>
                <div className="electron-logo-lab__card-badges">
                  {meta.recommended ? (
                    <span className="electron-logo-lab__badge electron-logo-lab__badge--recommended">
                      Recommended
                    </span>
                  ) : null}
                  {isActive ? (
                    <span className="electron-logo-lab__badge electron-logo-lab__badge--active">
                      Tab favicon
                    </span>
                  ) : null}
                </div>
              </div>

              <p className="electron-logo-lab__card-description">
                {meta.description}
              </p>

              <div className="electron-logo-lab__specimen">
                <div className="electron-logo-lab__specimen-shell">
                  <ElectronMark
                    variant={variant}
                    size={108}
                    title={`${meta.name} standalone mark`}
                    className="electron-logo-lab__specimen-mark"
                  />
                </div>
              </div>

              <div className="electron-logo-lab__contexts">
                <section
                  className="electron-logo-lab__context"
                  aria-label={`${meta.name} in action bubble`}
                >
                  <p className="electron-logo-lab__context-label">Bubble</p>
                  <div
                    className="electron-logo-lab__bubble-preview"
                    aria-hidden="true"
                  >
                    <ElectronMark variant={variant} size={32} />
                  </div>
                </section>

                <section
                  className="electron-logo-lab__context"
                  aria-label={`${meta.name} at favicon scales`}
                >
                  <p className="electron-logo-lab__context-label">Favicon</p>
                  <div className="electron-logo-lab__favicon-row">
                    {FAVICON_PREVIEW_SIZES.map((size) => (
                      <div
                        key={size}
                        className="electron-logo-lab__favicon-chip"
                      >
                        <ElectronMark variant={variant} size={size} />
                        <span className="electron-logo-lab__favicon-size">
                          {size}px
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section
                  className="electron-logo-lab__context"
                  aria-label={`${meta.name} silhouette checks`}
                >
                  <p className="electron-logo-lab__context-label">Silhouette</p>
                  <div className="electron-logo-lab__silhouette-row">
                    <div className="electron-logo-lab__silhouette-chip electron-logo-lab__silhouette-chip--dark">
                      <ElectronMark variant={variant} size={30} monochrome />
                    </div>
                    <div className="electron-logo-lab__silhouette-chip electron-logo-lab__silhouette-chip--light">
                      <ElectronMark
                        variant={variant}
                        size={30}
                        monochrome
                        palette={{ mono: "#111827" }}
                      />
                    </div>
                  </div>
                </section>
              </div>
            </Card>
          );
        })}
      </section>
    </main>
  );
};

export default ElectronLogoLab;
