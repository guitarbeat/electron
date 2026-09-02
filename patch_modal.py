with open("apps/web/src/components/ui/index.tsx", "r") as f:
    content = f.read()

content = content.replace(
    '  closeDisabledLabel?: string;\n}',
    '  closeDisabledLabel?: string;\n  isUnstyled?: boolean;\n}'
)

content = content.replace(
    '  closeDisabledLabel = "Please wait for the current action to finish.",\n}) => {',
    '  closeDisabledLabel = "Please wait for the current action to finish.",\n  isUnstyled = false,\n}) => {'
)

old_surface = '      <div\n        ref={dialogRef}\n        tabIndex={-1}\n        className="minigame-modal-surface"\n        style={surfaceStyles}\n      >'
new_surface = '      <div\n        ref={dialogRef}\n        tabIndex={-1}\n        className="minigame-modal-surface"\n        style={isUnstyled ? { ...surfaceStyles, background: "transparent", border: "none", boxShadow: "none" } : surfaceStyles}\n      >'
content = content.replace(old_surface, new_surface)

with open("apps/web/src/components/ui/index.tsx", "w") as f:
    f.write(content)
