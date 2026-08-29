import re

css_map = {
    "workspace-search__search-form": "rounded-xl bg-slate-800/80 border border-slate-700/50 shadow-lg transition-all duration-150 hover:border-indigo-500/30 focus-within:border-indigo-500/70 focus-within:bg-slate-800 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.16)]",
    "workspace-search__search-icon": "bg-transparent shadow-none transform-none text-slate-400 focus-within:text-indigo-400",
    "workspace-search__search-input-wrap": "flex-1 min-w-0 relative h-full",
    "workspace-search__search-actions": "flex items-center gap-1.5 px-1.5 h-full",
    "workspace-search__search-actions-cluster": "flex items-center gap-1.5",
    "workspace-search__field-container": "relative w-full h-11 flex items-center",
    "workspace-search__search-field": "w-full h-full bg-transparent border-none text-slate-50 text-[0.95rem] px-3 focus:outline-none focus:ring-0 placeholder:text-slate-500",
    "workspace-search__clear-btn": "w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 bg-transparent hover:bg-slate-700/50 hover:text-slate-200 transition-colors cursor-pointer",
    "workspace-search__autocomplete": "absolute top-[calc(100%+0.5rem)] left-0 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-[100] transform transition-all duration-200",
    "workspace-search__autocomplete-inner": "max-h-[28rem] overflow-y-auto overscroll-contain flex flex-col p-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent",
    "workspace-search__autocomplete-loading": "p-6 flex flex-col items-center justify-center gap-3 text-slate-400",
    "workspace-search__loading-dots": "flex items-center gap-1.5",
    "workspace-search__autocomplete-loading-dot": "w-1.5 h-1.5 rounded-full bg-indigo-500/60 animate-pulse",
    "workspace-search__loading-label": "text-xs font-medium tracking-wide uppercase text-slate-500",
    "workspace-search__status-dot": "w-1.5 h-1.5 rounded-full bg-indigo-500",
    "workspace-search__autocomplete-copy": "flex flex-col min-w-0 flex-1 gap-0.5",
    "workspace-search__autocomplete-title": "text-[0.925rem] font-medium text-slate-100 truncate",
    "workspace-search__autocomplete-meta": "text-xs text-slate-400 truncate",
    "workspace-search__autocomplete-poster-fallback": "w-full h-full bg-slate-800 flex items-center justify-center text-[0.6rem] text-slate-500 uppercase font-semibold tracking-wider",
    "workspace-search__autocomplete-poster": "w-10 h-14 rounded-md overflow-hidden shrink-0 bg-slate-800 relative shadow-sm border border-white/5",
    "workspace-search__autocomplete-group": "px-2 pt-3 pb-1.5",
    "workspace-search__autocomplete-group-text": "text-[0.65rem] font-bold tracking-wider text-slate-500 uppercase",
    "workspace-search__autocomplete-status": "p-4 text-center text-sm text-slate-400"
}

with open("apps/web/src/components/ui/WorkspaceSearch.tsx", "r") as f:
    content = f.read()

for k, v in css_map.items():
    content = re.sub(rf'className="{k}"', f'className="{v}"', content)
    content = re.sub(rf'className={{cn\("{k}"', f'className={{cn("{v}"', content)
    content = re.sub(rf'className={{cn\(\s*"{k}"', f'className={{cn("{v}"', content)
    
# Handle the active state manually for option
content = content.replace('"workspace-search__autocomplete-option"', '"w-full flex items-center gap-3 p-2 rounded-lg text-left cursor-pointer transition-all duration-150 select-none"')
content = content.replace('"is-active"', '"bg-slate-800/80 shadow-sm border border-white/5"')

with open("apps/web/src/components/ui/WorkspaceSearch.tsx", "w") as f:
    f.write(content)

