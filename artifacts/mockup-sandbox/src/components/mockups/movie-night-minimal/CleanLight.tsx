import React from "react";
import { MoreHorizontal, Plus } from "lucide-react";

export function CleanLight() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-indigo-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-[#e5e7eb]">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Brand */}
            <div className="font-light tracking-widest text-sm uppercase text-[#111111]">
              electron <span className="text-indigo-500">✦</span>
            </div>

            {/* Tabs */}
            <div className="hidden md:flex items-center gap-1 bg-[#f3f4f6] p-1 rounded-full">
              <button className="px-4 py-1.5 text-sm font-medium bg-white text-[#111111] rounded-full shadow-sm">
                Watchlist
              </button>
              <button className="px-4 py-1.5 text-sm font-medium text-[#6b7280] hover:text-[#111111] transition-colors rounded-full">
                Places
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Minigames */}
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors border border-indigo-100">
                <span>🎡</span> Spin
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-full transition-colors border border-rose-100">
                <span>↔</span> Match
              </button>
            </div>

            {/* Avatar */}
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center text-xs font-medium shadow-sm">
              A
            </div>
          </div>
        </div>
        {/* Mobile Tabs - visible only on small screens */}
        <div className="md:hidden flex px-4 pb-3 gap-2">
          <button className="px-4 py-1.5 text-sm font-medium bg-white text-[#111111] border border-[#e5e7eb] rounded-full shadow-sm">
            Watchlist
          </button>
          <button className="px-4 py-1.5 text-sm font-medium text-[#6b7280] bg-transparent border border-transparent rounded-full">
            Places
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 bg-[#fafafa] min-h-[calc(100vh-64px)] rounded-t-3xl border-t border-l border-r border-[#e5e7eb] shadow-sm mt-8 pb-32">
        <div className="flex items-center justify-between mb-8 pt-4">
          <h1 className="text-2xl font-semibold tracking-tight text-[#111111]">Up Next</h1>
          <span className="text-sm text-[#6b7280]">4 items</span>
        </div>

        <div className="grid gap-4">
          {/* Card 1 */}
          <div className="group flex items-center gap-5 bg-white p-4 rounded-[12px] border border-[#e5e7eb] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08)] transition-all">
            <div className="w-[60px] h-[88px] rounded-md bg-orange-100 shrink-0 shadow-inner overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-200 to-orange-400 opacity-50 mix-blend-multiply"></div>
            </div>
            <div className="flex-1 min-w-0 py-1">
              <div className="flex items-center gap-2 mb-1.5">
                <h2 className="font-semibold text-[16px] truncate text-[#111111]">Dune: Part Two</h2>
                <span className="text-[13px] text-[#6b7280]">2024</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-0.5 rounded-md bg-[#f3f4f6] text-[#6b7280] text-[11px] font-medium tracking-wide uppercase">Sci-Fi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white">A</div>
                <div className="w-6 h-6 rounded-full border border-dashed border-[#d1d5db] text-[#9ca3af] flex items-center justify-center text-[10px] font-bold">E</div>
              </div>
            </div>
            <button className="p-2 text-[#9ca3af] hover:text-[#111111] hover:bg-[#f3f4f6] rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
              <MoreHorizontal size={20} />
            </button>
          </div>

          {/* Card 2 */}
          <div className="group flex items-center gap-5 bg-white p-4 rounded-[12px] border border-[#e5e7eb] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08)] transition-all">
            <div className="w-[60px] h-[88px] rounded-md bg-blue-100 shrink-0 shadow-inner overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-blue-400 opacity-50 mix-blend-multiply"></div>
            </div>
            <div className="flex-1 min-w-0 py-1">
              <div className="flex items-center gap-2 mb-1.5">
                <h2 className="font-semibold text-[16px] truncate text-[#111111]">The Bear</h2>
                <span className="text-[13px] text-[#6b7280]">2022</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-0.5 rounded-md bg-[#f3f4f6] text-[#6b7280] text-[11px] font-medium tracking-wide uppercase">Drama</span>
                <span className="px-2 py-0.5 rounded-md bg-[#f3f4f6] text-[#6b7280] text-[11px] font-medium tracking-wide uppercase">Comedy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white">E</div>
                <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white">A</div>
              </div>
            </div>
            <button className="p-2 text-[#9ca3af] hover:text-[#111111] hover:bg-[#f3f4f6] rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
              <MoreHorizontal size={20} />
            </button>
          </div>

          {/* Card 3 */}
          <div className="group flex items-center gap-5 bg-white p-4 rounded-[12px] border border-[#e5e7eb] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08)] transition-all">
            <div className="w-[60px] h-[88px] rounded-md bg-slate-200 shrink-0 shadow-inner overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-300 to-slate-500 opacity-50 mix-blend-multiply"></div>
            </div>
            <div className="flex-1 min-w-0 py-1">
              <div className="flex items-center gap-2 mb-1.5">
                <h2 className="font-semibold text-[16px] truncate text-[#111111]">Succession</h2>
                <span className="text-[13px] text-[#6b7280]">2018</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-0.5 rounded-md bg-[#f3f4f6] text-[#6b7280] text-[11px] font-medium tracking-wide uppercase">Drama</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full border border-dashed border-[#d1d5db] text-[#9ca3af] flex items-center justify-center text-[10px] font-bold">A</div>
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white">E</div>
              </div>
            </div>
            <button className="p-2 text-[#9ca3af] hover:text-[#111111] hover:bg-[#f3f4f6] rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
              <MoreHorizontal size={20} />
            </button>
          </div>

        </div>
      </main>

      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 w-[56px] h-[56px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-[16px] flex items-center justify-center shadow-[0_8px_16px_-4px_rgba(79,70,229,0.4)] transition-transform hover:scale-105 active:scale-95">
        <Plus size={26} strokeWidth={2.5} />
      </button>
    </div>
  );
}
