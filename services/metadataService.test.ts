import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { fetchMovieMetadata, searchMovies } from './metadataService.ts';

describe('metadataService', () => {
  beforeEach(() => {
    mock.restoreAll();
  });

  describe('fetchMovieMetadata', () => {
    it('should fetch from OMDb by title and return result', async () => {
      const mockOmdbResponse = {
        Response: 'True',
        Title: 'The Matrix',
        Year: '1999',
        imdbID: 'tt0133093',
        Type: 'movie',
        Poster: 'matrix.jpg',
        Plot: 'A computer hacker learns from mysterious rebels about the true nature of his reality...',
        imdbRating: '8.7',
      };

      global.fetch = mock.fn(async (url: string) => {
        if (url.includes('omdbapi.com')) {
          return {
            ok: true,
            status: 200,
            json: async () => mockOmdbResponse,
          } as Response;
        }
        return { ok: false, status: 404 } as Response;
      });

      const result = await fetchMovieMetadata('The Matrix');
      assert.strictEqual(result.title, 'The Matrix');
      assert.strictEqual(result.year, '1999');
      assert.strictEqual(result.type, 'movie');
    });

    it('should fallback to TVMaze if OMDb returns False', async () => {
      const mockTvMazeResponse = [
        {
          show: {
            name: 'The Matrix Show',
            premiered: '2023-01-01',
            summary: '<p>Plot of the show</p>',
            rating: { average: 7.5 },
            genres: ['Sci-Fi'],
            image: { medium: 'medium.jpg' },
          },
        },
      ];

      global.fetch = mock.fn(async (url: string) => {
        if (url.includes('omdbapi.com')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ Response: 'False' }),
          } as Response;
        }
        if (url.includes('api.tvmaze.com')) {
          return {
            ok: true,
            status: 200,
            json: async () => mockTvMazeResponse,
          } as Response;
        }
        return { ok: false, status: 404 } as Response;
      });

      const result = await fetchMovieMetadata('The Matrix');
      assert.strictEqual(result.title, 'The Matrix Show');
      assert.strictEqual(result.year, '2023');
      assert.strictEqual(result.plot, 'Plot of the show');
      assert.strictEqual(result.type, 'series');
    });
  });

  describe('searchMovies', () => {
    it('should combine results from OMDb and TVMaze and deduplicate', async () => {
      const mockOmdbSearchResponse = {
        Response: 'True',
        Search: [
          { Title: 'Movie 1', Year: '2021', imdbID: 'tt1', Type: 'movie', Poster: 'p1.jpg' },
          { Title: 'Movie 2', Year: '2022', imdbID: 'tt2', Type: 'movie', Poster: 'p2.jpg' },
        ],
      };

      const mockTvMazeSearchResponse = [
        {
          show: {
            id: 101,
            name: 'Movie 1',
            premiered: '2021-05-05',
            image: { medium: 'p1_tv.jpg' },
          },
        },
        {
          show: { id: 103, name: 'Series 3', premiered: '2023-10-10', image: { medium: 'p3.jpg' } },
        },
      ];

      global.fetch = mock.fn(async (url: string) => {
        if (url.includes('omdbapi.com')) {
          return {
            ok: true,
            status: 200,
            json: async () => mockOmdbSearchResponse,
          } as Response;
        }
        if (url.includes('api.tvmaze.com')) {
          return {
            ok: true,
            status: 200,
            json: async () => mockTvMazeSearchResponse,
          } as Response;
        }
        return { ok: false, status: 404 } as Response;
      });

      const results = await searchMovies('Movie');

      assert.strictEqual(results.length, 3);
      assert.strictEqual(results[0].title, 'Movie 1');
      assert.strictEqual(results[1].title, 'Movie 2');
      assert.strictEqual(results[2].title, 'Series 3');
    });
  });
});
