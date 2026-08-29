import re

css = """
.pin-dialog-overlay { fixed inset-0 z-[10100] flex items-center justify-center bg-[#04070D]/78 backdrop-blur-[8px] p-4 animate-in fade-in duration-200 }
.pin-dialog-panel { w-full max-w-[22rem] p-6 rounded-2xl border border-white/10 bg-black shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.05)] animate-in zoom-in-95 duration-250 outline-none }
.pin-dialog-form { w-full flex flex-col gap-[1.1rem] }
.pin-dialog-header { flex items-start justify-between gap-3 }
.pin-dialog-identity { flex items-center gap-3 min-w-0 }
.pin-dialog-avatar { shrink-0 w-10 h-10 rounded-full border-2 border-indigo-500/40 overflow-hidden flex items-center justify-center bg-slate-800 shadow-md }
.pin-dialog-titles { min-w-0 flex flex-col gap-0.5 }
.pin-dialog-title { m-0 text-[1.05rem] font-bold text-slate-50 tracking-[-0.01em] whitespace-nowrap overflow-hidden text-ellipsis }
.pin-dialog-subtitle { m-0 text-[0.78rem] text-slate-400 leading-snug }
.pin-dialog-close-btn { shrink-0 w-8 h-8 rounded-full border border-transparent bg-slate-700/50 text-slate-400 flex items-center justify-center cursor-pointer transition-all hover:bg-slate-600/80 hover:text-slate-50 hover:border-white/10 hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-indigo-500 }
.pin-dialog-dots { flex justify-center gap-3 my-1 }
.pin-dialog-dots-shake { animate-[pinShake_0.45s_cubic-bezier(0.36,0.07,0.19,0.97)_both] }
.pin-dialog-dot { w-11 h-12 rounded-xl border-[1.5px] border-slate-700 bg-slate-800/60 flex items-center justify-center transition-all duration-200 shadow-inner }
.pin-dialog-dot-active { border-indigo-500 bg-indigo-500/10 shadow-[0_0_0_3px_rgba(99,102,241,0.25)] -translate-y-0.5 }
.pin-dialog-dot-filled { border-indigo-500/65 bg-indigo-500/20 }
.pin-dialog-dot-error { border-red-500 bg-red-500/15 shadow-[0_0_0_2px_rgba(239,68,68,0.2)] }
.pin-dialog-dot-indicator { w-[0.85rem] h-[0.85rem] rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,1)] animate-in zoom-in duration-150 }
.pin-dialog-error-wrap { flex items-center justify-center gap-1.5 min-h-[1.25rem] }
.pin-dialog-error-icon { text-red-500 shrink-0 }
.pin-dialog-error { m-0 text-sm font-medium text-red-500 text-center }
.pin-dialog-error-placeholder { h-[1.25rem] }
.pin-dialog-keypad { grid grid-cols-3 gap-[0.55rem] }
.pin-dialog-key { h-[3.25rem] rounded-xl border border-slate-700 bg-slate-800/75 text-slate-50 flex flex-col items-center justify-center cursor-pointer select-none transition-all duration-150 shadow-sm hover:bg-indigo-500/15 hover:border-indigo-500/40 hover:-translate-y-[1px] active:scale-95 active:bg-indigo-500/25 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed }
.pin-dialog-key-number { text-xl font-semibold leading-none }
.pin-dialog-key-letters { text-[0.55rem] font-semibold tracking-wider text-slate-500 mt-[0.15rem] leading-none }
.pin-dialog-key-cancel { text-sm font-medium text-slate-400 hover:text-slate-50 hover:bg-slate-600/50 }
.pin-dialog-key-del { text-slate-400 hover:text-slate-50 }
.pin-dialog-actions { mt-1 }
"""

# Let's map these properly
css_map = {
    "pin-dialog-overlay": "fixed inset-0 z-[10100] flex items-center justify-center bg-[#04070D]/78 backdrop-blur-[8px] p-4 animate-in fade-in duration-200",
    "pin-dialog-panel": "w-full max-w-[22rem] p-6 rounded-2xl border border-white/10 bg-[#0f172a] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.05)] animate-in zoom-in-95 duration-250 outline-none",
    "pin-dialog-form": "w-full flex flex-col gap-[1.1rem]",
    "pin-dialog-header": "flex items-start justify-between gap-3",
    "pin-dialog-identity": "flex items-center gap-3 min-w-0",
    "pin-dialog-avatar": "shrink-0 w-10 h-10 rounded-full border-2 border-indigo-500/40 overflow-hidden flex items-center justify-center bg-slate-800 shadow-md",
    "pin-dialog-titles": "min-w-0 flex flex-col gap-[0.15rem]",
    "pin-dialog-title": "m-0 text-[1.05rem] font-bold text-slate-50 tracking-[-0.01em] whitespace-nowrap overflow-hidden text-ellipsis",
    "pin-dialog-subtitle": "m-0 text-[0.78rem] text-slate-400 leading-snug",
    "pin-dialog-close-btn": "shrink-0 w-8 h-8 rounded-full border border-transparent bg-slate-700/50 text-slate-400 flex items-center justify-center cursor-pointer transition-all hover:bg-slate-600/80 hover:text-slate-50 hover:border-white/10 hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-indigo-500",
    "pin-dialog-dots": "flex justify-center gap-3 my-1",
    "pin-dialog-dot": "w-11 h-12 rounded-xl border-[1.5px] border-slate-700 bg-slate-800/60 flex items-center justify-center transition-all duration-200 shadow-inner",
    "pin-dialog-dot-active": "border-indigo-500 bg-indigo-500/10 shadow-[0_0_0_3px_rgba(99,102,241,0.25)] -translate-y-[2px]",
    "pin-dialog-dot-filled": "border-indigo-500/65 bg-indigo-500/20",
    "pin-dialog-dot-error": "border-red-500 bg-red-500/15 shadow-[0_0_0_2px_rgba(239,68,68,0.2)]",
    "pin-dialog-dot-indicator": "w-[0.85rem] h-[0.85rem] rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,1)] animate-in zoom-in duration-150",
    "pin-dialog-error-wrap": "flex items-center justify-center gap-[0.4rem] min-h-[1.25rem]",
    "pin-dialog-error-icon": "text-red-500 shrink-0",
    "pin-dialog-error": "m-0 text-[0.8rem] font-medium text-red-500 text-center",
    "pin-dialog-error-placeholder": "h-[1.25rem]",
    "pin-dialog-keypad": "grid grid-cols-3 gap-[0.55rem]",
    "pin-dialog-key": "h-[3.25rem] rounded-xl border border-slate-700 bg-slate-800/75 text-slate-50 flex flex-col items-center justify-center cursor-pointer select-none transition-all duration-150 shadow-[0_2px_6px_rgba(0,0,0,0.2)] hover:bg-indigo-500/15 hover:border-indigo-500/40 hover:-translate-y-[1px] active:scale-95 active:bg-indigo-500/25 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed",
    "pin-dialog-key-number": "text-[1.25rem] font-semibold leading-none",
    "pin-dialog-key-letters": "text-[0.55rem] font-semibold tracking-[0.08em] text-slate-500 mt-[0.15rem] leading-none",
    "pin-dialog-key-cancel": "text-[0.8rem] font-medium text-slate-400 hover:text-slate-50 hover:bg-slate-600/50",
    "pin-dialog-key-del": "text-slate-400 hover:text-slate-50",
    "pin-dialog-actions": "mt-1",
}

with open("apps/web/src/components/ui/index.tsx", "r") as f:
    content = f.read()

for k, v in css_map.items():
    # Replace plain string classNames
    content = re.sub(rf'className="{k}"', f'className="{v}"', content)
    # Replace in template literals: className={`pin-dialog-dots${flow.isShaking ? " pin-dialog-dots-shake" : ""}`}
    content = re.sub(rf'className={{`{k}', f'className={{`{v} ', content)

# Handle pin-dialog-dots-shake specifically
content = content.replace('pin-dialog-dots-shake', 'animate-[pinShake_0.45s_cubic-bezier(0.36,0.07,0.19,0.97)_both]')
# Handle dynamic dot classes
content = content.replace('pin-dialog-dot-active', css_map['pin-dialog-dot-active'])
content = content.replace('pin-dialog-dot-error', css_map['pin-dialog-dot-error'])
content = content.replace('pin-dialog-dot-filled', css_map['pin-dialog-dot-filled'])
content = content.replace('pin-dialog-dot', css_map['pin-dialog-dot'])
content = content.replace('pin-dialog-key-cancel', css_map['pin-dialog-key-cancel'])
content = content.replace('pin-dialog-key-del', css_map['pin-dialog-key-del'])
content = content.replace('pin-dialog-key', css_map['pin-dialog-key'])

with open("apps/web/src/components/ui/index.tsx", "w") as f:
    f.write(content)

