import React from 'react';

export function WarmNeutral() {
  const primaryText = '#1c1917';
  const secondaryText = '#78716c';
  const accent = '#b45309';
  const bg = '#f7f4f0';
  const cardBg = '#fdfaf6';
  const borderCol = '#e7e5e4';
  const shadow = '0 2px 8px rgba(0,0,0,0.06)';

  return (
    <div className="min-h-screen font-sans w-full" style={{ background: bg, color: primaryText }}>
      {/* Top Navigation */}
      <div
        className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
        style={{ background: 'rgba(247, 244, 240, 0.8)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-2 font-medium tracking-tight">
          <span style={{ color: accent }}>✦</span>
          <span>Electron</span>
        </div>

        <div className="flex items-center p-1 rounded-full" style={{ background: '#eaddcc' }}>
          <button
            className="px-4 py-1.5 text-sm font-medium rounded-full shadow-sm"
            style={{ background: cardBg, color: accent }}
          >
            Watchlist
          </button>
          <button
            className="px-4 py-1.5 text-sm font-medium rounded-full"
            style={{ color: secondaryText }}
          >
            Places
          </button>
        </div>

        <div className="flex items-center -space-x-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2" style={{ background: '#eaddcc', borderColor: bg, color: accent }}>A</div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2" style={{ background: '#d6d3d1', borderColor: bg, color: primaryText }}>E</div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 pb-20 pt-8">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-serif font-medium tracking-tight">Up Next</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#eaddcc', color: accent }}>
            4
          </span>
        </div>

        {/* Watchlist Cards */}
        <div className="flex flex-col gap-4">
          {[
            { title: "Past Lives", year: "2023", runtime: "1h 45m", genre: "Drama" },
            { title: "Dune: Part Two", year: "2024", runtime: "2h 46m", genre: "Sci-Fi" },
            { title: "The Holdovers", year: "2023", runtime: "2h 13m", genre: "Comedy" }
          ].map((movie, i) => (
            <React.Fragment key={i}>
              <div
                className="flex p-4 gap-4 transition-transform hover:-translate-y-0.5"
                style={{ background: cardBg, borderRadius: '14px', boxShadow: shadow }}
              >
                {/* Poster */}
                <div
                  className="rounded-lg shrink-0"
                  style={{ width: '60px', height: '88px', background: '#eaddcc' }}
                />

                {/* Content */}
                <div className="flex flex-col flex-1 justify-between py-0.5">
                  <div>
                    <h3 className="font-semibold text-lg leading-tight mb-1" style={{ color: primaryText }}>{movie.title}</h3>
                    <div className="flex items-center gap-2 text-sm" style={{ color: secondaryText }}>
                      <span>{movie.year}</span>
                      <span>·</span>
                      <span>{movie.runtime}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <span
                      className="text-xs px-2 py-1 rounded-full border font-medium"
                      style={{ color: accent, borderColor: 'rgba(180, 83, 9, 0.2)', background: 'rgba(180, 83, 9, 0.05)' }}
                    >
                      {movie.genre}
                    </span>

                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: '#eaddcc', color: accent }}>
                        A <span className="text-[10px]">✓</span>
                      </span>
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: '#f5f5f4', color: secondaryText }}>
                        E <span className="text-[10px]">○</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {i < 2 && <div className="mx-4 h-px" style={{ background: borderCol }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Action Pills */}
        <div className="flex flex-wrap items-center gap-3 mt-10">
          <button
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full font-medium transition-transform hover:scale-[1.02]"
            style={{ background: cardBg, color: primaryText, boxShadow: shadow, borderRadius: '20px' }}
          >
            <span className="text-xl">🎡</span> Spin the Wheel
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full font-medium transition-transform hover:scale-[1.02]"
            style={{ background: cardBg, color: primaryText, boxShadow: shadow, borderRadius: '20px' }}
          >
            <span className="text-xl">↔</span> Match
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full font-medium transition-transform hover:scale-[1.02]"
            style={{ background: cardBg, color: primaryText, boxShadow: shadow, borderRadius: '20px' }}
          >
            <span className="text-xl">💬</span> Messages
          </button>
        </div>
      </div>
    </div>
  );
}
