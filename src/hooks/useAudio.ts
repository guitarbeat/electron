import { useCallback, useEffect, useRef } from 'react';

/**
 * Shared audio hook for standard UI interactions.
 */
export const useAudio = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Only initialize on the client side
    if (typeof window === 'undefined') return;
    
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass && !audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }
  }, []);

  const playTone = useCallback(
    (frequency: number, type: OscillatorType, duration: number, volume: number = 0.1) => {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          audioContextRef.current = new AudioContextClass();
        } else {
          return;
        }
      }

      const ctx = audioContextRef.current;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    },
    []
  );

  const playClick = useCallback(() => {
    playTone(800, 'sine', 0.05, 0.05);
  }, [playTone]);

  const playPop = useCallback(() => {
    playTone(400, 'sine', 0.1, 0.08);
  }, [playTone]);

  const playSwitch = useCallback(() => {
    playTone(600, 'triangle', 0.08, 0.04);
  }, [playTone]);

  const playSuccess = useCallback(() => {
    playTone(523.25, 'sine', 0.1, 0.08);
    setTimeout(() => playTone(659.25, 'sine', 0.2, 0.08), 100);
  }, [playTone]);

  const playError = useCallback(() => {
    playTone(220, 'square', 0.15, 0.06);
    setTimeout(() => playTone(146.83, 'square', 0.25, 0.06), 150);
  }, [playTone]);

  const playWarning = useCallback(() => {
    playTone(293.66, 'triangle', 0.1, 0.06);
    setTimeout(() => playTone(293.66, 'triangle', 0.1, 0.06), 150);
  }, [playTone]);

  return { playTone, playClick, playPop, playSwitch, playSuccess, playError, playWarning };
};

