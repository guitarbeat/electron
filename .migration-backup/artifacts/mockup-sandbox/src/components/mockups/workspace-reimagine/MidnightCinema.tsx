import React from "react";
import { 
  Film, 
  MapPin, 
  MessageSquare, 
  StickyNote, 
  Gamepad2, 
  Dices,
  Lock,
  Search,
  ArrowRight,
  Ticket
} from "lucide-react";

export function MidnightCinema() {
  return (
    <div className="min-h-screen w-full flex flex-col relative bg-[#0f0f0f] text-[#f2ede8] selection:bg-[#f5a623] selection:text-[#0f0f0f]">
      {/* Fonts & Global Styles for this mockup */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600&display=swap');
        
        .font-marquee {
          font-family: 'Bebas Neue', cursive;
          letter-spacing: 0.05em;
        }
        
        .font-ui {
          font-family: 'Inter', sans-serif;
        }

        /* Film Grain Overlay */
        .film-grain {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 50;
          opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
        
        .glow-accent {
          box-shadow: 0 0 20px rgba(245, 166, 35, 0.15);
        }
      `}</style>

      <div className="film-grain"></div>

      {/* Top Navigation Strip */}
      <header className="h-16 px-6 border-b border-[#2a2a2c] bg-[#1c1c1e]/90 backdrop-blur-md flex items-center justify-between z-40 font-ui relative">
        {/* Left Cluster */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[#f5a623]">
            <Ticket className="w-5 h-5" />
            <span className="font-marquee text-xl tracking-wider pt-1">NIGHT</span>
          </div>
          <div className="w-[1px] h-6 bg-[#2a2a2c]"></div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-[#1c1c1e] bg-[#2a2a2c] flex items-center justify-center text-xs font-medium overflow-hidden">
                <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Aaron&backgroundColor=f5a623" alt="Aaron" className="w-full h-full object-cover opacity-80 mix-blend-luminosity" />
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-[#1c1c1e] bg-[#2a2a2c] flex items-center justify-center text-xs font-medium overflow-hidden">
                <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Electra&backgroundColor=8a8070" alt="Electra" className="w-full h-full object-cover opacity-80 mix-blend-luminosity" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#0f0f0f] border border-[#2a2a2c]">
              <Lock className="w-3 h-3 text-[#8a8070]" />
              <span className="text-[10px] font-medium text-[#8a8070] uppercase tracking-wider">Pin Locked</span>
            </div>
          </div>
        </div>

        {/* Center Cluster */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="flex items-center gap-1 bg-[#0f0f0f] p-1 rounded-full border border-[#2a2a2c]">
            <button className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2a2a2c] text-[#f2ede8] text-xs font-medium transition-colors">
              <Film className="w-3.5 h-3.5 text-[#f5a623]" />
              Movies
            </button>
            <button className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[#8a8070] hover:text-[#f2ede8] text-xs font-medium transition-colors">
              <MapPin className="w-3.5 h-3.5" />
              Places
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#f5a623] animate-pulse"></div>
            <span className="text-xs text-[#8a8070]">Guest mode — Watchlist is ready</span>
          </div>
        </div>

        {/* Right Cluster */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#2a2a2c] hover:bg-[#323235] text-[#8a8070] hover:text-[#f2ede8] text-xs font-medium transition-colors border border-transparent hover:border-[#404044]">
            <MessageSquare className="w-3.5 h-3.5" />
            Messages
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#2a2a2c] hover:bg-[#323235] text-[#8a8070] hover:text-[#f2ede8] text-xs font-medium transition-colors border border-transparent hover:border-[#404044]">
            <StickyNote className="w-3.5 h-3.5" />
            Notes
          </button>
          <div className="w-[1px] h-4 bg-[#2a2a2c] mx-1"></div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#2a2a2c] hover:bg-[#323235] text-[#8a8070] hover:text-[#f2ede8] text-xs font-medium transition-colors border border-transparent hover:border-[#404044]">
            <Gamepad2 className="w-3.5 h-3.5" />
            Edit Quiz
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#f5a623]/10 hover:bg-[#f5a623]/20 text-[#f5a623] text-xs font-medium transition-colors border border-[#f5a623]/20">
            <Dices className="w-3.5 h-3.5" />
            Spin & Match
          </button>
        </div>
      </header>

      {/* Workspace Hero */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 py-20">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#f5a623] opacity-[0.03] blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="text-center max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-[#2a2a2c] bg-[#1c1c1e]">
            <Film className="w-3.5 h-3.5 text-[#f5a623]" />
            <span className="text-xs font-medium text-[#8a8070] uppercase tracking-widest font-ui">Movies Workspace</span>
          </div>
          
          <h1 className="font-marquee text-8xl md:text-[120px] leading-none tracking-tight text-[#f2ede8] glow-accent" style={{ textShadow: '0 4px 24px rgba(245, 166, 35, 0.15)' }}>
            WATCHLIST
          </h1>
          
          <p className="text-[#8a8070] text-lg font-ui max-w-md mx-auto leading-relaxed">
            Guest mode can still add titles and send suggestions. The queue is waiting.
          </p>
        </div>
      </main>

      {/* Shared Queue Section */}
      <footer className="w-full bg-[#1c1c1e] border-t border-[#2a2a2c] px-6 py-8 relative z-20 font-ui">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-[#f5a623] text-sm font-medium uppercase tracking-widest flex items-center gap-2">
                <Ticket className="w-4 h-4" />
                Shared Queue
              </h3>
              <p className="text-[#8a8070] text-sm">Send a title to the queue for your next viewing session.</p>
            </div>
            
            <div className="w-full md:w-[500px] relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#f5a623]/0 via-[#f5a623]/20 to-[#f5a623]/0 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
              <div className="relative flex items-center bg-[#0f0f0f] border border-[#2a2a2c] rounded-lg p-1 transition-colors focus-within:border-[#f5a623]/50">
                <div className="pl-4 pr-3">
                  <Search className="w-4 h-4 text-[#8a8070]" />
                </div>
                <input 
                  type="text" 
                  placeholder="Add a movie or show title..." 
                  className="w-full bg-transparent border-none outline-none text-[#f2ede8] placeholder:text-[#8a8070] text-sm py-3"
                />
                <button className="ml-2 flex items-center justify-center bg-[#f5a623] hover:bg-[#e8950a] text-[#0f0f0f] px-6 py-3 rounded text-sm font-bold transition-colors">
                  Send
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
