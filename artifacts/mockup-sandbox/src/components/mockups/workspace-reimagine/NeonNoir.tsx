import React from "react";
import { motion } from "framer-motion";
import { 
  Film, 
  MapPin, 
  MessageSquare, 
  StickyNote, 
  Gamepad2, 
  Dices,
  Lock,
  Send,
  Clapperboard,
  Search
} from "lucide-react";

export function NeonNoir() {
  return (
    <div className="min-h-screen bg-[#03050f] text-slate-50 font-sans selection:bg-violet-500/30 overflow-hidden relative flex flex-col">
      {/* Ambient background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            opacity: [0.1, 0.2, 0.1],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-violet-600/20 blur-[120px]"
        />
        <motion.div 
          animate={{ 
            opacity: [0.15, 0.25, 0.15],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[40%] -right-[20%] w-[60%] h-[60%] rounded-full bg-cyan-500/10 blur-[120px]"
        />
        <motion.div 
          animate={{ 
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] rounded-full bg-fuchsia-600/10 blur-[100px]"
        />
        
        {/* Subtle noise texture overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
        />
      </div>

      {/* Top Navigation */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.05] bg-[#03050f]/60 backdrop-blur-md">
        {/* Left Cluster: Logo + Avatars */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-violet-400">
            <Clapperboard className="w-6 h-6" />
            <span className="font-bold tracking-tight text-lg hidden sm:block">MovieNight</span>
          </div>
          
          <div className="w-px h-6 bg-white/[0.1]" />
          
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-[#03050f] flex items-center justify-center text-xs font-medium ring-1 ring-white/10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                A
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-[#03050f] flex items-center justify-center text-xs font-medium ring-1 ring-cyan-500/30 relative overflow-hidden group shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-transparent" />
                E
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.05]">
              <Lock className="w-3 h-3 text-slate-400" />
              <span className="text-xs font-medium text-slate-300">Pin Locked</span>
            </div>
          </div>
        </div>

        {/* Center Cluster: Context Switcher */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 hidden md:flex">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse" />
            Guest mode — Watchlist is ready
          </div>
          <div className="flex p-1 rounded-full bg-white/[0.03] border border-white/[0.05] backdrop-blur-md">
            <button className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.08] text-white shadow-sm transition-all border border-white/10">
              <Film className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-medium">Movies</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">Places</span>
            </button>
          </div>
        </div>

        {/* Right Cluster: Actions */}
        <div className="flex items-center gap-2 relative z-10">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] transition-all text-slate-300 hover:text-white group">
            <MessageSquare className="w-4 h-4 group-hover:text-cyan-400 transition-colors" />
            <span className="text-sm font-medium hidden lg:block">Messages</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] transition-all text-slate-300 hover:text-white group">
            <StickyNote className="w-4 h-4 group-hover:text-yellow-400 transition-colors" />
            <span className="text-sm font-medium hidden lg:block">Notes</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] transition-all text-slate-300 hover:text-white group">
            <Gamepad2 className="w-4 h-4 group-hover:text-fuchsia-400 transition-colors" />
            <span className="text-sm font-medium hidden lg:block">Edit Quiz</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] border border-violet-400/30 transition-all">
            <Dices className="w-4 h-4" />
            <span className="text-sm font-medium hidden lg:block">Spin & Match</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 flex flex-col max-w-5xl w-full mx-auto px-6 py-12 lg:py-24">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center space-y-6 mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-semibold tracking-widest uppercase">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            Movies Workspace
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50">
            Watchlist
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl font-light">
            Guest mode can still add titles and send suggestions. The host will review them before they hit the main queue.
          </p>
        </div>

        {/* Queue Input Section */}
        <div className="mt-auto pb-12 w-full max-w-3xl mx-auto">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
            
            <div className="relative bg-[#050714] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl overflow-hidden">
              {/* Internal subtle glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 space-y-2 mb-6">
                <h2 className="text-xl font-medium text-white flex items-center gap-2">
                  Send a title to the queue
                  <span className="px-2 py-0.5 rounded-md bg-white/5 text-xs text-slate-400 border border-white/10">Shared</span>
                </h2>
                <p className="text-sm text-slate-400">
                  Drop a movie or show here. We'll automatically fetch the poster and details.
                </p>
              </div>
              
              <div className="relative z-10 flex items-center">
                <div className="absolute left-4 text-slate-500">
                  <Search className="w-5 h-5" />
                </div>
                <input 
                  type="text" 
                  placeholder="Add a movie or show title..." 
                  className="w-full bg-[#0a0c1a] border border-white/10 focus:border-violet-500/50 rounded-xl py-4 pl-12 pr-16 text-white placeholder:text-slate-600 outline-none transition-all shadow-inner focus:ring-1 focus:ring-violet-500/50 text-lg"
                />
                <button className="absolute right-2 p-2.5 rounded-lg bg-white/5 hover:bg-violet-600 text-slate-400 hover:text-white transition-all border border-transparent hover:border-violet-400/30">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
