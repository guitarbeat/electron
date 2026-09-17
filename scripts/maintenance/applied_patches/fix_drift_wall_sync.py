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
    'meta.copyHeight * ((c * 0.37) % 1)',
    'meta.copyHeight * ((c * 0.37) % 1) + ((Date.now() - GLOBAL_DRIFT_START) / 1000) * speed * columnFactor(c, variance) * (direction === "up" ? 1 : -1)'
)

# Fix missing dependencies in useEffect array
content = content.replace(
    '}, [columnMeta, columnItems]);',
    '}, [columnMeta, columnItems, direction, speed, variance]);'
)

with open("apps/web/src/components/ui/DriftWall.tsx", "w") as f:
    f.write(content)
