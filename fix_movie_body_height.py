import re

with open("apps/web/src/components/movies/MovieSectionBody.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'height: isMobile ? "500px" : "800px"',
    'height: "100%", flex: 1'
)

with open("apps/web/src/components/movies/MovieSectionBody.tsx", "w") as f:
    f.write(content)
