import { useCallback, useEffect, useRef } from 'react';

export const useAudio = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass && !audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }

    return () => {
      // Keep it alive for the session usually, but we can close on unmount if needed
      // For a global hook used in many places, maybe don't close immediately
    };
  }, []);

  const playTone = useCallback(
    (frequency: number, type: OscillatorType, duration: number, volume: number = 0.1) => {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioContextRef.current = new AudioContextClass();
        } else {
          return;
        }
      }

      const ctx = audioContextRef.current;

      // Resume context if suspended (browser autoplay policy)
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
    playTone(523.25, 'sine', 0.1, 0.1); // C5
    setTimeout(() => playTone(659.25, 'sine', 0.2, 0.1), 100); // E5
  }, [playTone]);

  return { playTone, playClick, playPop, playSwitch, playSuccess };
};
