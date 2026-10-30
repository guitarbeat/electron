import React from 'react';
import { Sparkles, CheckCircle, RefreshCw, Zap } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 selection:bg-indigo-500 selection:text-white">
      <div className="max-w-xl w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-md text-center">
        <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl mb-6">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-3">
          Dev Server Ready
        </h1>
        <p className="text-slate-400 text-base leading-relaxed mb-8">
          The development environment, dependencies, and configuration have been initialized successfully on port 3000.
        </p>

        <div className="grid grid-cols-2 gap-4 text-left mb-8">
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold mb-1">
              <Zap className="w-4 h-4" />
              <span>Vite + React 19</span>
            </div>
            <p className="text-xs text-slate-400">Fast dev server and modern web stack</p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-2 text-cyan-400 text-sm font-semibold mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Tailwind v4</span>
            </div>
            <p className="text-xs text-slate-400">Utility-first styling ready to build</p>
          </div>
        </div>

        <div className="text-xs text-slate-500 border-t border-slate-800/80 pt-4 flex items-center justify-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
          <span>Dev server active on port 3000</span>
        </div>
      </div>
    </div>
  );
}
