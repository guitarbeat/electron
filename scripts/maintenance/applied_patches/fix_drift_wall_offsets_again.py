import re

with open("apps/web/src/components/ui/DriftWall.tsx", "r") as f:
    content = f.read()

content = content.replace(
    '(((i * 1.6180339887) % 1) * 0.2 + 0.1) * containerHeight',
    '(((i * 1.6180339887) % 1) * 0.5 + 0.5) * tileHeight * 3'
)

with open("apps/web/src/components/ui/DriftWall.tsx", "w") as f:
    f.write(content)

