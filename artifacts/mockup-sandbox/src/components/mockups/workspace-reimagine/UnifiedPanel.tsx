import React, { useState } from 'react';
import { MessageCircle, StickyNote, Brain, RefreshCw, Film, MapPin } from 'lucide-react';

export default function UnifiedPanel() {
  const [activeTab, setActiveTab] = useState<'movies' | 'places'>('movies');

  const isMovies = activeTab === 'movies';

  const accent = isMovies ? '#c88d59' : '#ff8f6b';
  const accentGlow = isMovies ? 'rgba(200,141,89,0.18)' : 'rgba(255,143,107,0.18)';
  const secondary = isMovies ? '#8e9f82' : '#ffd8bf';

  return (
    <div
      className="min-h-screen w-full flex items-start justify-center p-6 md:p-10"
      style={{
        background: isMovies
          ? 'linear-gradient(190deg, #1a0f18 0%, #130910 50%, #0d0609 100%)'
          : 'linear-gradient(190deg, #1c100d 0%, #130a08 50%, #0b0605 100%)',
        fontFamily: '"Cormorant Garamond", "Palatino Linotype", Georgia, serif',
        transition: 'background 0.4s ease',
      }}
    >
      {/* Single unified card */}
      <div
        className="w-full max-w-4xl rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(175deg, rgba(90,58,35,0.72) 0%, rgba(40,26,15,0.92) 100%)',
          border: `1px solid ${isMovies ? 'rgba(200,141,89,0.22)' : 'rgba(255,143,107,0.22)'}`,
          boxShadow: `0 24px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,245,220,0.08), 0 0 0 1px rgba(0,0,0,0.3)`,
          backdropFilter: 'blur(16px)',
          transition: 'border-color 0.4s ease',
        }}
      >
        {/* ─── Section 1: Nav Strip ─────────────────────────────────── */}
        <div
          className="px-5 py-4 flex items-center justify-between gap-4"
          style={{
            borderBottom: `1px solid rgba(200,141,89,0.12)`,
          }}
        >
          {/* Left: logo + profiles */}
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
              style={{
                background: `linear-gradient(135deg, ${accent} 0%, rgba(200,141,89,0.5) 100%)`,
                color: '#fff8ee',
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: '0.9rem',
                letterSpacing: '0.02em',
              }}
            >
              E
            </div>
            <div className="flex -space-x-2">
              {['A', 'E'].map((letter, i) => (
                <div
                  key={letter}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2"
                  style={{
                    background: i === 0 ? 'rgba(113,81,52,0.9)' : 'rgba(80,100,74,0.9)',
                    borderColor: 'rgba(200,141,89,0.3)',
                    color: '#f7efdf',
                    fontFamily: 'sans-serif',
                    zIndex: i === 0 ? 1 : 0,
                  }}
                >
                  {letter}
                </div>
              ))}
            </div>
          </div>

          {/* Center: tab toggle */}
          <div
            className="flex items-center rounded-full p-1 gap-1 flex-shrink-0"
            style={{
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(200,141,89,0.15)',
            }}
          >
            {[
              { id: 'movies', label: 'Movies', icon: <Film size={13} /> },
              { id: 'places', label: 'Places', icon: <MapPin size={13} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'movies' | 'places')}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: activeTab === tab.id ? accent : 'transparent',
                  color: activeTab === tab.id ? '#fff8ee' : 'rgba(247,239,223,0.45)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  fontFamily: '"Cormorant Garamond", serif',
                  boxShadow: activeTab === tab.id ? `0 2px 12px ${accentGlow}` : 'none',
                  transition: 'all 0.2s ease',
                  fontSize: '0.72rem',
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right: action buttons */}
          <div className="flex items-center gap-2">
            {[
              { icon: <MessageCircle size={14} />, label: 'Messages' },
              { icon: <StickyNote size={14} />, label: 'Notes' },
              { icon: <Brain size={14} />, label: 'Quiz' },
              { icon: <RefreshCw size={14} />, label: 'Spin' },
            ].map((action) => (
              <button
                key={action.label}
                title={action.label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
                style={{
                  background: 'rgba(200,141,89,0.08)',
                  border: '1px solid rgba(200,141,89,0.15)',
                  color: 'rgba(247,239,223,0.6)',
                  fontFamily: '"Cormorant Garamond", serif',
                  letterSpacing: '0.04em',
                  fontSize: '0.7rem',
                }}
              >
                {action.icon}
                <span className="hidden md:inline">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ─── Section 2: Workspace Hero ───────────────────────────── */}
        <div
          className="px-6 py-5 flex items-start justify-between gap-6"
          style={{
            borderBottom: `1px solid rgba(200,141,89,0.10)`,
            background: 'linear-gradient(180deg, rgba(255,245,220,0.03) 0%, transparent 100%)',
          }}
        >
          <div className="min-w-0">
            <p
              className="mb-1 uppercase tracking-widest"
              style={{
                fontSize: '0.65rem',
                color: secondary,
                letterSpacing: '0.14em',
                fontFamily: '"Cormorant Garamond", serif',
              }}
            >
              {isMovies ? 'Movies' : 'Places'} workspace
            </p>
            <h1
              className="font-bold leading-tight mb-2"
              style={{
                fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
                color: '#f7efdf',
                fontFamily: '"Cormorant Garamond", serif',
                textShadow: `0 0 32px ${accentGlow}`,
              }}
            >
              {isMovies ? 'Watchlist' : 'Places'}
            </h1>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'rgba(224,210,182,0.7)',
                lineHeight: 1.55,
                maxWidth: '42ch',
              }}
            >
              {isMovies
                ? 'Queue titles, notes, and spin-off rituals from one shared movie space.'
                : 'Collect date ideas, pin the good ones, and keep the shortlist aligned.'}
            </p>
          </div>

          <div className="flex-shrink-0 text-right">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs mb-1"
              style={{
                background: 'rgba(200,141,89,0.12)',
                border: `1px solid ${isMovies ? 'rgba(200,141,89,0.25)' : 'rgba(255,143,107,0.25)'}`,
                color: accent,
                fontFamily: 'sans-serif',
                letterSpacing: '0.02em',
              }}
            >
              Guest mode
            </span>
            <p
              style={{
                fontSize: '0.75rem',
                color: 'rgba(185,164,137,0.6)',
                marginTop: '0.25rem',
              }}
            >
              Use the composer to send a suggestion.
            </p>
          </div>
        </div>

        {/* ─── Section 3: Shared Queue ─────────────────────────────── */}
        <div className="px-6 py-5">
          <p
            className="uppercase tracking-widest mb-1"
            style={{
              fontSize: '0.62rem',
              color: secondary,
              letterSpacing: '0.14em',
              fontFamily: '"Cormorant Garamond", serif',
            }}
          >
            Shared Queue
          </p>
          <h2
            className="font-semibold mb-1"
            style={{
              fontSize: '1.15rem',
              color: '#f0e6d2',
              fontFamily: '"Cormorant Garamond", serif',
            }}
          >
            Send a title to the queue
          </h2>
          <p
            className="mb-4"
            style={{
              fontSize: '0.82rem',
              color: 'rgba(185,164,137,0.65)',
              lineHeight: 1.5,
            }}
          >
            Not signed in? Guest can still send titles to Suggestions for Aaron or Electra to approve.
          </p>

          <div className="relative">
            <input
              type="text"
              placeholder="Add a movie or show title"
              className="w-full px-4 py-3 rounded-xl outline-none text-sm transition-all"
              style={{
                background: 'rgba(0,0,0,0.35)',
                border: `1px solid rgba(200,141,89,0.2)`,
                color: '#f7efdf',
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: '0.95rem',
                caretColor: accent,
              }}
              readOnly
            />
          </div>
        </div>
      </div>
    </div>
  );
}
