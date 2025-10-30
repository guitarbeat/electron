
import { supabase } from '../supabaseClient';
import { Movie, User } from '../types';

export const getMovies = async (): Promise<Movie[]> => {
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching movies:', error);
    throw error;
  }
  return data || [];
};

export const addMovie = async (title: string, user: User): Promise<Movie> => {
  const { data, error } = await supabase
    .from('movies')
    .insert([{ title, added_by: user, watched: false }])
    .select()
    .single();

  if (error) {
    console.error('Error adding movie:', error);
    throw error;
  }
  return data;
};

export const toggleWatched = async (id: number, watched: boolean, user: User): Promise<Movie> => {
    const watched_by = watched ? user : null;
    const { data, error } = await supabase
        .from('movies')
        .update({ watched, watched_by })
        .eq('id', id)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating movie:', error);
        throw error;
    }
    return data;
};


export const deleteMovie = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from('movies')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting movie:', error);
    throw error;
  }
};
