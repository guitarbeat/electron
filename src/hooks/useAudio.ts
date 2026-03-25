import { useCallback, useEffect, useRef } from 'react';

/**
 * Shared audio hook — Y2K aesthetic.
 * All sounds use pentatonic/major scale notes, sine waves, and soft envelopes
 * for that warm early-2000s Windows/AIM/Nokia digital chime feel.
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

  /**
   * D5 (587 Hz) soft tap — clean digital keypress, Nokia/WinXP brevity.
   * Very short, barely audible, just enough to register the action.
   */
  const playClick = useCallback(() => {
    playTone(587, null, 'sine', 0.032, 0.022, 0.002);
  }, [playTone]);

  /**
   * Ascending spring bloop — 330 Hz → 660 Hz in 80 ms.
   * That bubbly Y2K "bloop" (think MSN Messenger notification character).
   */
  const playPop = useCallback(() => {
    playTone(330, 660, 'sine', 0.08, 0.046, 0.003);
  }, [playTone]);

  /**
   * Two-step perfect-4th ping — E4 (330 Hz) then A4 (440 Hz).
   * Like a tab/window switch in Windows XP or early browser chrome.
   */
  const playSwitch = useCallback(() => {
    playTone(330, null, 'sine', 0.055, 0.032, 0.003);
    setTimeout(() => playTone(440, null, 'sine', 0.065, 0.032, 0.003), 52);
  }, [playTone]);

  /**
   * Four-note ascending pentatonic chime — C5 → E5 → G5 → C6.
   * The Y2K "achievement unlocked" arpeggio, warm and melodic.
   */
  const playSuccess = useCallback(() => {
    playTone(523.25, null, 'sine', 0.13, 0.052, 0.004);
    setTimeout(() => playTone(659.25, null, 'sine', 0.14, 0.048, 0.004), 72);
    setTimeout(() => playTone(783.99, null, 'sine', 0.16, 0.044, 0.004), 144);
    setTimeout(() => playTone(1046.5, null, 'sine', 0.14, 0.036, 0.004), 216);
  }, [playTone]);

  /**
   * Warm descending digital tone — B4→G4 then G4→E4, all sine.
   * Error, but gentle — like an early-2000s "nope" without the buzzer harshness.
   */
  const playError = useCallback(() => {
    playTone(493.88, 392, 'sine', 0.13, 0.042, 0.006);
    setTimeout(() => playTone(392, 293.66, 'sine', 0.12, 0.034, 0.006), 118);
  }, [playTone]);

  /**
   * Descending ding-ding — G5 then E5, like a soft attention chime.
   * Evokes AIM "door creak" era but stripped down to just the tone.
   */
  const playWarning = useCallback(() => {
    playTone(783.99, null, 'sine', 0.09, 0.044, 0.004);
    setTimeout(() => playTone(659.25, null, 'sine', 0.10, 0.036, 0.004), 105);
  }, [playTone]);

  return { playTone, playClick, playPop, playSwitch, playSuccess, playError, playWarning };
};
