/**
 * Fixed edge vignettes — parity with personal-website `Layout` (vignette-top/bottom/left/right).
 * @see https://github.com/guitarbeat/personal-website/blob/main/src/sass/theme/_vignette.scss
 */
export default function VignetteOverlay() {
  return (
    <>
      <div className="vignette-top" aria-hidden />
      <div className="vignette-bottom" aria-hidden />
      <div className="vignette-left" aria-hidden />
      <div className="vignette-right" aria-hidden />
    </>
  );
}
