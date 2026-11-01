/**
 * Playful touches for the Settings sheet: a colour and a little icon per genre, and a pixel
 * confetti burst for Pick a movie.
 */

export interface GenreLook {
  emoji: string;
  /** Hue (0–360) the chip is tinted with. */
  hue: number;
}

const GENRE_LOOKS: Record<string, GenreLook> = {
  action: { emoji: "💥", hue: 8 },
  adventure: { emoji: "🧭", hue: 32 },
  animation: { emoji: "🎨", hue: 285 },
  biography: { emoji: "📖", hue: 25 },
  comedy: { emoji: "😂", hue: 48 },
  crime: { emoji: "🕵️", hue: 220 },
  documentary: { emoji: "🎥", hue: 190 },
  drama: { emoji: "🎭", hue: 330 },
  family: { emoji: "🏡", hue: 135 },
  fantasy: { emoji: "🧚", hue: 265 },
  history: { emoji: "📜", hue: 36 },
  horror: { emoji: "👻", hue: 275 },
  music: { emoji: "🎵", hue: 305 },
  musical: { emoji: "🎶", hue: 305 },
  mystery: { emoji: "🔍", hue: 240 },
  romance: { emoji: "💘", hue: 345 },
  "sci-fi": { emoji: "🚀", hue: 200 },
  "science fiction": { emoji: "🚀", hue: 200 },
  sport: { emoji: "⚽", hue: 115 },
  thriller: { emoji: "🔪", hue: 355 },
  war: { emoji: "⚔️", hue: 18 },
  western: { emoji: "🤠", hue: 28 },
};

/** The look for a genre chip; unknown genres get a stable hue from their name. */
export function getGenreLook(genre: string): GenreLook {
  const key = genre.trim().toLowerCase();
  const known = GENRE_LOOKS[key];
  if (known) return known;
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return { emoji: "🎬", hue: hash };
}

const CONFETTI_COLORS = ["#f5c451", "#38bdf8", "#f472b6", "#1f7a6d", "#f7f3e8", "#e2a93a"];
const CONFETTI_PIECES = 16;
const CONFETTI_MS = 900;

/**
 * A short burst of square pixel confetti from the middle of `origin`. It lives on the body so it
 * outlasts the Settings sheet closing. Skipped for reduced motion and on TV.
 */
export function burstConfetti(origin: Element | null) {
  if (!origin || typeof window === "undefined" || typeof document === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const root = document.documentElement;
  if (root.classList.contains("is-tv-runtime") || root.classList.contains("is-silk-browser")) return;
  const rect = origin.getBoundingClientRect();
  const burst = document.createElement("div");
  burst.className = "settings-confetti";
  burst.setAttribute("aria-hidden", "true");
  burst.style.left = `${rect.left + rect.width / 2}px`;
  burst.style.top = `${rect.top + rect.height / 2}px`;
  for (let index = 0; index < CONFETTI_PIECES; index += 1) {
    const piece = document.createElement("i");
    const angle = (index / CONFETTI_PIECES) * Math.PI * 2 + Math.random() * 0.4;
    const distance = 60 + Math.random() * 70;
    piece.style.setProperty("--dx", `${Math.round(Math.cos(angle) * distance)}px`);
    piece.style.setProperty("--dy", `${Math.round(Math.sin(angle) * distance - 30)}px`);
    piece.style.setProperty("--spin", `${Math.round(Math.random() * 540 - 270)}deg`);
    piece.style.background = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
    burst.appendChild(piece);
  }
  document.body.appendChild(burst);
  window.setTimeout(() => burst.remove(), CONFETTI_MS);
}
