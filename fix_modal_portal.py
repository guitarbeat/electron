import re

with open("apps/web/src/components/ui/index.tsx", "r") as f:
    content = f.read()

replacement = """  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || (typeof title === "string" ? title : "Dialog")}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
    >
      <div
        className="relative w-full bg-[#0b101b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6"
        style={{
          maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth,
          maxHeight:
            typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
        }}
      >
        {title && (
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <h2 className="text-lg font-bold text-white tracking-wide">
              {title}
            </h2>
            <button
              type="button"
              onClick={closeDisabled ? undefined : onClose}
              disabled={closeDisabled}
              className="text-white/60 hover:text-white transition p-1 disabled:opacity-40"
              aria-label={closeDisabled ? closeDisabledLabel : "Close dialog"}
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
};"""

content = re.sub(
    r'  if \(!isOpen\) return null;\n\n  return \(\n    <div\n      role="dialog"\n      aria-modal="true"\n      aria-label=\{ariaLabel \|\| \(typeof title === "string" \? title : "Dialog"\)\}\n      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"\n    >\n      <div\n        className="relative w-full bg-\[#0b101b\] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6"\n        style=\{\{\n          maxWidth: typeof maxWidth === "number" \? `\$\{maxWidth\}px` : maxWidth,\n          maxHeight:\n            typeof maxHeight === "number" \? `\$\{maxHeight\}px` : maxHeight,\n        \}\}\n      >\n        \{title && \(\n          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">\n            <h2 className="text-lg font-bold text-white tracking-wide">\n              \{title\}\n            </h2>\n            <button\n              type="button"\n              onClick=\{closeDisabled \? undefined : onClose\}\n              disabled=\{closeDisabled\}\n              className="text-white/60 hover:text-white transition p-1 disabled:opacity-40"\n              aria-label=\{closeDisabled \? closeDisabledLabel : "Close dialog"\}\n            >\n              ✕\n            </button>\n          </div>\n        \)\}\n        \{children\}\n      </div>\n    </div>\n  \);\n\};',
    replacement,
    content
)

with open("apps/web/src/components/ui/index.tsx", "w") as f:
    f.write(content)

