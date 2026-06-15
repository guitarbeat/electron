import React, { useState } from 'react';

const USERS = [
  { name: 'Aaron', initials: 'A', color: '#c88d59' },
  { name: 'Electra', initials: 'E', color: '#8b5e34' },
];

const ACTIONS = [
  { id: 'messages', label: 'Messages', desc: 'Open the shared chat.', priority: false },
  { id: 'notes', label: 'Notes', desc: 'Browse shared notes.', priority: false },
  { id: 'quiz', label: 'Edit Quiz', desc: 'Edit the quiz before joining.', priority: true },
  { id: 'spin', label: 'Spin & Match', desc: 'Keep a subset, then spin.', priority: false },
];

export function Atmospheric() {
  const [activeTab, setActiveTab] = useState<'Movies' | 'Places'>('Movies');

  return (
    <div style={styles.root}>
      {/* Unified panel */}
      <div style={styles.panel}>
        
        {/* ── Section 1: Nav strip ── */}
        <div style={styles.navStripLayer}>
          <div style={styles.navStrip}>
            {/* Left: Profiles */}
            <div style={styles.navLeft}>
              <div style={styles.brandMark}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="#c88d59" strokeWidth="1.5" />
                  <circle cx="12" cy="12" r="3" fill="#c88d59" opacity="0.8" />
                  <path d="M12 3v18M3 12h18" stroke="#c88d59" strokeWidth="1" opacity="0.4" />
                </svg>
              </div>

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

            {/* Center: Context */}
            <div style={styles.navCenter}>
              <div style={styles.contextTag}>
                <span style={styles.contextIcon}>⟡</span>
                <span style={styles.contextLabel}>Movies</span>
              </div>
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

            {/* Right: Actions */}
            <div style={styles.navRight}>
              {ACTIONS.map(action => (
                <button
                  key={action.id}
                  style={{
                    ...(action.priority ? styles.actionBtnPriority : styles.actionBtn),
                    gridColumn: action.priority ? '1 / -1' : 'auto'
                  }}
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
        </div>

        {/* ── Divider ── */}
        <div style={styles.divider} />

        {/* ── Section 2: Hero ── */}
        <div style={styles.heroLayer}>
          <div style={styles.heroHalo} />
          <div style={styles.hero}>
            <div style={styles.heroCopy}>
              <p style={styles.heroEyebrow}>Movies workspace</p>
              <h1 style={styles.heroTitle}>Watchlist</h1>
            </div>
            <div style={styles.heroMeta}>
              <span style={styles.metaStatus}>Guest mode</span>
              <span style={styles.metaCue}>Use the composer to send a suggestion.</span>
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={styles.divider} />

        {/* ── Section 3: Queue surface ── */}
        <div style={styles.surfaceLayer}>
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
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    background: '#130d08',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    position: 'relative',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },

  /* ── Panel ── */
  panel: {
    width: '100%',
    maxWidth: '1100px',
    borderRadius: '1.5rem',
    border: '1px solid rgba(200, 141, 89, 0.2)',
    background: 'linear-gradient(135deg, rgba(34, 22, 14, 0.8) 0%, rgba(20, 13, 8, 0.9) 100%)',
    backdropFilter: 'blur(16px) saturate(120%)',
    WebkitBackdropFilter: 'blur(16px) saturate(120%)',
    boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },

  /* ── Divider ── */
  divider: {
    height: '8px',
    background: 'linear-gradient(180deg, rgba(200,141,89,0.0) 0%, rgba(200,141,89,0.07) 50%, rgba(200,141,89,0.0) 100%)',
    width: '100%',
  },

  /* ── Section 1: Nav strip ── */
  navStripLayer: {
    background: 'linear-gradient(180deg, rgba(255,247,228,0.07) 0%, transparent 100%)',
  },
  navStrip: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr 1.5fr',
    gap: '1.5rem',
    padding: '1.4rem',
    alignItems: 'start',
  },
  navLeft: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
  },
  brandMark: {
    width: '2.75rem',
    height: '2.75rem',
    borderRadius: '0.9rem',
    border: '1px solid rgba(200, 141, 89, 0.3)',
    background: 'rgba(29, 20, 14, 0.8)',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
    boxShadow: '0 0 20px rgba(200, 141, 89, 0.28), inset 0 1px 0 rgba(255,245,220,0.14)',
  },
  userPills: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  userPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.4rem 0.75rem',
    borderRadius: '0.75rem',
    border: '1px solid rgba(200, 141, 89, 0.15)',
    background: 'rgba(0, 0, 0, 0.2)',
  },
  avatar: {
    width: '1.9rem',
    height: '1.9rem',
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    border: '1px solid rgba(255, 245, 220, 0.2)',
  },
  avatarInitial: {
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#fff',
    fontFamily: 'sans-serif',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.1rem',
  },
  userName: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'rgba(255, 245, 220, 0.9)',
    fontFamily: 'sans-serif',
  },
  userPin: {
    fontSize: '0.65rem',
    color: 'rgba(200, 141, 89, 0.7)',
    letterSpacing: '0.05em',
    fontFamily: 'sans-serif',
  },

  navCenter: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    alignItems: 'flex-start',
  },
  contextTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  contextIcon: {
    color: '#c88d59',
    fontSize: '1rem',
  },
  contextLabel: {
    fontSize: '0.85rem',
    color: 'rgba(255, 245, 220, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontFamily: 'sans-serif',
    fontWeight: 500,
  },
  tabToggle: {
    display: 'flex',
    gap: '0.4rem',
    padding: '0.3rem',
    borderRadius: '0.85rem',
    border: '1px solid rgba(200, 141, 89, 0.2)',
    background: 'rgba(0, 0, 0, 0.2)',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.4rem 0.8rem',
    borderRadius: '0.6rem',
    border: 'none',
    background: 'transparent',
    color: 'rgba(255, 245, 220, 0.5)',
    fontSize: '0.8rem',
    cursor: 'pointer',
    fontFamily: 'sans-serif',
  },
  tabActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.4rem 0.8rem',
    borderRadius: '0.6rem',
    border: '1px solid rgba(200, 141, 89, 0.3)',
    background: 'rgba(200, 141, 89, 0.15)',
    color: 'rgba(255, 245, 220, 0.9)',
    fontSize: '0.8rem',
    cursor: 'pointer',
    fontFamily: 'sans-serif',
    boxShadow: '0 0 15px rgba(200, 141, 89, 0.15)',
  },
  tabIcon: {
    opacity: 0.8,
  },

  navRight: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.6rem',
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.6rem',
    padding: '0.75rem',
    borderRadius: '0.75rem',
    border: '1px solid rgba(200, 141, 89, 0.2)',
    background: 'rgba(0, 0, 0, 0.25)',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'sans-serif',
    boxShadow: '0 4px 20px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,247,220,0.12)',
  },
  actionBtnPriority: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.6rem',
    padding: '0.75rem',
    borderRadius: '0.75rem',
    border: '1px solid rgba(200, 141, 89, 0.5)',
    background: 'rgba(200, 141, 89, 0.15)',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'sans-serif',
    boxShadow: '0 4px 20px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,247,220,0.12)',
  },
  actionIcon: {
    fontSize: '1rem',
    color: '#c88d59',
    marginTop: '0.1rem',
  },
  actionCopy: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
  actionLabel: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'rgba(255, 245, 220, 0.9)',
  },
  actionDesc: {
    fontSize: '0.7rem',
    color: 'rgba(255, 245, 220, 0.5)',
    lineHeight: 1.3,
  },

  /* ── Section 2: Hero ── */
  heroLayer: {
    position: 'relative',
    background: 'transparent',
  },
  heroHalo: {
    position: 'absolute',
    top: '0',
    left: '1rem',
    width: '280px',
    height: '200px',
    borderRadius: '50%',
    background: 'radial-gradient(ellipse, rgba(200,141,89,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  hero: {
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: '1.6rem 1.4rem',
    gap: '1rem',
  },
  heroCopy: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
  heroEyebrow: {
    margin: 0,
    fontSize: '0.8rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: 'rgba(200, 141, 89, 0.8)',
    fontFamily: 'sans-serif',
  },
  heroTitle: {
    margin: 0,
    fontFamily: "'Papyrus', fantasy",
    fontSize: '3rem',
    fontWeight: 400,
    color: '#c88d59',
    letterSpacing: '0.02em',
  },
  heroMeta: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '0.6rem',
  },
  metaStatus: {
    padding: '0.5rem 1rem',
    borderRadius: '99px',
    background: 'rgba(44, 30, 19, 0.6)',
    border: '1px solid rgba(200, 141, 89, 0.3)',
    color: 'rgba(255, 245, 220, 0.9)',
    fontSize: '0.8rem',
    fontFamily: 'sans-serif',
    fontWeight: 500,
  },
  metaCue: {
    padding: '0.5rem 1rem',
    borderRadius: '99px',
    background: 'rgba(44, 30, 19, 0.6)',
    border: '1px solid rgba(200, 141, 89, 0.15)',
    color: 'rgba(255, 245, 220, 0.6)',
    fontSize: '0.75rem',
    fontFamily: 'sans-serif',
  },

  /* ── Section 3: Queue surface ── */
  surfaceLayer: {
    background: 'rgba(0, 0, 0, 0.18)',
  },
  surface: {
    padding: '1.2rem 1.4rem',
  },
  surfaceInner: {
    borderRadius: '1rem',
    border: '1px solid rgba(200, 141, 89, 0.15)',
    background: 'rgba(10, 6, 4, 0.6)',
    padding: '1.5rem',
    boxShadow: 'inset 0 2px 18px rgba(0,0,0,0.35)',
  },
  surfaceEyebrow: {
    margin: '0 0 0.5rem',
    fontSize: '0.75rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'rgba(200, 141, 89, 0.7)',
    fontFamily: 'sans-serif',
  },
  surfaceTitle: {
    margin: '0 0 0.5rem',
    fontFamily: "'Papyrus', fantasy",
    fontSize: '1.8rem',
    fontWeight: 400,
    color: '#c88d59',
  },
  surfaceDescription: {
    margin: '0 0 1.5rem',
    fontSize: '1rem',
    color: 'rgba(255, 245, 220, 0.6)',
    lineHeight: 1.5,
  },
  composerWrap: {
    position: 'relative',
  },
  composer: {
    width: '100%',
    padding: '0.9rem 1.2rem',
    borderRadius: '0.75rem',
    border: '1px solid rgba(200, 141, 89, 0.3)',
    background: 'rgba(0, 0, 0, 0.4)',
    color: 'rgba(255, 245, 220, 0.8)',
    fontSize: '1rem',
    fontFamily: 'sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
  },
};
