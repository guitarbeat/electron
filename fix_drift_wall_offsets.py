import re

with open("apps/web/src/components/ui/DriftWall.tsx", "r") as f:
    content = f.read()

# Replace Math.random() with a deterministic calculation
# The original code: (Math.random() * 0.2 + 0.1) * containerHeight
# We can use: (((i * 1.6180339887) % 1) * 0.2 + 0.1) * containerHeight
content = content.replace(
    '(Math.random() * 0.2 + 0.1) * containerHeight',
    '(((i * 1.6180339887) % 1) * 0.2 + 0.1) * containerHeight'
)

with open("apps/web/src/components/ui/DriftWall.tsx", "w") as f:
    f.write(content)

