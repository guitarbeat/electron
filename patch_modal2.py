with open("apps/web/src/components/ui/index.tsx", "r") as f:
    content = f.read()

old_surface = 'style={isUnstyled ? { ...surfaceStyles, background: "transparent", border: "none", boxShadow: "none" } : surfaceStyles}'
new_surface = 'style={isUnstyled ? { ...surfaceStyles, background: "transparent", border: "none", boxShadow: "none", backdropFilter: "none", WebkitBackdropFilter: "none" } : surfaceStyles}'
content = content.replace(old_surface, new_surface)

with open("apps/web/src/components/ui/index.tsx", "w") as f:
    f.write(content)
