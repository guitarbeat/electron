import re

with open("apps/web/src/services/metadata/index.ts", "r") as f:
    content = f.read()

content = content.replace('type?: "movie" | "series",', 'type?: "movie" | "series" | "youtube",')

with open("apps/web/src/services/metadata/index.ts", "w") as f:
    f.write(content)
