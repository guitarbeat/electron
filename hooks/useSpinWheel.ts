import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Movie, User, DailySpinRecord, SpinEntry } from '../types';
import { getTodayRecord, addSpinEntry } from '../services/dailySpinService';

const FRICTION = 0.988; // How quickly the wheel slows down. Closer to 1 is less friction.
const MIN_VELOCITY_TO_SPIN = 0.5; // Requires a minimum flick speed to start a spin
const MIN_VELOCITY_TO_STOP = 0.05; // Below this angular velocity, the wheel stops
const POINTER_HISTORY_LIMIT = 5; // Track last 5 pointer moves for velocity calculation

export const useSpinWheel = (
  movies: Movie[],
  wheelRef: React.RefObject<HTMLDivElement | null>,
  currentUser: User | null,
  onWinner?: (movie: Movie) => void
) => {
  const [status, setStatus] = useState<'idle' | 'spinning' | 'result' | 'loading' | 'saving'>(
    'loading'
  );
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isDragging, setIsDragging] = useState(false);
  const [activeMovie, setActiveMovie] = useState<Movie | null>(null);

  // Daily spin record — resets automatically when the date changes
  const [todayRecord, setTodayRecord] = useState<DailySpinRecord | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const rotationRef = useRef(0);
  const velocityRef = useRef(0);
  const dragStartAngleRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const pointerHistoryRef = useRef<{ angle: number; timestamp: number }[]>([]);
  const interactionElementRef = useRef<HTMLElement | null>(null);
  const spinTimeoutRef = useRef<number | null>(null);

  const filteredMovies = useMemo(() => {
    if (selectedCategory === 'All') return movies;
    return movies.filter((m) => m.category === selectedCategory);
  }, [movies, selectedCategory]);

  const numMovies = filteredMovies.length;
  const segmentAngle = numMovies > 0 ? 360 / numMovies : 0;

  // Derived: how many spins have happened today
  const spinCount = todayRecord?.spins.length ?? 0;

  const getPointerAngle = useCallback((e: MouseEvent | TouchEvent, targetElement: HTMLElement) => {
    const rect = targetElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
    return angle;
  }, []);

  const updateWheelRotation = useCallback(
    (angle: number) => {
      if (wheelRef.current) {
        wheelRef.current.style.transform = `rotate(${angle}deg)`;
        wheelRef.current.style.transition = 'none'; // Ensure no CSS transition interferes
      }
      rotationRef.current = angle;

      if (filteredMovies.length > 0 && segmentAngle > 0) {
        const normalizedRotation = angle % 360;
        const selectionAngle = (360 + 270 - normalizedRotation) % 360;
        const currentIndex = Math.floor(selectionAngle / segmentAngle);
        const safeIndex = Math.max(0, Math.min(currentIndex, filteredMovies.length - 1));
        const newMovie = filteredMovies[safeIndex];

        setActiveMovie((prev) => (prev?.id === newMovie.id ? prev : newMovie));
      }
    },
    [wheelRef, filteredMovies, segmentAngle]
  );

  // Sync activeMovie when movies change
  useEffect(() => {
    if (filteredMovies.length === 0) {
      setActiveMovie(null);
      return;
    }

    const angle = rotationRef.current;
    const normalizedRotation = angle % 360;
    const selectionAngle = (360 + 270 - normalizedRotation) % 360;
    const currentIndex = Math.floor(selectionAngle / segmentAngle);
    const safeIndex = Math.max(0, Math.min(currentIndex, filteredMovies.length - 1));
    setActiveMovie(filteredMovies[safeIndex]);
  }, [filteredMovies, segmentAngle]);

  const spinLoop = useCallback(async () => {
    velocityRef.current *= FRICTION;
    const newRotation = rotationRef.current + velocityRef.current;
    updateWheelRotation(newRotation);

    if (Math.abs(velocityRef.current) > MIN_VELOCITY_TO_STOP) {
      animationFrameRef.current = requestAnimationFrame(spinLoop);
    } else {
      velocityRef.current = 0;
      setStatus('result');

      const finalAngle = rotationRef.current % 360;
      // The marker is at the top (270deg in a typical coordinate system), so we adjust
      const winningAngle = (360 + 270 - finalAngle) % 360;
      const winnerIndex = Math.floor(winningAngle / segmentAngle);
      // Ensure winnerIndex is within bounds
      const safeIndex = Math.max(0, Math.min(winnerIndex, filteredMovies.length - 1));
      const winner = filteredMovies[safeIndex];
      if (!winner) {
        console.error('No winner found, movies array might be empty');
        return;
      }
      setSelectedMovie(winner);

      // Save the spin entry to the daily record
      if (currentUser && winner) {
        setStatus('saving');
        setSaveError(null);
        try {
          const entry: SpinEntry = {
            movieId: winner.id,
            movieTitle: winner.title,
            spunBy: currentUser,
            createdAt: new Date().toISOString(),
          };
          const updatedRecord = await addSpinEntry(entry);
          setTodayRecord(updatedRecord);
          setStatus('result');
          if (onWinner) onWinner(winner);
        } catch (error) {
          console.error('Error saving spin entry:', error);
          setSaveError('Could not save spin. The result may not sync properly.');
          setStatus('result'); // Still show the result even if save failed
          if (onWinner) onWinner(winner);
        }
      } else if (winner) {
        if (onWinner) onWinner(winner);
      }
    }
  }, [updateWheelRotation, segmentAngle, filteredMovies, currentUser, onWinner]);

  const startSpinAnimation = useCallback(() => {
    setStatus('spinning');
    setSelectedMovie(null);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(spinLoop);
  }, [spinLoop]);

  const handlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      // Allow spinning any number of times; only block while already spinning
      if (status === 'spinning' || !e.currentTarget) return;

      interactionElementRef.current = e.currentTarget as HTMLElement;

      dragStartAngleRef.current = getPointerAngle(e.nativeEvent, interactionElementRef.current);
      pointerHistoryRef.current = [{ angle: rotationRef.current, timestamp: Date.now() }];

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setIsDragging(true);
    },
    [status, getPointerAngle]
  );

  // Effect to handle drag logic using document-level event listeners
  useEffect(() => {
    if (!isDragging) return;

    const element = interactionElementRef.current;
    const ownerDoc = element?.ownerDocument;
    if (!element || !ownerDoc) return;

    ownerDoc.body.classList.add('grabbing');

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      // Prevent default scroll behavior during drag on mobile
      if (e.cancelable) {
        e.preventDefault();
      }

      const currentPointerAngle = getPointerAngle(e, element);
      const deltaAngle = currentPointerAngle - dragStartAngleRef.current;
      const newRotation = rotationRef.current + deltaAngle;

      updateWheelRotation(newRotation);
      dragStartAngleRef.current = currentPointerAngle;

      pointerHistoryRef.current.push({ angle: newRotation, timestamp: Date.now() });
      if (pointerHistoryRef.current.length > POINTER_HISTORY_LIMIT) {
        pointerHistoryRef.current.shift();
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      const history = pointerHistoryRef.current;
      if (history.length > 1) {
        const first = history[0];
        const last = history[history.length - 1];
        const deltaTime = last.timestamp - first.timestamp;

        if (deltaTime > 0) {
          const deltaAngle = last.angle - first.angle;
          velocityRef.current = (deltaAngle / deltaTime) * 10;
        }
      } else {
        velocityRef.current = 0;
      }

      if (Math.abs(velocityRef.current) > MIN_VELOCITY_TO_SPIN) {
        startSpinAnimation();
      }
    };

    ownerDoc.addEventListener('mousemove', handlePointerMove);
    ownerDoc.addEventListener('touchmove', handlePointerMove, { passive: false });
    ownerDoc.addEventListener('mouseup', handlePointerUp);
    ownerDoc.addEventListener('touchend', handlePointerUp);

    return () => {
      ownerDoc.body.classList.remove('grabbing');
      ownerDoc.removeEventListener('mousemove', handlePointerMove);
      ownerDoc.removeEventListener('touchmove', handlePointerMove);
      ownerDoc.removeEventListener('mouseup', handlePointerUp);
      ownerDoc.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDragging, getPointerAngle, updateWheelRotation, startSpinAnimation]);

  // Cleanup effect for animation frame and timeouts
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (spinTimeoutRef.current) {
        clearTimeout(spinTimeoutRef.current);
      }
    };
  }, []);

  const handleButtonClick = useCallback(() => {
    if (status === 'spinning' || filteredMovies.length === 0) return;
    velocityRef.current = 15 + Math.random() * 10;
    startSpinAnimation();
  }, [status, startSpinAnimation, filteredMovies.length]);

  const resetAndSpin = () => {
    setStatus('idle');
    setSelectedMovie(null);
    if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    // Use a timeout that matches the CSS transition to allow the UI to reset visually
    spinTimeoutRef.current = window.setTimeout(handleButtonClick, 500);
  };

  // Effect to load today's spin record on mount
  useEffect(() => {
    let isMounted = true;

    const loadTodayRecord = async () => {
      try {
        const record = await getTodayRecord();
        if (!isMounted) return;

        if (record && record.spins.length > 0) {
          setTodayRecord(record);
          // Show the last spin result
          const lastSpin = record.spins[record.spins.length - 1];
          const movie = movies.find((m) => m.id === lastSpin.movieId);
          if (movie) {
            setSelectedMovie(movie);
          } else {
            setSelectedMovie({
              id: lastSpin.movieId,
              title: lastSpin.movieTitle,
              addedBy: lastSpin.spunBy,
              watchedBy: [],
              createdAt: lastSpin.createdAt,
            });
          }
          setStatus('result');
        } else {
          setStatus('idle');
        }
      } catch (error) {
        console.error("Error loading today's spin record:", error);
        if (isMounted) {
          setStatus('idle');
          setSaveError(
            "Could not load today's spin history. You can still spin, but results may not sync."
          );
        }
      }
    };

    loadTodayRecord();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount.

  // Sync selectedMovie if movies list updates and we have a todayRecord
  useEffect(() => {
    if (todayRecord && todayRecord.spins.length > 0 && !selectedMovie) {
      const lastSpin = todayRecord.spins[todayRecord.spins.length - 1];
      const movie = movies.find((m) => m.id === lastSpin.movieId);
      if (movie) {
        setSelectedMovie(movie);
      }
    }
  }, [movies, todayRecord, selectedMovie]);

  return {
    status,
    selectedMovie,
    activeMovie,
    /** @deprecated Use spinCount instead */
    hasSpunToday: spinCount > 0,
    /** Number of spins recorded today (resets at midnight). */
    spinCount,
    /** Full daily spin record for today (null if no spins yet). */
    todayRecord,
    /** @deprecated Use todayRecord instead */
    todaySpinData: todayRecord
      ? {
          date: todayRecord.date,
          movieId: todayRecord.spins[todayRecord.spins.length - 1]?.movieId ?? '',
          movieTitle: todayRecord.spins[todayRecord.spins.length - 1]?.movieTitle ?? '',
          spunBy: todayRecord.spins[todayRecord.spins.length - 1]?.spunBy ?? currentUser,
          createdAt: todayRecord.spins[todayRecord.spins.length - 1]?.createdAt ?? '',
        }
      : null,
    saveError,
    selectedCategory,
    setSelectedCategory,
    filteredMovies,
    getPointerHandlers: () => ({
      onMouseDown: handlePointerDown,
      onTouchStart: handlePointerDown,
    }),
    handlePrimarySpin: handleButtonClick,
    handleSpinAgain: resetAndSpin,
  };
};
