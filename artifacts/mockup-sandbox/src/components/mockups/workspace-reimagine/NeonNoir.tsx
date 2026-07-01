import React from 'react';
import {
  MessageCircle,
  StickyNote,
  Brain,
  RefreshCw,
  Search,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function NeonNoir() {
  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center p-4 md:p-8 font-sans text-gray-200 overflow-hidden relative"
      style={{
        backgroundColor: '#080810',
        backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(255, 45, 120, 0.08) 0%, transparent 60%)',
        fontFamily: '"Inter", sans-serif'
      }}
    >
      {/* Background glow effects */}
      <div 
        className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full pointer-events-none opacity-20 blur-[120px]"
        style={{ background: '#ff2d78' }}
      />
      <div 
        className="absolute top-[30%] -right-[10%] w-[40%] h-[40%] rounded-full pointer-events-none opacity-10 blur-[120px]"
        style={{ background: '#00d4ff' }}
      />

      <div className="w-full max-w-5xl flex flex-col gap-12 relative z-10">
        
        {/* 1. Shell Control Strip (Nav Bar) */}
        <nav 
          className="w-full rounded-full px-4 py-3 flex items-center justify-between transition-all"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 45, 120, 0.3)',
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(255, 45, 120, 0.05)'
          }}
        >
          {/* Left: Logo & Avatars */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg"
                style={{
                  fontFamily: '"Space Grotesk", sans-serif',
                  background: 'linear-gradient(135deg, #ff2d78, #ff0055)',
                  color: '#fff',
                  boxShadow: '0 0 15px rgba(255, 45, 120, 0.5)'
                }}
              >
                E
              </div>
              <div 
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: '#00d4ff',
                  boxShadow: '0 0 10px #00d4ff'
                }}
              />
            </div>

            <div className="hidden md:flex items-center -space-x-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-[#080810] z-10 shadow-lg" style={{ backgroundColor: '#ff2d78', color: '#fff' }}>A</div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-[#080810] z-20 shadow-lg" style={{ backgroundColor: '#00d4ff', color: '#080810' }}>E</div>
            </div>
          </div>

          {/* Center: Toggle */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
            <div 
              className="flex items-center rounded-full p-1"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', border: '1px solid rgba(255, 255, 255, 0.05)' }}
            >
              <button 
                className="px-5 py-1.5 rounded-full text-sm font-medium transition-all"
                style={{ 
                  backgroundColor: 'rgba(255, 45, 120, 0.15)',
                  color: '#ff2d78',
                  textShadow: '0 0 10px rgba(255, 45, 120, 0.5)',
                  boxShadow: 'inset 0 0 10px rgba(255, 45, 120, 0.2), 0 0 15px rgba(255, 45, 120, 0.2)'
                }}
              >
                Movies
              </button>
              <button className="px-5 py-1.5 rounded-full text-sm font-medium text-gray-500 hover:text-gray-300 transition-all">
                Places
              </button>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5">
            {[
              { icon: MessageCircle, label: 'Messages' },
              { icon: StickyNote, label: 'Notes' },
              { icon: Brain, label: 'Edit Quiz' },
              { icon: RefreshCw, label: 'Spin & Match' }
            ].map((action, i) => (
              <button 
                key={i}
                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-all group relative"
                title={action.label}
              >
                <action.icon className="w-4 h-4 group-hover:scale-110 transition-transform relative z-10" />
                <div 
                  className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{ backgroundColor: 'rgba(0, 212, 255, 0.1)', boxShadow: '0 0 15px rgba(0, 212, 255, 0.3)' }}
                />
              </button>
            ))}
          </div>
        </nav>

        <main className="w-full max-w-4xl mx-auto flex flex-col gap-12 mt-8">
          
          {/* 2. Workspace Hero */}
          <section className="flex flex-col gap-5">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: '#00d4ff' }} />
                <h2 
                  className="text-xs font-bold tracking-[0.2em] uppercase"
                  style={{ color: '#00d4ff', textShadow: '0 0 10px rgba(0, 212, 255, 0.5)' }}
                >
                  Movies Workspace
                </h2>
              </div>
              
              <div 
                className="self-start md:self-auto px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-2 shadow-lg"
                style={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#aaa',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div className="w-2 h-2 rounded-full bg-gray-500 shadow-[0_0_5px_rgba(255,255,255,0.3)]" />
                Guest mode
              </div>
            </div>
            
            <h1 
              className="text-6xl md:text-7xl font-black tracking-tight"
              style={{ 
                fontFamily: '"Space Grotesk", sans-serif',
                color: '#ffffff',
                textShadow: '0 0 40px rgba(255, 45, 120, 0.4), 0 2px 10px rgba(0,0,0,0.8)'
              }}
            >
              Watchlist
            </h1>
            
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl font-light leading-relaxed">
              Queue titles, notes, and spin-off rituals from one shared movie space.
            </p>
          </section>

          {/* 3. Shared Queue Card */}
          <section 
            className="relative rounded-2xl overflow-hidden p-8 flex flex-col gap-6 mt-4"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderLeft: '4px solid #ff2d78',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)'
            }}
          >
            {/* Inner top glow */}
            <div 
              className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, rgba(255,45,120,0.8) 0%, rgba(255,45,120,0) 100%)',
                boxShadow: '0 0 20px rgba(255,45,120,0.6)'
              }}
            />

            <div className="flex flex-col gap-3">
              <h3 
                className="text-xs font-bold tracking-[0.2em] uppercase"
                style={{ color: 'rgba(255, 255, 255, 0.4)' }}
              >
                Shared Queue
              </h3>
              <h2 
                className="text-3xl font-bold text-white"
                style={{ fontFamily: '"Space Grotesk", sans-serif' }}
              >
                Send a title to the queue
              </h2>
              <p className="text-base text-gray-400">
                Not signed in? Guest can still send titles to Suggestions.
              </p>
            </div>

            <div className="relative group mt-2">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-500 group-focus-within:text-[#00d4ff] transition-colors duration-300" />
              </div>
              <input 
                type="text" 
                placeholder="Add a movie or show title..."
                className="w-full bg-[#040408]/60 border border-white/5 rounded-xl pl-12 pr-14 py-5 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:border-transparent transition-all shadow-inner text-lg"
                style={{
                  '--tw-ring-color': '#00d4ff',
                  boxShadow: 'inset 0 2px 15px rgba(0,0,0,0.8)'
                }}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button 
                  className="p-3 bg-[#ff2d78] hover:bg-[#ff0055] text-white rounded-lg transition-all"
                  style={{
                    boxShadow: '0 0 20px rgba(255, 45, 120, 0.5), inset 0 1px 0 rgba(255,255,255,0.3)'
                  }}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              
              {/* Custom focus ring effect */}
              <style dangerouslySetInnerHTML={{__html: `
                input:focus {
                  box-shadow: 0 0 0 1px #00d4ff, 0 0 25px rgba(0, 212, 255, 0.2), inset 0 2px 15px rgba(0,0,0,0.8) !important;
                }
              `}} />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
