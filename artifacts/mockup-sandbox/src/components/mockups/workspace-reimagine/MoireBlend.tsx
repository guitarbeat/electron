import { useState } from 'react';

const MOIRE_BLUE = '#2624E9';
const MOIRE_GOLD = '#FFD439';

const USERS = [
  { name: 'Aaron', initials: 'A', color: '#3b3aff' },
  { name: 'Electra', initials: 'E', color: '#c77dff' },
];

const ACTIONS = [
  { id: 'messages', label: 'Messages', desc: 'Open the shared chat.' },
  { id: 'notes', label: 'Notes', desc: 'Browse and add shared movie notes.' },
  { id: 'quiz', label: 'Edit Quiz', desc: 'Edit the quiz before a profile joins.', priority: true },
  { id: 'spin', label: 'Spin & Match', desc: 'Keep a subset, then spin that pool.' },
];

export function MoireBlend() {
  const [activeTab, setActiveTab] = useState<'Movies' | 'Places'>('Movies');

  return (
    <div style={styles.root}>
      {/* Animated Moire background */}
      <div style={styles.moireLayer} aria-hidden="true">
        <div style={styles.dotGrid} />
        <div style={styles.ripple1} />
        <div style={styles.ripple2} />
        <div style={styles.ripple3} />
        <div style={styles.vignette} />
      </div>

      {/* Unified panel */}
      <div style={styles.panel}>

        {/* ── Section 1: Nav strip ── */}
        <div style={styles.navStrip}>

          {/* Brand mark */}
          <div style={styles.navLeft}>
            <div style={styles.brandMark}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke={MOIRE_GOLD} strokeWidth="1.5" />
                <circle cx="12" cy="12" r="3" fill={MOIRE_GOLD} opacity="0.8" />
                <path d="M12 3v18M3 12h18" stroke={MOIRE_GOLD} strokeWidth="1" opacity="0.4" />
              </svg>
            </div>

            {/* User pills */}
            <div style={styles.userPills}>
              {USERS.map(u => (
                <div key={u.name} style={styles.userPill}>
                  <div style={{ ...styles.avatar, background: u.color }}>
                    <span style={styles.avatarInitial}>{u.initials}</span>
                  </div>
                  <div style={styles.userInfo}>
                    <span style={styles.userName}>{u.name}</span>
                    <span style={styles.userPin}>PIN LOCKED</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Center: context */}
          <div style={styles.navCenter}>
            <div style={styles.contextTag}>
              <span style={styles.contextIcon}>⟡</span>
              <span style={styles.contextLabel}>Movies</span>
            </div>
            <div style={styles.statusBlock}>
              <span style={styles.statusTitle}>Guest mode</span>
              <span style={styles.statusCopy}>Watchlist is ready for shared actions.</span>
            </div>
            {/* Tab toggle */}
            <div style={styles.tabToggle}>
              {(['Movies', 'Places'] as const).map(tab => (
                <button
                  key={tab}
                  style={activeTab === tab ? styles.tabActive : styles.tab}
                  onClick={() => setActiveTab(tab)}
                >
                  <span style={styles.tabIcon}>{tab === 'Movies' ? '⬡' : '◈'}</span>
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Right: actions */}
          <div style={styles.navRight}>
            {ACTIONS.map(action => (
              <button
                key={action.id}
                style={action.priority ? styles.actionBtnPriority : styles.actionBtn}
              >
                <span style={styles.actionIcon}>
                  {action.id === 'messages' && '◎'}
                  {action.id === 'notes' && '▣'}
                  {action.id === 'quiz' && '◉'}
                  {action.id === 'spin' && '↺'}
                </span>
                <span style={styles.actionCopy}>
                  <span style={styles.actionLabel}>{action.label}</span>
                  <span style={styles.actionDesc}>{action.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={styles.divider} />

        {/* ── Section 2: Hero ── */}
        <div style={styles.hero}>
          <div style={styles.heroCopy}>
            <p style={styles.heroEyebrow}>Movies workspace</p>
            <h1 style={styles.heroTitle}>Watchlist</h1>
            <p style={styles.heroDescription}>
              Guest mode can still add titles to the shared watchlist and send suggestions.
            </p>
          </div>
          <div style={styles.heroMeta}>
            <span style={styles.metaStatus}>Guest mode</span>
            <span style={styles.metaCue}>Use the composer to send a suggestion.</span>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={styles.divider} />

        {/* ── Section 3: Queue surface ── */}
        <div style={styles.surface}>
          <div style={styles.surfaceInner}>
            <p style={styles.surfaceEyebrow}>Shared Queue</p>
            <h2 style={styles.surfaceTitle}>Send a title to the queue</h2>
            <p style={styles.surfaceDescription}>
              Not signed in? Guest can still send titles to Suggestions for Aaron or Electra to approve.
            </p>
            <div style={styles.composerWrap}>
              <input
                style={styles.composer}
                placeholder="Add a movie or show title"
                readOnly
              />
              <div style={styles.composerGlow} />
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes drift1 {
          0% { transform: translate(0, 0) scale(1); opacity: 0.55; }
          33% { transform: translate(-18px, 12px) scale(1.04); opacity: 0.65; }
          66% { transform: translate(10px, -8px) scale(0.97); opacity: 0.5; }
          100% { transform: translate(0, 0) scale(1); opacity: 0.55; }
        }
        @keyframes drift2 {
          0% { transform: translate(0, 0) scale(1); opacity: 0.45; }
          40% { transform: translate(14px, -16px) scale(1.06); opacity: 0.55; }
          70% { transform: translate(-8px, 10px) scale(0.95); opacity: 0.4; }
          100% { transform: translate(0, 0) scale(1); opacity: 0.45; }
        }
        @keyframes drift3 {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 0.35; }
          50% { transform: translate(-12px, -10px) scale(1.08) rotate(2deg); opacity: 0.5; }
          100% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 0.35; }
        }
        @keyframes gridPulse {
          0%, 100% { opacity: 0.12; }
          50% { opacity: 0.22; }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.6; box-shadow: 0 0 20px rgba(255, 212, 57, 0.25), inset 0 0 12px rgba(255, 212, 57, 0.06); }
          50% { opacity: 1; box-shadow: 0 0 32px rgba(255, 212, 57, 0.45), inset 0 0 18px rgba(255, 212, 57, 0.12); }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    background: '#06040f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Cormorant Garamond', Georgia, 'Times New Roman', serif",
  },

  /* ── Moire background ── */
  moireLayer: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
  },
  dotGrid: {
    position: 'absolute',
    inset: '-10%',
    backgroundImage: 'radial-gradient(circle, rgba(101, 103, 239, 0.55) 1px, transparent 1px)',
    backgroundSize: '24px 24px',
    animation: 'gridPulse 4s ease-in-out infinite',
  },
  ripple1: {
    position: 'absolute',
    inset: 0,
    background: `radial-gradient(ellipse 70% 55% at 28% 38%, ${MOIRE_BLUE}44 0%, transparent 65%)`,
    animation: 'drift1 9s ease-in-out infinite',
  },
  ripple2: {
    position: 'absolute',
    inset: 0,
    background: `radial-gradient(ellipse 60% 50% at 72% 62%, ${MOIRE_GOLD}33 0%, transparent 60%)`,
    animation: 'drift2 12s ease-in-out infinite',
  },
  ripple3: {
    position: 'absolute',
    inset: 0,
    background: `radial-gradient(ellipse 80% 40% at 50% 80%, rgba(38, 36, 233, 0.18) 0%, transparent 70%)`,
    animation: 'drift3 15s ease-in-out infinite',
  },
  vignette: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 40%, #06040f 100%)',
  },

  /* ── Panel ── */
  panel: {
    position: 'relative',
    width: '100%',
    maxWidth: '1100px',
    borderRadius: '1.5rem',
    border: '1px solid rgba(255, 212, 57, 0.18)',
    background: 'rgba(6, 4, 22, 0.72)',
    backdropFilter: 'blur(20px) saturate(140%)',
    WebkitBackdropFilter: 'blur(20px) saturate(140%)',
    boxShadow: `
      0 0 0 1px rgba(101, 103, 239, 0.12),
      0 24px 64px rgba(0, 0, 0, 0.55),
      0 0 80px rgba(38, 36, 233, 0.12),
      inset 0 1px 0 rgba(255, 212, 57, 0.1)
    `,
    overflow: 'hidden',
  },

  /* ── Nav strip ── */
  navStrip: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr 1.1fr',
    gap: '1rem',
    padding: '1rem 1.2rem',
    alignItems: 'start',
  },
  navLeft: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
  },
  brandMark: {
    width: '2.75rem',
    height: '2.75rem',
    borderRadius: '0.9rem',
    border: '1px solid rgba(255, 212, 57, 0.22)',
    background: 'rgba(38, 36, 233, 0.18)',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
    boxShadow: '0 0 16px rgba(38, 36, 233, 0.25), inset 0 1px 0 rgba(255, 212, 57, 0.12)',
  },
  userPills: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.45rem',
    flex: 1,
  },
  userPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.55rem',
    padding: '0.35rem 0.65rem',
    borderRadius: '0.75rem',
    border: '1px solid rgba(101, 103, 239, 0.2)',
    background: 'rgba(38, 36, 233, 0.1)',
    cursor: 'pointer',
  },
  avatar: {
    width: '1.9rem',
    height: '1.9rem',
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
    border: '1px solid rgba(255, 212, 57, 0.3)',
    boxShadow: '0 0 8px rgba(255, 212, 57, 0.2)',
  },
  avatarInitial: {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: '#fff',
    lineHeight: 1,
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.05rem',
    minWidth: 0,
  },
  userName: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'rgba(220, 225, 255, 0.9)',
    lineHeight: 1.2,
    letterSpacing: '0.02em',
  },
  userPin: {
    fontSize: '0.6rem',
    color: 'rgba(255, 212, 57, 0.5)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },

  /* Center nav */
  navCenter: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.55rem',
    alignItems: 'flex-start',
  },
  contextTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.2rem 0.6rem',
    borderRadius: '99px',
    border: '1px solid rgba(255, 212, 57, 0.2)',
    background: 'rgba(255, 212, 57, 0.06)',
  },
  contextIcon: {
    fontSize: '0.7rem',
    color: MOIRE_GOLD,
  },
  contextLabel: {
    fontSize: '0.72rem',
    color: 'rgba(255, 212, 57, 0.8)',
    letterSpacing: '0.05em',
    fontWeight: 500,
  },
  statusBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.08rem',
  },
  statusTitle: {
    fontSize: '0.82rem',
    color: 'rgba(200, 210, 255, 0.75)',
    fontWeight: 500,
  },
  statusCopy: {
    fontSize: '0.72rem',
    color: 'rgba(200, 210, 255, 0.45)',
    lineHeight: 1.4,
  },
  tabToggle: {
    display: 'flex',
    gap: '0.3rem',
    padding: '0.25rem',
    borderRadius: '0.75rem',
    border: '1px solid rgba(101, 103, 239, 0.18)',
    background: 'rgba(38, 36, 233, 0.08)',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    padding: '0.3rem 0.75rem',
    borderRadius: '0.5rem',
    border: 'none',
    background: 'transparent',
    color: 'rgba(200, 210, 255, 0.5)',
    fontSize: '0.75rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '0.02em',
  },
  tabActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    padding: '0.3rem 0.75rem',
    borderRadius: '0.5rem',
    border: '1px solid rgba(255, 212, 57, 0.22)',
    background: 'rgba(255, 212, 57, 0.1)',
    color: 'rgba(255, 212, 57, 0.9)',
    fontSize: '0.75rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '0.02em',
    boxShadow: '0 0 12px rgba(255, 212, 57, 0.15)',
  },
  tabIcon: {
    fontSize: '0.65rem',
    opacity: 0.7,
  },

  /* Right actions */
  navRight: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.45rem',
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.45rem 0.75rem',
    borderRadius: '0.75rem',
    border: '1px solid rgba(101, 103, 239, 0.18)',
    background: 'rgba(38, 36, 233, 0.08)',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
    transition: 'all 0.18s ease',
  },
  actionBtnPriority: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.45rem 0.75rem',
    borderRadius: '0.75rem',
    border: '1px solid rgba(255, 212, 57, 0.25)',
    background: 'rgba(255, 212, 57, 0.07)',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
    boxShadow: '0 0 14px rgba(255, 212, 57, 0.1)',
  },
  actionIcon: {
    fontSize: '0.9rem',
    color: 'rgba(255, 212, 57, 0.7)',
    flexShrink: 0,
    width: '1rem',
    textAlign: 'center',
  },
  actionCopy: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.05rem',
    minWidth: 0,
  },
  actionLabel: {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'rgba(220, 225, 255, 0.85)',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  actionDesc: {
    display: 'block',
    fontSize: '0.65rem',
    color: 'rgba(180, 190, 255, 0.45)',
    lineHeight: 1.3,
  },

  /* ── Divider ── */
  divider: {
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(255, 212, 57, 0.12) 20%, rgba(101, 103, 239, 0.15) 60%, transparent)',
    margin: '0',
  },

  /* ── Hero ── */
  hero: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: '1.8rem 1.4rem 1.5rem',
    gap: '1rem',
    position: 'relative',
    overflow: 'hidden',
  },
  heroCopy: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.45rem',
  },
  heroEyebrow: {
    margin: 0,
    fontSize: '0.68rem',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'rgba(255, 212, 57, 0.55)',
    fontWeight: 500,
  },
  heroTitle: {
    margin: 0,
    fontFamily: 'Papyrus, fantasy',
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    fontWeight: 400,
    lineHeight: 1.05,
    color: 'rgba(255, 212, 57, 0.92)',
    textShadow: `0 0 40px rgba(255, 212, 57, 0.35), 0 0 80px rgba(38, 36, 233, 0.2)`,
    letterSpacing: '0.02em',
  },
  heroDescription: {
    margin: 0,
    fontSize: '0.85rem',
    color: 'rgba(180, 190, 255, 0.6)',
    lineHeight: 1.55,
    maxWidth: '34ch',
  },
  heroMeta: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '0.35rem',
    flexShrink: 0,
  },
  metaStatus: {
    padding: '0.3rem 0.85rem',
    borderRadius: '99px',
    border: '1px solid rgba(101, 103, 239, 0.25)',
    background: 'rgba(38, 36, 233, 0.12)',
    fontSize: '0.75rem',
    color: 'rgba(200, 210, 255, 0.75)',
    boxShadow: '0 0 12px rgba(38, 36, 233, 0.15)',
  },
  metaCue: {
    fontSize: '0.7rem',
    color: 'rgba(180, 190, 255, 0.4)',
    fontStyle: 'italic',
  },

  /* ── Surface ── */
  surface: {
    padding: '1.2rem 1.4rem 1.5rem',
  },
  surfaceInner: {
    borderRadius: '1rem',
    border: '1px solid rgba(255, 212, 57, 0.12)',
    background: 'rgba(6, 4, 22, 0.55)',
    padding: '1.1rem 1.2rem 1.3rem',
    boxShadow: 'inset 0 1px 0 rgba(255, 212, 57, 0.06)',
    position: 'relative',
  },
  surfaceEyebrow: {
    margin: '0 0 0.3rem',
    fontSize: '0.62rem',
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: 'rgba(255, 212, 57, 0.45)',
    fontWeight: 500,
  },
  surfaceTitle: {
    margin: '0 0 0.45rem',
    fontFamily: 'Papyrus, fantasy',
    fontSize: '1.45rem',
    fontWeight: 400,
    color: 'rgba(255, 212, 57, 0.85)',
    textShadow: '0 0 24px rgba(255, 212, 57, 0.25)',
    letterSpacing: '0.01em',
  },
  surfaceDescription: {
    margin: '0 0 1rem',
    fontSize: '0.8rem',
    color: 'rgba(180, 190, 255, 0.5)',
    lineHeight: 1.55,
    maxWidth: '52ch',
  },
  composerWrap: {
    position: 'relative',
  },
  composer: {
    width: '100%',
    padding: '0.7rem 1rem',
    borderRadius: '0.7rem',
    border: '1px solid rgba(101, 103, 239, 0.25)',
    background: 'rgba(38, 36, 233, 0.07)',
    color: 'rgba(200, 210, 255, 0.6)',
    fontSize: '0.85rem',
    fontFamily: 'inherit',
    outline: 'none',
    boxShadow: '0 0 18px rgba(38, 36, 233, 0.1)',
    boxSizing: 'border-box',
  },
  composerGlow: {
    position: 'absolute',
    bottom: '-2px',
    left: '10%',
    right: '10%',
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(255, 212, 57, 0.4), transparent)',
    boxShadow: '0 0 8px rgba(255, 212, 57, 0.3)',
  },
};
