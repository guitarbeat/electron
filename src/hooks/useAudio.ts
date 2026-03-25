import { useCallback, useEffect, useRef } from 'react';

/**
 * Shared audio hook for standard UI interactions.
 * All sounds are synthesized via Web Audio API — no external files.
 */
export const useAudio = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass && !audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }
  }, []);

  const getCtx = useCallback((): AudioContext | null => {
    if (!audioContextRef.current) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass();
      } else {
        return null;
      }
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
    return ctx;
  }, []);

  /**
   * Play a single synthesized tone with a soft attack and smooth decay.
   * @param frequency     Start frequency in Hz
   * @param endFrequency  End frequency for a pitch glide (null = no glide)
   * @param type          Oscillator wave type (default 'sine')
   * @param duration      Total duration in seconds (default 0.1)
   * @param volume        Peak gain 0–1 (default 0.05)
   * @param attackTime    Linear ramp-up time in seconds (default 0.004)
   */
  const playTone = useCallback(
    (
      frequency: number,
      endFrequency: number | null = null,
      type: OscillatorType = 'sine',
      duration = 0.1,
      volume = 0.05,
      attackTime = 0.004
    ) => {
      const ctx = getCtx();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, now);
      if (endFrequency !== null) {
        osc.frequency.linearRampToValueAtTime(endFrequency, now + duration);
      }

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + attackTime);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    },
    [getCtx]
  );

  /** Soft, short keyboard-tap click */
  const playClick = useCallback(() => {
    playTone(1100, 900, 'sine', 0.038, 0.032, 0.002);
  }, [playTone]);

  /** Light descending pop — used for modals and bottom sheets */
  const playPop = useCallback(() => {
    playTone(480, 210, 'sine', 0.09, 0.055, 0.003);
  }, [playTone]);

  /** Subtle two-step tone for tab and workspace switches */
  const playSwitch = useCallback(() => {
    playTone(460, null, 'sine', 0.055, 0.038, 0.003);
    setTimeout(() => playTone(600, null, 'sine', 0.07, 0.038, 0.003), 60);
  }, [playTone]);

  /** Three-note rising arpeggio — C5 → E5 → G5 */
  const playSuccess = useCallback(() => {
    playTone(523.25, null, 'sine', 0.11, 0.065, 0.004);
    setTimeout(() => playTone(659.25, null, 'sine', 0.13, 0.065, 0.004), 90);
    setTimeout(() => playTone(783.99, null, 'sine', 0.18, 0.06, 0.004), 180);
  }, [playTone]);

  /** Soft descending two-tone — triangle instead of harsh square */
  const playError = useCallback(() => {
    playTone(300, 180, 'triangle', 0.18, 0.05, 0.005);
    setTimeout(() => playTone(210, 140, 'triangle', 0.15, 0.04, 0.005), 160);
  }, [playTone]);

  /** Gentle double-pulse warning */
  const playWarning = useCallback(() => {
    playTone(360, 320, 'sine', 0.09, 0.048, 0.004);
    setTimeout(() => playTone(340, 300, 'sine', 0.09, 0.04, 0.004), 130);
  }, [playTone]);

  return { playTone, playClick, playPop, playSwitch, playSuccess, playError, playWarning };
};
