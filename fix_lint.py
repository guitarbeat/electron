with open('src/components/movies/MoviesView.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if line.strip() in [
        "addMemory,",
        "deleteMemoryRecord,",
        "renameMovie,",
        "setMovieToDelete,",
        "successMovieId,",
        "toggleMemoryPin,",
        "toggleWatched,",
        "updateMemory,"
    ]:
        continue
    new_lines.append(line)

with open('src/components/movies/MoviesView.tsx', 'w') as f:
    f.writelines(new_lines)
