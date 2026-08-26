/**
 * useAudio — sound effects hook.
 *
 * Audio effects are disabled for faster perceived performance.
 * All methods are stable no-ops that keep the API contract intact
 * so consumers don't need changes.
 */

import { useCallback } from "react";

const noop = (..._args: unknown[]) => {};

export const useAudio = () => {
  const playTone = useCallback(
    (
      _frequency: number,
      _endFrequency: number | null = null,
      _type: OscillatorType = "sine",
      _duration?: number,
      _volume?: number,
      _attackTime?: number,
    ) => {},
    [],
  );

  return {
    playTone,
    playClick: noop,
    playPop: noop,
    playSwitch: noop,
    playSuccess: noop,
    playError: noop,
    playKeypad: noop,
  };
};
