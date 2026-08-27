import re

with open("apps/web/src/hooks/movies/index.ts", "r") as f:
    content = f.read()

content = content.replace(
    'const metadata = await fetchMovieMetadata(searchTerm || movie.title);',
    'const metadata = await fetchMovieMetadata(searchTerm || movie.title, movie.mediaType);'
)

with open("apps/web/src/hooks/movies/index.ts", "w") as f:
    f.write(content)
