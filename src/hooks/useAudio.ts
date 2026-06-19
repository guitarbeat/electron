import { useCallback, useEffect } from "react";
import { isSoundEnabled } from "@/utils/soundPreference";

let sharedAudioContext: AudioContext | null = null;
let audioContextUnavailable = false;
let userGestureAudioUnlocked = false;
let unlockListenersInstalled = false;
let unlockGestureHandler: (() => void) | null = null;
let masterGainNode: GainNode | null = null;

const MASTER_GAIN = 0.82;
const CLICK_DEBOUNCE_MS = 35;
const DUPLICATE_SOUND_WINDOW_MS = 90;

let lastClickAt = 0;
let lastSoundKey = "";
let lastSoundAt = 0;

const getAudioContextClass = () =>
  window.AudioContext ||
  (window as unknown as { webkitAudioContext?: typeof AudioContext })
    .webkitAudioContext;

const removeUnlockListeners = (): void => {
  if (typeof window === "undefined") {
    return;
  }
  const handler = unlockGestureHandler;
  if (!handler) {
    return;
  }
  window.removeEventListener("pointerdown", handler, true);
  window.removeEventListener("keydown", handler, true);
  window.removeEventListener("touchstart", handler, true);
  unlockGestureHandler = null;
  unlockListenersInstalled = false;
};

const unlockAudioFromUserGesture = (): void => {
  if (
    typeof window === "undefined" ||
    audioContextUnavailable ||
    userGestureAudioUnlocked
  ) {
    return;
  }

  const AudioContextClass = getAudioContextClass();
  if (!AudioContextClass) {
    audioContextUnavailable = true;
    return;
  }

  try {
    if (!sharedAudioContext) {
      sharedAudioContext = new AudioContextClass();
    }
    if (sharedAudioContext.state === "suspended") {
      void sharedAudioContext.resume().catch(() => undefined);
    }
    userGestureAudioUnlocked = true;
    removeUnlockListeners();
  } catch {
    audioContextUnavailable = true;
  }
};

const installUnlockListeners = (): void => {
  if (
    typeof window === "undefined" ||
    unlockListenersInstalled ||
    userGestureAudioUnlocked
  ) {
    return;
  }
  unlockListenersInstalled = true;
  const handler = () => {
    unlockAudioFromUserGesture();
  };
  unlockGestureHandler = handler;
  window.addEventListener("pointerdown", handler, {
    capture: true,
    passive: true,
  });
  window.addEventListener("keydown", handler, { capture: true, passive: true });
  window.addEventListener("touchstart", handler, {
    capture: true,
    passive: true,
  });
};

const getAudioContextForPlayback = (): AudioContext | null => {
  if (typeof window === "undefined" || audioContextUnavailable) {
    return null;
  }

  if (!userGestureAudioUnlocked) {
    installUnlockListeners();
    return null;
  }

  if (!sharedAudioContext) {
    const AudioContextClass = getAudioContextClass();
    if (!AudioContextClass) {
      audioContextUnavailable = true;
      return null;
    }
    try {
      sharedAudioContext = new AudioContextClass();
    } catch {
      audioContextUnavailable = true;
      return null;
    }
  }

  if (sharedAudioContext.state === "suspended") {
    void sharedAudioContext.resume().catch(() => undefined);
  }

  return sharedAudioContext;
};

const ensureMasterGain = (ctx: AudioContext): GainNode => {
  if (!masterGainNode || masterGainNode.context !== ctx) {
    masterGainNode = ctx.createGain();
    masterGainNode.gain.value = MASTER_GAIN;
    masterGainNode.connect(ctx.destination);
  }
  return masterGainNode;
};

const shouldSkipDuplicateSound = (key: string): boolean => {
  const now = performance.now();
  if (key === lastSoundKey && now - lastSoundAt < DUPLICATE_SOUND_WINDOW_MS) {
    return true;
  }
  lastSoundKey = key;
  lastSoundAt = now;
  return false;
};

interface ToneOptions {
  frequency: number;
  endFrequency?: number | null;
  type?: OscillatorType;
  duration?: number;
  volume?: number;
  attackTime?: number;
  startTime?: number;
}

const scheduleTone = (
  ctx: AudioContext,
  {
    frequency,
    endFrequency = null,
    type = "sine",
    duration = 0.1,
    volume = 0.05,
    attackTime = 0.004,
    startTime,
  }: ToneOptions,
): void => {
  const now = startTime ?? ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  filter.type = "lowpass";
  filter.frequency.value = 2600;
  filter.Q.value = 0.6;

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);
  if (endFrequency !== null) {
    osc.frequency.linearRampToValueAtTime(endFrequency, now + duration);
  }

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + attackTime);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gain);
  gain.connect(filter);
  filter.connect(ensureMasterGain(ctx));

  osc.start(now);
  osc.stop(now + duration + 0.01);
};

/**
 * Shared audio hook — Y2K aesthetic.
 * Browsers require a user gesture before AudioContext can run; we defer
 * construction until the first pointer/key/touch, then play UI sounds.
 */
export const useAudio = () => {
  useEffect(() => {
    installUnlockListeners();
    return () => {
      if (userGestureAudioUnlocked) {
        return;
      }
      removeUnlockListeners();
    };
  }, []);

  const getCtx = useCallback(
    (): AudioContext | null => getAudioContextForPlayback(),
    [],
  );

  /**
   * Play a single synthesized tone with a soft attack and smooth decay.
   */
  const playTone = useCallback(
    (
      frequency: number,
      endFrequency: number | null = null,
      type: OscillatorType = "sine",
      duration = 0.1,
      volume = 0.05,
      attackTime = 0.004,
    ) => {
      if (!isSoundEnabled()) {
        return;
      }

      const ctx = getCtx();
      if (!ctx) return;

      scheduleTone(ctx, {
        frequency,
        endFrequency,
        type,
        duration,
        volume,
        attackTime,
      });
    },
    [getCtx],
  );

  /**
   * D5 (587 Hz) soft tap — clean digital keypress.
   */
  const playClick = useCallback(() => {
    const now = performance.now();
    if (now - lastClickAt < CLICK_DEBOUNCE_MS) {
      return;
    }
    lastClickAt = now;
    playTone(587, null, "sine", 0.032, 0.02, 0.002);
  }, [playTone]);

  /**
   * Ascending spring bloop — 330 Hz → 660 Hz in 80 ms.
   */
  const playPop = useCallback(() => {
    if (shouldSkipDuplicateSound("pop")) {
      return;
    }
    playTone(330, 660, "sine", 0.08, 0.04, 0.003);
  }, [playTone]);

  /**
   * Two-step perfect-4th ping — E4 then A4.
   */
  const playSwitch = useCallback(() => {
    if (shouldSkipDuplicateSound("switch")) {
      return;
    }

    const ctx = getCtx();
    if (!ctx || !isSoundEnabled()) {
      return;
    }

    const now = ctx.currentTime;
    scheduleTone(ctx, {
      frequency: 330,
      duration: 0.055,
      volume: 0.028,
      attackTime: 0.003,
      startTime: now,
    });
    scheduleTone(ctx, {
      frequency: 440,
      duration: 0.065,
      volume: 0.028,
      attackTime: 0.003,
      startTime: now + 0.052,
    });
  }, [getCtx]);

  /**
   * Four-note ascending pentatonic chime — C5 → E5 → G5 → C6.
   */
  const playSuccess = useCallback(() => {
    if (shouldSkipDuplicateSound("success")) {
      return;
    }

    const ctx = getCtx();
    if (!ctx || !isSoundEnabled()) {
      return;
    }

    const now = ctx.currentTime;
    const notes = [
      { frequency: 523.25, duration: 0.13, volume: 0.044, delay: 0 },
      { frequency: 659.25, duration: 0.14, volume: 0.04, delay: 0.072 },
      { frequency: 783.99, duration: 0.16, volume: 0.036, delay: 0.144 },
      { frequency: 1046.5, duration: 0.14, volume: 0.03, delay: 0.216 },
    ] as const;

    notes.forEach(({ frequency, duration, volume, delay }) => {
      scheduleTone(ctx, {
        frequency,
        duration,
        volume,
        attackTime: 0.004,
        startTime: now + delay,
      });
    });
  }, [getCtx]);

  /**
   * Warm descending digital tone — gentle error feedback.
   */
  const playError = useCallback(() => {
    if (shouldSkipDuplicateSound("error")) {
      return;
    }

    const ctx = getCtx();
    if (!ctx || !isSoundEnabled()) {
      return;
    }

    const now = ctx.currentTime;
    scheduleTone(ctx, {
      frequency: 493.88,
      endFrequency: 392,
      duration: 0.13,
      volume: 0.036,
      attackTime: 0.006,
      startTime: now,
    });
    scheduleTone(ctx, {
      frequency: 392,
      endFrequency: 293.66,
      duration: 0.12,
      volume: 0.03,
      attackTime: 0.006,
      startTime: now + 0.118,
    });
  }, [getCtx]);

  /**
   * Descending ding-ding — soft attention chime.
   */
  const playWarning = useCallback(() => {
    if (shouldSkipDuplicateSound("warning")) {
      return;
    }

    const ctx = getCtx();
    if (!ctx || !isSoundEnabled()) {
      return;
    }

    const now = ctx.currentTime;
    scheduleTone(ctx, {
      frequency: 783.99,
      duration: 0.09,
      volume: 0.038,
      attackTime: 0.004,
      startTime: now,
    });
    scheduleTone(ctx, {
      frequency: 659.25,
      duration: 0.1,
      volume: 0.032,
      attackTime: 0.004,
      startTime: now + 0.105,
    });
  }, [getCtx]);

  /**
   * PIN keypad tap — subtle pitch steps per digit for tactile feedback.
   */
  const playKey = useCallback(
    (digit = 5) => {
      const clamped = Math.max(0, Math.min(9, digit));
      const semitoneOffset = (clamped - 5) * 0.55;
      const frequency = 523.25 * 2 ** (semitoneOffset / 12);
      playTone(frequency, null, "sine", 0.03, 0.018, 0.002);
    },
    [playTone],
  );

  const playKeypad = useCallback(
    (key: number | "del") => {
      if (key === "del") {
        playClick();
        return;
      }
      playKey(key);
    },
    [playClick, playKey],
  );

  return {
    playTone,
    playClick,
    playPop,
    playSwitch,
    playSuccess,
    playError,
    playWarning,
    playKey,
    playKeypad,
  };
};
