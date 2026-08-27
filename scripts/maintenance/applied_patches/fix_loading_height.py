import re

with open("apps/web/src/components/ui/TiltedPosterWall.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'height: fullViewport ? "100vh" : (isMobile ? "500px" : "800px"),',
    'height: fullViewport ? "100vh" : "100%",\n        flex: fullViewport ? undefined : 1,'
)

with open("apps/web/src/components/ui/TiltedPosterWall.tsx", "w") as f:
    f.write(content)

