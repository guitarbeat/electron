import { useCallback, useRef } from 'react';

// Use a simple oscillator for retro sound effects
const useSnakeAudio = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize AudioContext on first user interaction if possible,
  // or lazily when a sound is played.
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass();
      }
    }
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback(
    (frequency: number, duration: number, type: OscillatorType = 'square') => {
      const ctx = initAudio();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    },
    [initAudio]
  );

  const playMoveSound = useCallback(() => {
    // Very short blip
    playTone(200, 0.05, 'triangle');
  }, [playTone]);

  const playEatSound = useCallback(() => {
    // High pitched coin-like sound
    playTone(600, 0.1, 'square');
    setTimeout(() => playTone(800, 0.1, 'square'), 50);
  }, [playTone]);

  const playGameOverSound = useCallback(() => {
    // Descending tone
    playTone(300, 0.2, 'sawtooth');
    setTimeout(() => playTone(200, 0.2, 'sawtooth'), 200);
    setTimeout(() => playTone(100, 0.4, 'sawtooth'), 400);
  }, [playTone]);

  return {
    playTone,
    playMoveSound,
    playEatSound,
    playGameOverSound,
  };
};

export default useSnakeAudio;
