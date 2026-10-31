/**
 * PS3 XMB navigation cues from the 2006 system-sound gamerip.
 *
 * Move:   SND Cursor
 * Back:   SND Cancel
 * Select, and opening a modal or the details book: SND System Ok
 *
 * SND Decide, SND Category Decide, SND Option, and SND Oskenter in that rip
 * are the same bytes as SND Cursor, so they are not bundled again.
 */

export type XmbCue = "cursor" | "confirm" | "cancel";

export const XMB_SOUND_STORAGE_KEY = "electron.xmbSounds.v1";
export const XMB_CURSOR_THROTTLE_MS = 80;
export const XMB_ACTION_THROTTLE_MS = 140;

const URLS: Record<XmbCue, string> = {
  cursor: "/xmb/cursor.mp3",
  confirm: "/xmb/confirm.mp3",
  cancel: "/xmb/cancel.mp3",
};

const GAIN: Record<XmbCue, number> = {
  cursor: 0.38,
  confirm: 0.5,
  cancel: 0.42,
};

export interface XmbPlayGate {
  enabled: boolean;
  hidden: boolean;
  userActivated: boolean;
  repeat: boolean;
  cue: XmbCue;
  now: number;
  lastAt: number;
}

/** Saved choice wins. With no choice, television defaults on and the web site stays quiet. */
export function readXmbSoundsEnabled(isTelevision: boolean, stored: string | null): boolean {
  if (stored === "on") return true;
  if (stored === "off") return false;
  return isTelevision;
}

/** Held keys must not stack copies of the same cue. Confirm and Back ignore key-repeat entirely. */
export function canPlayXmbCue(gate: XmbPlayGate): boolean {
  if (!gate.enabled || gate.hidden || !gate.userActivated) return false;
  if (gate.repeat && gate.cue !== "cursor") return false;
  const wait = gate.cue === "cursor" ? XMB_CURSOR_THROTTLE_MS : XMB_ACTION_THROTTLE_MS;
  if (gate.lastAt > 0 && gate.now - gate.lastAt < wait) return false;
  return true;
}

type AudioWindow = Window & { _sharedAudioContext?: AudioContext };

const listeners = new Set<() => void>();
const raw = new Map<XmbCue, ArrayBuffer>();
const decoded = new Map<XmbCue, AudioBuffer>();
const playing = new Map<XmbCue, AudioBufferSourceNode>();
const lastAt: Record<XmbCue, number> = { cursor: 0, confirm: 0, cancel: 0 };
let userActivated = false;
let loading: Promise<void> | null = null;
let confirmTimer = 0;

function storedValue(): string | null {
  try {
    return window.localStorage.getItem(XMB_SOUND_STORAGE_KEY);
  } catch {
    return null;
  }
}

function televisionNow(): boolean {
  return document.documentElement.classList.contains("is-tv-runtime")
    || document.documentElement.classList.contains("is-silk-browser");
}

export function xmbSoundsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return readXmbSoundsEnabled(televisionNow(), storedValue());
}

export function currentXmbSoundsEnabled(isTelevision: boolean): boolean {
  if (typeof window === "undefined") return false;
  return readXmbSoundsEnabled(isTelevision, storedValue());
}

export function subscribeXmbSounds(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function noteXmbUserInput(): void {
  userActivated = true;
}

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const host = window as AudioWindow;
  if (!host._sharedAudioContext) {
    const Ctx = window.AudioContext;
    host._sharedAudioContext = new Ctx();
  }
  if (host._sharedAudioContext.state === "suspended") {
    void host._sharedAudioContext.resume().catch(() => undefined);
  }
  return host._sharedAudioContext;
}

export function preloadXmbSounds(): void {
  if (typeof window === "undefined" || loading) return;
  loading = (async () => {
    await Promise.all((Object.keys(URLS) as XmbCue[]).map(async (cue) => {
      if (raw.has(cue)) return;
      const response = await fetch(URLS[cue]);
      if (!response.ok) throw new Error(`Missing ${URLS[cue]}`);
      raw.set(cue, await response.arrayBuffer());
    }));
  })().catch(() => {
    loading = null;
  });
}

async function buffer(cue: XmbCue): Promise<AudioBuffer | null> {
  const existing = decoded.get(cue);
  if (existing) return existing;
  const ctx = context();
  if (!ctx) return null;
  preloadXmbSounds();
  await loading;
  const bytes = raw.get(cue);
  if (!bytes) return null;
  const copy = bytes.slice(0);
  const audio = await ctx.decodeAudioData(copy);
  decoded.set(cue, audio);
  return audio;
}

function start(cue: XmbCue, audio: AudioBuffer): void {
  const ctx = context();
  if (!ctx) return;
  const previous = playing.get(cue);
  if (previous) {
    try { previous.stop(); } catch { /* already ended */ }
  }
  const source = ctx.createBufferSource();
  source.buffer = audio;
  const gain = ctx.createGain();
  gain.gain.value = GAIN[cue];
  source.connect(gain);
  gain.connect(ctx.destination);
  source.onended = () => {
    if (playing.get(cue) === source) playing.delete(cue);
  };
  playing.set(cue, source);
  source.start();
  lastAt[cue] = performance.now();
}

export function playXmbCue(cue: XmbCue, repeat = false): void {
  if (typeof window === "undefined") return;
  const now = performance.now();
  if (!canPlayXmbCue({
    enabled: xmbSoundsEnabled(),
    hidden: document.hidden,
    userActivated,
    repeat,
    cue,
    now,
    lastAt: lastAt[cue],
  })) return;
  lastAt[cue] = now;
  void buffer(cue).then((audio) => {
    if (audio) start(cue, audio);
  }).catch(() => undefined);
}

/** Select waits a moment so opening a dialog can replace it with one confirm. */
export function playXmbSelect(repeat = false): void {
  if (repeat || typeof window === "undefined") return;
  window.clearTimeout(confirmTimer);
  confirmTimer = window.setTimeout(() => playXmbCue("confirm"), 50);
}

export function playXmbOpen(): void {
  if (typeof window === "undefined") return;
  window.clearTimeout(confirmTimer);
  playXmbCue("confirm");
}

export function setXmbSoundsEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(XMB_SOUND_STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // Private mode can reject storage. The in-memory listeners still update.
  }
  for (const listener of listeners) listener();
  if (!enabled) {
    window.clearTimeout(confirmTimer);
    return;
  }
  noteXmbUserInput();
  preloadXmbSounds();
  context();
  playXmbCue("confirm");
}
