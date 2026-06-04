with open('src/components/movies/MoviesView.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    if line.strip() in [
        'addMemory,',
        'deleteMemoryRecord,',
        'handleToggleError,',
        'movieMemories,',
        'renameMovie,',
        'setMovieToDelete,',
        'successMovieId,',
        'toggleMemoryPin,',
        'toggleWatched,',
        'updateMemory,'
    ] and 535 <= i <= 560:
        continue
    new_lines.append(line)

with open('src/components/movies/MoviesView.tsx', 'w') as f:
    f.writelines(new_lines)
