import React from 'react';
import { MessageCircle, StickyNote, Brain, RefreshCw, Search } from 'lucide-react';

export default function SoftEditorial() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: '#f5f0e8',
        color: '#1a1a1a',
        fontFamily: '"Lora", "Georgia", serif',
      }}
    >
      {/* 1. Shell Control Strip (Nav Bar) */}
      <header
        className="w-full bg-white flex items-center justify-between px-8 py-5 sticky top-0 z-10"
        style={{ borderBottom: '1px solid rgba(139, 115, 85, 0.3)' }}
      >
        {/* Left: Logo & Avatars */}
        <div className="flex items-center gap-8">
          <div
            className="text-3xl font-bold italic tracking-tighter"
            style={{ fontFamily: '"Playfair Display", serif', color: '#2d5a3d' }}
          >
            E·
          </div>
          <div className="flex -space-x-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm border-2 border-white shadow-sm z-10"
              style={{ backgroundColor: '#c4687a', fontFamily: '"Inter", sans-serif' }}
            >
              A
            </div>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm border-2 border-white shadow-sm z-0"
              style={{ backgroundColor: '#2d5a3d', fontFamily: '"Inter", sans-serif' }}
            >
              E
            </div>
          </div>
        </div>

        {/* Center: Workspace Toggle */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-10">
          <button
            className="text-xs uppercase tracking-[0.25em] font-medium pb-2 transition-colors relative"
            style={{
              fontFamily: '"Inter", sans-serif',
              color: '#c4687a',
            }}
          >
            Movies
            <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ backgroundColor: '#c4687a' }} />
          </button>
          <button
            className="text-xs uppercase tracking-[0.25em] font-medium pb-2 text-slate-400 hover:text-slate-600 transition-colors"
            style={{ fontFamily: '"Inter", sans-serif' }}
          >
            Places
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-8">
          <button className="flex items-center gap-2 group">
            <MessageCircle size={15} style={{ color: '#8b7355' }} className="group-hover:text-slate-900 transition-colors" />
            <span className="text-slate-600 group-hover:text-slate-900 transition-colors" style={{ fontFamily: '"Inter", sans-serif', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '10px', fontWeight: 500 }}>Messages</span>
          </button>
          <button className="flex items-center gap-2 group">
            <StickyNote size={15} style={{ color: '#8b7355' }} className="group-hover:text-slate-900 transition-colors" />
            <span className="text-slate-600 group-hover:text-slate-900 transition-colors" style={{ fontFamily: '"Inter", sans-serif', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '10px', fontWeight: 500 }}>Notes</span>
          </button>
          <button className="flex items-center gap-2 group">
            <Brain size={15} style={{ color: '#8b7355' }} className="group-hover:text-slate-900 transition-colors" />
            <span className="text-slate-600 group-hover:text-slate-900 transition-colors" style={{ fontFamily: '"Inter", sans-serif', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '10px', fontWeight: 500 }}>Edit Quiz</span>
          </button>
          <button className="flex items-center gap-2 group">
            <RefreshCw size={15} style={{ color: '#8b7355' }} className="group-hover:text-slate-900 transition-colors" />
            <span className="text-slate-600 group-hover:text-slate-900 transition-colors" style={{ fontFamily: '"Inter", sans-serif', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '10px', fontWeight: 500 }}>Spin & Match</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-12 pt-32 pb-40 flex flex-col gap-32">
        
        {/* 2. Workspace Hero */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-16">
          <div className="flex-1 flex flex-col gap-8 max-w-2xl">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#c4687a' }} />
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.3em]"
                style={{ fontFamily: '"Inter", sans-serif', color: '#8b7355' }}
              >
                Movies Workspace
              </span>
            </div>
            
            <h1
              className="text-7xl md:text-8xl italic font-normal tracking-tight leading-[0.9]"
              style={{ fontFamily: '"Playfair Display", serif', color: '#1a1a1a' }}
            >
              Watchlist
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 leading-relaxed mt-4 font-light">
              Queue titles, notes, and spin-off rituals from one shared movie space.
            </p>
          </div>

          <div 
            className="hidden md:flex flex-col items-start border-l pl-10 py-4 h-full justify-end"
            style={{ borderColor: 'rgba(139, 115, 85, 0.3)' }}
          >
            <span
              className="text-[10px] uppercase tracking-[0.25em] mb-3 font-semibold"
              style={{ fontFamily: '"Inter", sans-serif', color: '#8b7355' }}
            >
              Status
            </span>
            <span 
              className="text-sm font-medium uppercase tracking-[0.2em]"
              style={{ fontFamily: '"Inter", sans-serif', color: '#2d5a3d' }}
            >
              Guest mode
            </span>
          </div>
        </section>

        {/* 3. Shared Queue Card */}
        <section className="w-full max-w-4xl">
          <div 
            className="bg-white px-16 py-20 relative"
            style={{ 
              borderTop: '3px solid #c4687a',
              boxShadow: '0 20px 40px -20px rgba(139,115,85,0.08)'
            }}
          >
            <div className="max-w-2xl">
              <span
                className="text-[11px] uppercase tracking-[0.3em] font-semibold mb-6 block"
                style={{ fontFamily: '"Inter", sans-serif', color: '#8b7355' }}
              >
                Shared Queue
              </span>
              <h2
                className="text-4xl md:text-5xl italic mb-6 leading-tight"
                style={{ fontFamily: '"Playfair Display", serif', color: '#1a1a1a' }}
              >
                Send a title to the queue
              </h2>
              <p className="text-slate-500 text-lg mb-16 font-light">
                Not signed in? Guest can still send titles to Suggestions.
              </p>
            </div>

            <div className="relative group">
              <input
                type="text"
                placeholder="Add a movie or show title..."
                className="w-full bg-transparent pb-6 text-2xl outline-none placeholder-slate-300 transition-colors focus:border-slate-800"
                style={{
                  borderBottom: '1px solid rgba(139, 115, 85, 0.4)',
                  color: '#1a1a1a'
                }}
              />
              <div className="absolute right-0 top-0 pt-1">
                <button 
                  className="p-3 -mr-3 hover:bg-[#f5f0e8] rounded-full transition-colors flex items-center justify-center"
                  style={{ color: '#c4687a' }}
                >
                  <Search size={24} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        </section>
        
      </main>
    </div>
  );
}
