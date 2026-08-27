import re

with open("apps/web/src/hooks/movies/index.ts", "r") as f:
    content = f.read()

content = content.replace(
    'if (type === "series" || type === "movie") result.mediaType = type;',
    'if (type === "series" || type === "movie" || type === "youtube") result.mediaType = type;'
)

with open("apps/web/src/hooks/movies/index.ts", "w") as f:
    f.write(content)
