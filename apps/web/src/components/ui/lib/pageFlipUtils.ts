/** Builds the CSS box-shadow string scaled by intensity */
export function getShadowStyle(intensity: number): string {
  if (intensity <= 0) return "none";
  const offsetX = Math.round(4 * intensity);
  const offsetY = Math.round(6 * intensity);
  const blur = Math.round(34 * intensity);
  const alpha = Math.min(0.75 * intensity, 1);
  return `${offsetX}px ${offsetY}px ${blur}px rgba(0, 0, 0, ${alpha})`;
}
