import re

file_path = "src/components/watchlist/index.tsx"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace("  }, [deleteMovie, movieToDelete, setToast]);", "  }, [deleteMovie, movieToDelete, setToast, setMovieToDelete]);")

with open(file_path, "w") as f:
    f.write(content)
