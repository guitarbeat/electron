import re

with open("apps/web/src/components/ui/DriftWall.tsx", "r") as f:
    content = f.read()

# Add a global start time at the module level
if 'const GLOBAL_DRIFT_START = Date.now();' not in content:
    content = content.replace(
        'const prefersReducedMotion = () =>',
        'const GLOBAL_DRIFT_START = Date.now();\n\nconst prefersReducedMotion = () =>'
    )

# Fix the initial offset calculation to include the elapsed time
content = content.replace(
    '(_, i) => offsetsRef.current[i] ?? (((i * 1.6180339887) % 1) * 0.5 + 0.5) * tileHeight * 3',
    '(_, i) => offsetsRef.current[i] ?? ((((i * 1.6180339887) % 1) * 0.5 + 0.5) * tileHeight * 3 + ((Date.now() - GLOBAL_DRIFT_START) / 1000) * speed * columnFactor(i, variance) * (direction === "up" ? 1 : -1))'
)

with open("apps/web/src/components/ui/DriftWall.tsx", "w") as f:
    f.write(content)

