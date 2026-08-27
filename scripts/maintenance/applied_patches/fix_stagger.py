import re

with open("apps/web/src/components/ui/TiltedPosterWall.tsx", "r") as f:
    content = f.read()

content = content.replace(
    '"--loading-tile": i % 5,',
    '"--loading-tile": Math.floor(i / (isMobile ? 3 : 8)),\n          "--loading-column": i % (isMobile ? 3 : 8),'
)

with open("apps/web/src/components/ui/TiltedPosterWall.tsx", "w") as f:
    f.write(content)

