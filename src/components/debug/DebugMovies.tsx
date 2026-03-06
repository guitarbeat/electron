import React, { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import { useMovies } from '@/hooks/useMovies';
import { getMovies } from '@/services/movieService';

const DebugMovies: React.FC = () => {
  const { currentUser } = useUser();
  const { movies, isLoading, error, refresh } = useMovies(currentUser);
  const [directMovies, setDirectMovies] = useState<any[]>([]);
  const [directError, setDirectError] = useState<string | null>(null);

  useEffect(() => {
    // Test direct service call
    const testDirect = async () => {
      try {
        const result = await getMovies();
        setDirectMovies(result);
        setDirectError(null);
      } catch (err) {
        setDirectError(err instanceof Error ? err.message : 'Unknown error');
        setDirectMovies([]);
      }
    };

    testDirect();
  }, []);

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.9)',
        color: 'white',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '12px',
        zIndex: 9999,
        maxWidth: '300px',
        maxHeight: '400px',
        overflow: 'auto',
      }}
    >
      <h4>🐛 Debug Movies</h4>
      <p>
        <strong>User:</strong> {currentUser || 'Guest'}
      </p>
      <p>
        <strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}
      </p>
      <p>
        <strong>Error:</strong> {error?.message || 'None'}
      </p>
      <p>
        <strong>Movies from hook:</strong> {movies?.length || 0}
      </p>
      <p>
        <strong>Direct service movies:</strong> {directMovies.length}
      </p>
      <p>
        <strong>Direct error:</strong> {directError || 'None'}
      </p>

      <button onClick={refresh} style={{ marginTop: '10px', padding: '5px 10px' }}>
        Refresh
      </button>

      {movies && movies.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <strong>First movie:</strong>
          <pre style={{ fontSize: '10px', margin: 0 }}>
            {JSON.stringify(movies[0], null, 2).substring(0, 200)}...
          </pre>
        </div>
      )}
    </div>
  );
};

export default DebugMovies;
