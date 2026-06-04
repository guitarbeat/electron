import re

with open('src/app/App.tsx', 'r') as f:
    app = f.read()
app = app.replace('</LazyBoundary>\n      <div className="app-shell', '</React.Suspense>\n      <div className="app-shell')
with open('src/app/App.tsx', 'w') as f:
    f.write(app)

with open('src/app/AppWorkspaceShell.tsx', 'r') as f:
    app_ws = f.read()
app_ws = app_ws.replace('</LazyBoundary>\n        )}\n      </section>', '</React.Suspense>\n        )}\n      </section>')
with open('src/app/AppWorkspaceShell.tsx', 'w') as f:
    f.write(app_ws)

with open('src/components/spin-match/SpinSwipeGame.tsx', 'r') as f:
    spin = f.read()
spin = spin.replace('  );\n};\n\nfunction ProgressBar', '  );\n}\n\nfunction ProgressBar')
with open('src/components/spin-match/SpinSwipeGame.tsx', 'w') as f:
    f.write(spin)

with open('src/components/movies/MoviesTopControls.tsx', 'r') as f:
    top = f.read()
top = top.replace('  useImperativeHandle(\n    forwardedRef,\n  ) => {\n    const slot = useAppHeaderSlot();\n', '  useImperativeHandle(forwardedRef, () => ({}));\n  const slot = useAppHeaderSlot();\n')
with open('src/components/movies/MoviesTopControls.tsx', 'w') as f:
    f.write(top)

with open('src/services/analyticsService.test.ts', 'r') as f:
    an = f.read()
an = an.replace('    Reflect.deleteProperty(globalWithWindow, \'window\');\n    return;\n  }\n});\n', '    Reflect.deleteProperty(globalWithWindow, \'window\');\n    return;\n  }\n};\n')
with open('src/services/analyticsService.test.ts', 'w') as f:
    f.write(an)
