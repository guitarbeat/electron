import { useState } from 'react';

const USERS = [
  { name: 'Aaron', initials: 'A' },
  { name: 'Electra', initials: 'E' },
];

const ACTIONS = [
  { id: 'messages', label: 'Messages', desc: 'Open the shared chat.', icon: '◎' },
  { id: 'notes', label: 'Notes', desc: 'Browse and add notes.', icon: '▣' },
  { id: 'quiz', label: 'Edit Quiz', desc: 'Edit the quiz.', priority: true, icon: '◉' },
  { id: 'spin', label: 'Spin & Match', desc: 'Spin that pool.', icon: '↺' },
];

export function Calibrated() {
  const [activeTab, setActiveTab] = useState<'Movies' | 'Places'>('Movies');

  return (
    <div style={styles.root}>
      <div style={styles.panel}>
        
        {/* ── Section 1: Nav strip ── */}
        <div style={styles.navStrip}>
          
          {/* Left: Profiles */}
          <div style={styles.navLeft}>
            <div style={styles.brandMark}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="rgba(255, 245, 220, 0.5)" strokeWidth="1.5" />
                <circle cx="12" cy="12" r="3" fill="rgba(255, 245, 220, 0.5)" opacity="0.8" />
                <path d="M12 3v18M3 12h18" stroke="rgba(255, 245, 220, 0.5)" strokeWidth="1" opacity="0.4" />
              </svg>
            </div>
            <div style={styles.userPills}>
              {USERS.map(u => (
                <div key={u.name} style={styles.userPill}>
                  <div style={styles.avatar}>
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
            <div style={styles.statusBlock}>
              <span style={styles.statusTitle}>Guest mode</span>
              <span style={styles.statusCopy}>Watchlist is ready for shared actions.</span>
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
                style={action.priority ? styles.actionBtnPriority : styles.actionBtn}
              >
                <span style={action.priority ? styles.actionIconPriority : styles.actionIcon}>
                  {action.icon}
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
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  panel: {
    width: '100%',
    maxWidth: '1200px',
    borderRadius: '1.5rem',
    border: '1px solid rgba(200, 141, 89, 0.2)',
    background: 'linear-gradient(160deg, rgba(29, 20, 14, 0.8) 0%, rgba(20, 13, 8, 0.9) 100%)',
    backdropFilter: 'blur(16px) saturate(120%)',
    WebkitBackdropFilter: 'blur(16px) saturate(120%)',
    boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
  },

  /* ── Nav Strip ── */
  navStrip: {
    display: 'grid',
    gridTemplateColumns: '0.8fr 1fr 2.5fr',
    gap: '1.5rem',
    padding: '1.1rem 1.25rem',
    alignItems: 'start',
  },
  
  /* Left Profile Column */
  navLeft: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
  },
  brandMark: {
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '0.75rem',
    border: '1px solid rgba(255, 245, 220, 0.1)',
    background: 'rgba(255, 245, 220, 0.03)',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
  },
  userPills: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    flex: 1,
  },
  userPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.3rem 0.5rem',
    borderRadius: '0.5rem',
    border: '1px solid rgba(255, 245, 220, 0.1)',
    background: 'rgba(255, 245, 220, 0.02)',
  },
  avatar: {
    width: '1.6rem',
    height: '1.6rem',
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
    border: '1px solid rgba(255, 245, 220, 0.1)',
    background: 'rgba(255, 245, 220, 0.05)',
  },
  avatarInitial: {
    fontSize: '0.65rem',
    fontWeight: 700,
    color: 'rgba(255, 245, 220, 0.9)',
    lineHeight: 1,
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'rgba(255, 245, 220, 0.9)',
    lineHeight: 1.1,
  },
  userPin: {
    fontSize: '0.55rem',
    color: 'rgba(255, 245, 220, 0.4)',
    letterSpacing: '0.05em',
    marginTop: '0.1rem',
  },

  /* Center Context Column */
  navCenter: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    alignItems: 'flex-start',
  },
  contextTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.2rem 0.6rem',
    borderRadius: '99px',
    border: '1px solid rgba(255, 245, 220, 0.1)',
    background: 'rgba(255, 245, 220, 0.03)',
  },
  contextIcon: {
    fontSize: '0.65rem',
    color: 'rgba(255, 245, 220, 0.6)',
  },
  contextLabel: {
    fontSize: '0.7rem',
    color: 'rgba(255, 245, 220, 0.8)',
    fontWeight: 500,
  },
  statusBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.1rem',
  },
  statusTitle: {
    fontSize: '0.8rem',
    color: 'rgba(255, 245, 220, 0.9)',
    fontWeight: 500,
  },
  statusCopy: {
    fontSize: '0.7rem',
    color: 'rgba(255, 245, 220, 0.5)',
  },
  tabToggle: {
    display: 'flex',
    gap: '0.25rem',
    padding: '0.25rem',
    borderRadius: '0.5rem',
    border: '1px solid rgba(255, 245, 220, 0.1)',
    background: 'rgba(255, 245, 220, 0.02)',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    padding: '0.3rem 0.75rem',
    borderRadius: '0.35rem',
    border: '1px solid transparent',
    background: 'transparent',
    color: 'rgba(255, 245, 220, 0.5)',
    fontSize: '0.7rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  tabActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    padding: '0.3rem 0.75rem',
    borderRadius: '0.35rem',
    border: '1px solid rgba(200, 141, 89, 0.3)',
    background: 'rgba(200, 141, 89, 0.1)',
    color: 'rgba(200, 141, 89, 0.9)',
    fontSize: '0.7rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  tabIcon: {
    fontSize: '0.6rem',
    opacity: 0.8,
  },

  /* Right Actions Column */
  navRight: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '0.5rem',
  },
  actionBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0.4rem',
    padding: '0.6rem 0.75rem',
    borderRadius: '0.5rem',
    border: '1px solid rgba(255, 245, 220, 0.1)',
    background: 'rgba(255, 245, 220, 0.02)',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
    minHeight: '3.2rem',
  },
  actionBtnPriority: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0.4rem',
    padding: '0.6rem 0.75rem',
    borderRadius: '0.5rem',
    border: '1px solid rgba(200, 141, 89, 0.4)',
    borderLeft: '2px solid rgba(200, 141, 89, 0.8)',
    background: 'rgba(200, 141, 89, 0.1)',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
    minHeight: '3.2rem',
  },
  actionIcon: {
    fontSize: '0.85rem',
    color: 'rgba(255, 245, 220, 0.6)',
  },
  actionIconPriority: {
    fontSize: '0.85rem',
    color: 'rgba(200, 141, 89, 0.9)',
  },
  actionCopy: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.1rem',
  },
  actionLabel: {
    display: 'block',
    fontSize: '0.7rem',
    fontWeight: 600,
    color: 'rgba(255, 245, 220, 0.9)',
    letterSpacing: '0.02em',
  },
  actionDesc: {
    display: 'block',
    fontSize: '0.6rem',
    color: 'rgba(255, 245, 220, 0.45)',
    lineHeight: 1.3,
  },

  /* ── Divider ── */
  divider: {
    height: '3px',
    background: 'linear-gradient(90deg, transparent, rgba(255,245,220,0.08) 20%, rgba(255,245,220,0.08) 80%, transparent)',
    margin: '0',
  },

  /* ── Hero ── */
  hero: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: '1.1rem 1.25rem',
    gap: '1rem',
  },
  heroCopy: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  heroEyebrow: {
    margin: 0,
    fontSize: '0.65rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: 'rgba(255, 245, 220, 0.5)',
    fontWeight: 500,
  },
  heroTitle: {
    margin: 0,
    fontFamily: "'Papyrus', fantasy",
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    fontWeight: 400,
    lineHeight: 1,
    color: 'rgba(255, 245, 220, 0.95)',
    textShadow: '0 0 20px rgba(200, 141, 89, 0.3)',
    letterSpacing: '0.01em',
  },
  heroDescription: {
    margin: 0,
    fontSize: '0.85rem',
    color: 'rgba(255, 245, 220, 0.6)',
    lineHeight: 1.5,
    maxWidth: '40ch',
  },
  heroMeta: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '0.2rem',
    flexShrink: 0,
    textAlign: 'right',
  },
  metaStatus: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'rgba(255, 245, 220, 0.9)',
  },
  metaCue: {
    fontSize: '0.75rem',
    color: 'rgba(255, 245, 220, 0.5)',
  },

  /* ── Surface ── */
  surface: {
    padding: '1.1rem 1.25rem',
  },
  surfaceInner: {
    borderRadius: '1rem',
    border: '1px solid rgba(255, 245, 220, 0.1)',
    background: 'rgba(20, 13, 8, 0.4)',
    padding: '1.1rem 1.25rem',
  },
  surfaceEyebrow: {
    margin: '0 0 0.3rem',
    fontSize: '0.65rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: 'rgba(255, 245, 220, 0.4)',
    fontWeight: 500,
  },
  surfaceTitle: {
    margin: '0 0 0.4rem',
    fontFamily: "'Papyrus', fantasy",
    fontSize: '1.3rem',
    fontWeight: 400,
    color: 'rgba(255, 245, 220, 0.9)',
  },
  surfaceDescription: {
    margin: '0 0 1rem',
    fontSize: '0.8rem',
    color: 'rgba(255, 245, 220, 0.5)',
    lineHeight: 1.5,
    maxWidth: '50ch',
  },
  composerWrap: {
    position: 'relative',
  },
  composer: {
    width: '100%',
    padding: '0.7rem 1rem',
    borderRadius: '0.5rem',
    border: '1px solid rgba(255, 245, 220, 0.1)',
    background: 'rgba(255, 245, 220, 0.03)',
    color: 'rgba(255, 245, 220, 0.8)',
    fontSize: '0.85rem',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  },
};
