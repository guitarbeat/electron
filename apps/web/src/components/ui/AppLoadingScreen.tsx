import React, { useState, useEffect } from "react";
import { Film, Sparkles, Clapperboard, Gamepad2, Layers } from "lucide-react";

export type LoaderDesign = "arcade" | "marquee" | "capsule" | "reel";

const STORAGE_KEY = "electron_loading_design";

export interface AppLoadingScreenProps {
  isExiting: boolean;
  onSelectDesign?: (design: LoaderDesign) => void;
}

export const AppLoadingScreen: React.FC<AppLoadingScreenProps> = ({
  isExiting,
  onSelectDesign,
}) => {
  const [design, setDesign] = useState<LoaderDesign>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY) as LoaderDesign | null;
        if (stored && ["arcade", "marquee", "capsule", "reel"].includes(stored)) {
          return stored;
        }
      } catch {
        // Ignore localStorage restrictions
      }
    }
    return "arcade";
  });

  const [showPicker, setShowPicker] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + Math.floor(Math.random() * 15) + 5 : 95));
    }, 180);
    return () => clearInterval(timer);
  }, []);

  const handleSelectDesign = (newDesign: LoaderDesign) => {
    setDesign(newDesign);
    try {
      localStorage.setItem(STORAGE_KEY, newDesign);
    } catch {
      // Ignore
    }
    onSelectDesign?.(newDesign);
  };

  const renderContent = () => {
    switch (design) {
      case "marquee":
        return (
          <div className="y2k-arcade-loader__card marquee-theme">
            <div className="marquee-bulb-row top-row" aria-hidden="true">
              {Array.from({ length: 12 }, (_, i) => (
                <span key={i} className="marquee-bulb" style={{ animationDelay: `${i * 120}ms` }} />
              ))}
            </div>

            <div className="y2k-arcade-loader__header marquee-header">
              <span className="marquee-badge">
                <Film size={13} className="inline mr-1" /> NOW SHOWING
              </span>
              <span className="marquee-hall">THEATER 2P</span>
            </div>

            <div className="marquee-center">
              <h2 className="marquee-title">AARON & ELECTRA</h2>
              <p className="marquee-subtitle">CINEMA REEL ARCHIVE</p>
            </div>

            <div className="marquee-progress-wrap">
              <div
                className="marquee-progress-fill"
                style={{ width: isExiting ? "100%" : `${progress}%` }}
              />
            </div>

            <div className="y2k-arcade-loader__footer marquee-footer">
              <span>{isExiting ? "FEATURE STARTING" : "LOADING REELS..."}</span>
              <span>{isExiting ? "100%" : `${progress}%`}</span>
            </div>

            <div className="marquee-bulb-row bottom-row" aria-hidden="true">
              {Array.from({ length: 12 }, (_, i) => (
                <span key={i} className="marquee-bulb" style={{ animationDelay: `${(12 - i) * 120}ms` }} />
              ))}
            </div>
          </div>
        );

      case "capsule":
        return (
          <div className="y2k-arcade-loader__card capsule-theme">
            <div className="capsule-inner">
              <div className="capsule-avatars">
                <div className="capsule-orb aaron-orb">
                  <img
                    src="/aaron-avatar.png"
                    alt="Aaron"
                    className="capsule-img"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                  <span className="capsule-dot" />
                </div>
                <span className="capsule-link-pulse" />
                <div className="capsule-orb electra-orb">
                  <img
                    src="/electra-button.png"
                    alt="Electra"
                    className="capsule-img"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                  <span className="capsule-dot" />
                </div>
              </div>

              <div className="capsule-text">
                <div className="capsule-headline">
                  <Sparkles size={14} className="text-cyan-400" />
                  <span>Connecting Movie Library</span>
                </div>
                <div className="capsule-subline">
                  {isExiting ? "Collection Synced" : "Indexing Aaron & Electra Picks..."}
                </div>
              </div>

              <div className="capsule-bar-track">
                <div
                  className="capsule-bar-fill"
                  style={{ width: isExiting ? "100%" : `${progress}%` }}
                />
              </div>
            </div>
          </div>
        );

      case "reel":
        return (
          <div className="y2k-arcade-loader__card reel-theme">
            <div className="reel-film-spool" aria-hidden="true">
              <div className="reel-spool-center">
                <Clapperboard size={24} className="reel-icon" />
              </div>
            </div>

            <div className="reel-countdown-badge">
              <span>{isExiting ? "00" : "35MM"}</span>
            </div>

            <div className="reel-info">
              <span className="reel-track-name">REEL 1: COLLECTION SYNC</span>
              <span className="reel-status-text">
                {isExiting ? "PLAYBACK ENGAGED" : "SYNCHRONIZING FRAMES..."}
              </span>
            </div>

            <div className="y2k-arcade-loader__bar reel-perforations" aria-hidden="true">
              {Array.from({ length: 8 }, (_, idx) => (
                <span
                  key={idx}
                  className="y2k-arcade-loader__segment reel-segment"
                  style={{ "--seg-idx": idx } as React.CSSProperties}
                />
              ))}
            </div>
          </div>
        );

      case "arcade":
      default:
        return (
          <div className="y2k-arcade-loader__card">
            <div className="y2k-arcade-loader__header">
              <span>CINEMA ARCADE</span>
              <span className="y2k-arcade-loader__tag">2P CO-OP</span>
            </div>

            <div className="y2k-arcade-loader__players">
              <div className="y2k-arcade-loader__player y2k-arcade-loader__player--aaron">
                <div className="y2k-arcade-loader__avatar-ring">
                  <img
                    src="/aaron-avatar.png"
                    alt="Aaron"
                    className="y2k-arcade-loader__avatar-img"
                    draggable={false}
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.opacity = "0.2";
                    }}
                  />
                </div>
                <span className="y2k-arcade-loader__player-name">Aaron</span>
              </div>

              <span className="y2k-arcade-loader__versus" aria-hidden="true">
                +
              </span>

              <div className="y2k-arcade-loader__player y2k-arcade-loader__player--electra">
                <div className="y2k-arcade-loader__avatar-ring">
                  <img
                    src="/electra-button.png"
                    alt="Electra"
                    className="y2k-arcade-loader__avatar-img"
                    draggable={false}
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.opacity = "0.2";
                    }}
                  />
                </div>
                <span className="y2k-arcade-loader__player-name">Electra</span>
              </div>
            </div>

            <div className="y2k-arcade-loader__footer">
              <div className="y2k-arcade-loader__bar" aria-hidden="true">
                {Array.from({ length: 8 }, (_, idx) => (
                  <span
                    key={idx}
                    className="y2k-arcade-loader__segment"
                    style={{ "--seg-idx": idx } as React.CSSProperties}
                  />
                ))}
              </div>
              <div className="y2k-arcade-loader__status">
                <span>
                  {isExiting ? "READY TO WATCH" : "LOADING COLLECTION"}
                </span>
                <span>{isExiting ? "100%" : `${progress}%`}</span>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      className={`y2k-arcade-loader${isExiting ? " is-exiting" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Loading movie collection"
    >
      <div className="y2k-arcade-loader__container">
        {renderContent()}

        {/* UI/UX Design Switcher Drawer */}
        <div className="loader-design-picker-trigger-wrap">
          <button
            type="button"
            className="loader-design-toggle-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowPicker((prev) => !prev);
            }}
            aria-label="Switch loading screen design"
            title="Preview different loading screen designs"
          >
            <Layers size={13} />
            <span>Theme: {design}</span>
          </button>

          {showPicker ? (
            <div className="loader-design-picker" role="dialog" aria-label="Loading design options">
              <div className="loader-design-picker__title">Choose Loading Design</div>
              <div className="loader-design-picker__options">
                {(
                  [
                    { id: "arcade", label: "2P Arcade", icon: <Gamepad2 size={13} /> },
                    { id: "marquee", label: "Marquee", icon: <Film size={13} /> },
                    { id: "capsule", label: "Capsule", icon: <Sparkles size={13} /> },
                    { id: "reel", label: "35mm Reel", icon: <Clapperboard size={13} /> },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`loader-design-chip${design === opt.id ? " is-active" : ""}`}
                    onClick={() => {
                      handleSelectDesign(opt.id);
                      setShowPicker(false);
                    }}
                  >
                    {opt.icon}
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default AppLoadingScreen;
