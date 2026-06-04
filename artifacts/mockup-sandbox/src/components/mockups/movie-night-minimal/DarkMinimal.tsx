import React from 'react';
import { Plus, Search, MoreVertical, Dices, Heart, MessageSquare } from 'lucide-react';

export function DarkMinimal() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] font-sans flex flex-col items-center">
      <div className="w-full max-w-md bg-[#0a0a0a] min-h-screen flex flex-col relative border-x border-[#1a1a1a]">

        {/* Top Bar */}
        <header className="px-5 py-4 flex items-center justify-between border-b border-[#1a1a1a] sticky top-0 bg-[#0a0a0a]/90 backdrop-blur z-10">
          <div className="font-light tracking-wide text-lg text-white">electron</div>

          <div className="flex bg-[#141414] rounded-full p-1 border border-[#2a2a2a]">
            <button className="px-4 py-1.5 text-xs font-medium bg-[#222222] rounded-full text-white shadow-sm">Queue</button>
            <button className="px-4 py-1.5 text-xs font-medium text-[#6b6b6b] hover:text-[#ededed] transition-colors">Places</button>
          </div>

          <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-xs text-[#6b6b6b]">
            A
          </div>
        </header>

        {/* Search Row */}
        <div className="px-5 py-6">
          <div className="relative flex items-center group">
            <Search className="absolute left-3 w-4 h-4 text-[#6b6b6b]" />
            <input
              type="text"
              placeholder="Search or add a title..."
              className="w-full bg-[#141414] border border-[#2a2a2a] rounded-[6px] py-2.5 pl-10 pr-10 text-sm text-[#ededed] placeholder:text-[#6b6b6b] focus:outline-none focus:border-[#e11d48] transition-colors"
            />
            <button className="absolute right-2 w-7 h-7 bg-[#222222] rounded-[4px] flex items-center justify-center text-[#ededed] hover:bg-[#2a2a2a] transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Watchlist Area */}
        <main className="flex-1 px-5 pb-24">
          <h2 className="text-[10px] uppercase tracking-widest text-[#6b6b6b] mb-4 font-semibold">Up Next</h2>

          <div className="space-y-3">
            {/* Card 1 */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-[8px] p-3 flex gap-4 items-center hover:bg-[#1a1a1a] transition-colors group">
              <div className="w-16 h-24 bg-slate-800 rounded-[4px] flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium text-sm text-[#ededed] truncate">Dune: Part Two</h3>
                  <button className="text-[#6b6b6b] hover:text-[#ededed] opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-[#6b6b6b] mb-2">2024</div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] px-2 py-0.5 border border-[#2a2a2a] rounded-full text-[#6b6b6b] uppercase tracking-wider">Sci-Fi</span>
                </div>
                <div className="flex -space-x-1">
                  <div className="w-6 h-6 rounded-full bg-[#e11d48] border-2 border-[#141414] flex items-center justify-center text-[9px] font-bold text-white z-10">A</div>
                  <div className="w-6 h-6 rounded-full bg-[#2a2a2a] border-2 border-[#141414] flex items-center justify-center text-[9px] font-bold text-[#6b6b6b]">E</div>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-[8px] p-3 flex gap-4 items-center hover:bg-[#1a1a1a] transition-colors group">
              <div className="w-16 h-24 bg-emerald-900 rounded-[4px] flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium text-sm text-[#ededed] truncate">Shōgun</h3>
                  <button className="text-[#6b6b6b] hover:text-[#ededed] opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-[#6b6b6b] mb-2">2024</div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] px-2 py-0.5 border border-[#2a2a2a] rounded-full text-[#6b6b6b] uppercase tracking-wider">Drama</span>
                </div>
                <div className="flex -space-x-1">
                  <div className="w-6 h-6 rounded-full bg-[#2a2a2a] border-2 border-[#141414] flex items-center justify-center text-[9px] font-bold text-[#6b6b6b] z-10">A</div>
                  <div className="w-6 h-6 rounded-full bg-[#2a2a2a] border-2 border-[#141414] flex items-center justify-center text-[9px] font-bold text-[#6b6b6b]">E</div>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-[8px] p-3 flex gap-4 items-center hover:bg-[#1a1a1a] transition-colors group">
              <div className="w-16 h-24 bg-rose-900 rounded-[4px] flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium text-sm text-[#ededed] truncate">Poor Things</h3>
                  <button className="text-[#6b6b6b] hover:text-[#ededed] opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-[#6b6b6b] mb-2">2023</div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] px-2 py-0.5 border border-[#2a2a2a] rounded-full text-[#6b6b6b] uppercase tracking-wider">Comedy</span>
                </div>
                <div className="flex -space-x-1">
                  <div className="w-6 h-6 rounded-full bg-[#e11d48] border-2 border-[#141414] flex items-center justify-center text-[9px] font-bold text-white z-10">A</div>
                  <div className="w-6 h-6 rounded-full bg-[#e11d48] border-2 border-[#141414] flex items-center justify-center text-[9px] font-bold text-white">E</div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Bottom Toolbar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#141414]/90 backdrop-blur-md border border-[#2a2a2a] p-1.5 rounded-2xl flex items-center gap-1 shadow-2xl">
          <button className="flex flex-col items-center gap-1 w-16 py-2 rounded-xl text-[#ededed] bg-[#222222]">
            <Dices className="w-4 h-4" />
            <span className="text-[9px] font-medium">Spin</span>
          </button>
          <button className="flex flex-col items-center gap-1 w-16 py-2 rounded-xl text-[#6b6b6b] hover:text-[#ededed] hover:bg-[#1a1a1a] transition-all">
            <Heart className="w-4 h-4" />
            <span className="text-[9px] font-medium">Match</span>
          </button>
          <button className="flex flex-col items-center gap-1 w-16 py-2 rounded-xl text-[#6b6b6b] hover:text-[#ededed] hover:bg-[#1a1a1a] transition-all relative">
            <MessageSquare className="w-4 h-4" />
            <span className="text-[9px] font-medium">Chat</span>
            <div className="absolute top-1.5 right-4 w-1.5 h-1.5 bg-[#e11d48] rounded-full"></div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default DarkMinimal;
