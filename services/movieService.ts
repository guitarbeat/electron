// Legacy exports - use services/api/gistService.ts instead
export { movieService } from './api/gistService';
export const getMovies = () => movieService.getMovies();
export const saveMovies = (movies: any[]) => movieService.saveMovies(movies);
