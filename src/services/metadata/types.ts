export interface MovieAutocompleteResult {
  title: string;
  year?: string;
  imdbID?: string;
  type: 'movie' | 'series';
  poster?: string;
}

export interface OmdbSearchResult {
  Search: Array<{
    Title: string;
    Year: string;
    imdbID: string;
    Type: 'movie' | 'series';
    Poster: string;
  }>;
}

export interface MovieMetadata {
  title: string;
  year?: string;
  imdbID?: string;
  imdbRating?: string;
  type: 'movie' | 'series';
  poster?: string;
  plot?: string;
  director?: string;
  actors?: string[];
  genre?: string[];
  runtime?: string;
  rated?: string;
  released?: string;
}
