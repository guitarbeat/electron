const fs = require('fs');
const file = 'src/components/watchlist/useWatchlist.ts';
let content = fs.readFileSync(file, 'utf8');

const search = `  const unwatchedMovies = useMemo(
    () => (movies ? movies.filter((movie) => movie.watchedBy.length < 2) : []),
    [movies]
  );
  const watchedMovies = useMemo(
    () => (movies ? movies.filter((movie) => movie.watchedBy.length === 2) : []),
    [movies]
  );`;

const replace = `  const [unwatchedMovies, watchedMovies] = useMemo(() => {
    if (!movies) return [[], []] as [Movie[], Movie[]];
    const unwatched: Movie[] = [];
    const watched: Movie[] = [];
    movies.forEach((movie) => {
      if (movie.watchedBy.length < 2) {
        unwatched.push(movie);
      } else {
        watched.push(movie);
      }
    });
    return [unwatched, watched];
  }, [movies]);`;

if (content.includes(search)) {
  content = content.replace(search, replace);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully patched!');
} else {
  console.log('Search string not found.');
}
