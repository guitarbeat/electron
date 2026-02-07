import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Movie, User, DailySpin } from '../types';
import { getTodaySpin, saveDailySpin } from '../services/dailySpinService';

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
  const [isDragging, setIsDragging] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [hasSpunToday, setHasSpunToday] = useState(false);
  const [todaySpinData, setTodaySpinData] = useState<DailySpin | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const rotationRef = useRef(0);
  const velocityRef = useRef(0);
  const dragStartAngleRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const pointerHistoryRef = useRef<{ angle: number; timestamp: number }[]>([]);
  const interactionElementRef = useRef<HTMLElement | null>(null);
  const spinTimeoutRef = useRef<number | null>(null);

  const numMovies = movies.length;
  const segmentAngle = numMovies > 0 ? 360 / numMovies : 0;

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
      setCurrentRotation(angle);
    },
    [wheelRef]
  );

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
      // * Ensure winnerIndex is within bounds
      const safeIndex = Math.max(0, Math.min(winnerIndex, movies.length - 1));
      const winner = movies[safeIndex];
      if (!winner) {
        console.error('No winner found, movies array might be empty');
        return;
      }
      setSelectedMovie(winner);

      // * Save the daily spin result to Gist
      if (currentUser && winner) {
        setStatus('saving');
        setSaveError(null);
        try {
          const today = new Date().toISOString().split('T')[0];
          const dailySpin: DailySpin = {
            date: today,
            movieId: winner.id,
            movieTitle: winner.title,
            spunBy: currentUser,
            createdAt: new Date().toISOString(),
          };
          await saveDailySpin(dailySpin);
          setTodaySpinData(dailySpin);
          setHasSpunToday(true);
          setStatus('result');
          if (onWinner) onWinner(winner);
        } catch (error) {
          console.error('Error saving daily spin:', error);
          setSaveError('Could not save daily spin. The result may not sync properly.');
          setStatus('result'); // * Still show the result even if save failed
          if (onWinner) onWinner(winner);
        }
      } else if (winner) {
        if (onWinner) onWinner(winner);
      }
    }
  }, [updateWheelRotation, segmentAngle, movies, currentUser, onWinner]);

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
      if (status === 'spinning' || hasSpunToday || !e.currentTarget) return;

      interactionElementRef.current = e.currentTarget as HTMLElement;

      dragStartAngleRef.current = getPointerAngle(e.nativeEvent, interactionElementRef.current);
      pointerHistoryRef.current = [{ angle: rotationRef.current, timestamp: Date.now() }];

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setIsDragging(true);
    },
    [status, hasSpunToday, getPointerAngle]
  );

  // Effect to handle drag logic using document-level event listeners
  useEffect(() => {
    if (!isDragging) return;

    const element = interactionElementRef.current;
    const ownerDoc = element?.ownerDocument;
    if (!element || !ownerDoc) return;

    ownerDoc.body.classList.add('grabbing');

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      // * Prevent default scroll behavior during drag on mobile
      if ('touches' in e) {
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
    if (status === 'spinning' || hasSpunToday || movies.length === 0) return;
    velocityRef.current = 15 + Math.random() * 10;
    startSpinAnimation();
  }, [status, hasSpunToday, startSpinAnimation, movies.length]);

  const resetAndSpin = () => {
    if (hasSpunToday) return; // * Prevent spinning again if already spun today
    setStatus('idle');
    setSelectedMovie(null);
    if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    // Use a timeout that matches the CSS transition to allow the UI to reset visually
    spinTimeoutRef.current = window.setTimeout(handleButtonClick, 500);
  };

  // * Effect to check for existing daily spin on mount
  useEffect(() => {
    let isMounted = true;

    const checkTodaySpin = async () => {
      try {
        const todaySpin = await getTodaySpin();
        if (!isMounted) return;

        if (todaySpin) {
          // * Find the movie in the current movies list (using a local search when data arrives)
          setTodaySpinData(todaySpin);
          setHasSpunToday(true);
          setStatus('result');

          const movie = movies.find((m) => m.id === todaySpin.movieId);
          if (movie) {
            setSelectedMovie(movie);
          } else {
            setSelectedMovie({
              id: todaySpin.movieId,
              title: todaySpin.movieTitle,
              addedBy: 'Aaron',
              watchedBy: [],
              createdAt: todaySpin.createdAt,
            });
          }
        } else {
          setStatus('idle');
        }
      } catch (error) {
        console.error("Error checking today's spin:", error);
        if (isMounted) {
          setStatus('idle');
          setSaveError(
            'Could not check for existing spin. You can still spin, but results may not sync.'
          );
        }
      }
    };

    checkTodaySpin();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // * Only run on mount. Subsequent updates handled by saveDailySpin.

  // * Sync selectedMovie if movies list updates and we have todaySpinData
  useEffect(() => {
    if (todaySpinData && !selectedMovie) {
      const movie = movies.find((m) => m.id === todaySpinData.movieId);
      if (movie) {
        setSelectedMovie(movie);
      }
    }
  }, [movies, todaySpinData, selectedMovie]);

  return {
    status,
    selectedMovie,
    currentRotation,
    hasSpunToday,
    todaySpinData,
    saveError,
    getPointerHandlers: () => ({
      onMouseDown: handlePointerDown,
      onTouchStart: handlePointerDown,
    }),
    handlePrimarySpin: handleButtonClick,
    handleSpinAgain: resetAndSpin,
  };
};
