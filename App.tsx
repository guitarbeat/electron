
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import UserSelection from './components/UserSelection';
import Watchlist from './components/Watchlist';
import { Movie, User } from './types';
import { getMovies, addMovie, toggleWatched, deleteMovie } from './services/movieService';
// Fix: Correct import for Google GenAI SDK
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [newMovieTitle, setNewMovieTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<string>('');

  const handleSelectUser = (selectedUser: User) => {
    setUser(selectedUser);
  };

  const fetchMovies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const moviesData = await getMovies();
      setMovies(moviesData);
    } catch (err) {
      setError('Failed to fetch movies. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchMovies();
    }
  }, [user, fetchMovies]);

  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMovieTitle.trim() || !user) return;
    
    // Optimistic UI update can be added here
    try {
      await addMovie(newMovieTitle, user);
      setNewMovieTitle('');
      fetchMovies(); // Refetch to get the latest list
    } catch (err) {
      setError('Failed to add movie.');
    }
  };

  const handleToggleWatched = async (id: number, watched: boolean) => {
    if (!user) return;
    try {
      await toggleWatched(id, watched, user);
      fetchMovies(); // Refetch to update UI
    } catch (err) {
      setError('Failed to update movie status.');
    }
  };

  const handleDeleteMovie = async (id: number) => {
    try {
      await deleteMovie(id);
      fetchMovies(); // Refetch to update UI
    } catch (err) {
      setError('Failed to delete movie.');
    }
  };

  const getMovieSuggestion = async () => {
    // Fix: Per guidelines, API key must be from process.env.API_KEY
    if (!process.env.API_KEY) {
        setError("API key not configured.");
        return;
    }
    setIsSuggesting(true);
    setError(null);
    setSuggestion('');
    try {
        // Fix: Per guidelines, initialize with new GoogleGenAI({apiKey: ...})
        const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
        const existingMovies = movies.map(m => m.title).join(', ');
        const prompt = `We are a couple named Aaron and Electra. We have a movie watchlist with these movies already: ${existingMovies}. Please suggest one new movie for us to watch. We like indie, sci-fi, and thrillers. Just give the movie title and nothing else.`;
        
        // Fix: Per guidelines, use ai.models.generateContent
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        // Fix: Per guidelines, access text directly from response.text
        const text = response.text;
        if (text) {
          // Clean up potential quotes from the model's response
          setSuggestion(text.trim().replace(/['"]+/g, ''));
        } else {
          setError('Could not get a movie suggestion. The model returned an empty response.');
        }
    } catch (e) {
        setError('Could not get a movie suggestion.');
        console.error(e);
    } finally {
        setIsSuggesting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-main-dark min-h-screen">
        <Header />
        <main className="flex-grow">
          <UserSelection onSelectUser={handleSelectUser} />
        </main>
      </div>
    );
  }

  return (
    <div className="bg-main-dark min-h-screen text-white font-body">
      <Header />
      <main className="container mx-auto p-4">
        <div className="cute-card p-6 mb-6">
          <h2 className="text-2xl font-heading text-pink-300 mb-4 text-center">Add a New Movie, {user}</h2>
          <form onSubmit={handleAddMovie} className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={newMovieTitle}
              onChange={(e) => setNewMovieTitle(e.target.value)}
              placeholder="e.g., The Matrix"
              className="flex-grow bg-gray-700 text-white rounded-lg p-3 border-2 border-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
            <button type="submit" disabled={isLoading || !newMovieTitle.trim()} className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? 'Adding...' : 'Add Movie'}
            </button>
          </form>
           <div className="mt-4 text-center">
            <button onClick={getMovieSuggestion} disabled={isSuggesting} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 disabled:opacity-50">
              {isSuggesting ? 'Thinking...' : '✨ Get a Suggestion'}
            </button>
            {suggestion && (
              <p className="mt-3 text-lg">How about: <span className="font-bold text-pink-300 cursor-pointer" onClick={() => setNewMovieTitle(suggestion)}>{suggestion}</span>?</p>
            )}
          </div>
        </div>
        
        {error && <p className="text-red-400 text-center my-4">{error}</p>}

        {isLoading && movies.length === 0 ? (
          <p className="text-center">Loading movies...</p>
        ) : (
          <Watchlist movies={movies} user={user} onToggleWatched={handleToggleWatched} onDeleteMovie={handleDeleteMovie} />
        )}
      </main>
    </div>
  );
};

export default App;
