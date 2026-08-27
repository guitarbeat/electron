import re

with open("apps/web/src/components/movies/MovieSectionBody.tsx", "r") as f:
    content = f.read()

new_render_movie = """
  const renderMovie = (movie: Movie) => {
    const hasPoster = Boolean(movie.posterUrl || movie.customPosterUrl);
    const element = (
      <MovieCard
        key={movie.id}
        movie={movie}
        currentUser={currentUser}
        onToggle={() => {
          actions.toggleWatched(movie.id);
        }}
        onToggleError={onToggleError}
        onEditMetadata={async (updates) => {
          await actions.editMovie(movie.id, updates);
        }}
        onDelete={() => onDeleteRequest(movie)}
        isHighlighted={successMovieId === movie.id}
        memories={movieMemories.get(movie.id) ?? []}
        onAddMemory={
          currentUser
            ? async (note) => {
                await actions.addMemory(movie.id, movie.title, currentUser, note);
              }
            : undefined
        }
        onUpdateMemory={async (memoryId, note) => {
          await actions.updateMemory(memoryId, { note });
        }}
        onDeleteMemory={async (memoryId) => {
          await actions.deleteMemory(memoryId);
        }}
        onTogglePin={async (memoryId) => {
          await actions.togglePin(memoryId);
        }}
      />
    );
    return React.cloneElement(element, { "data-height-ratio": hasPoster ? 1 : 0.55 } as any);
  };
"""

content = re.sub(
    r'  const renderMovie = \(movie: Movie\) => \(\n    <MovieCard\n.*?    />\n  \);',
    new_render_movie.strip(),
    content,
    flags=re.DOTALL
)

with open("apps/web/src/components/movies/MovieSectionBody.tsx", "w") as f:
    f.write(content)

