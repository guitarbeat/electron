import React from "react";

if (typeof document !== "undefined") {
  void import("./vignette.css");
}

export interface VignetteProps {
  /** Whether to render the top edge blur. Defaults to true. */
  top?: boolean;
  /** Whether to render the bottom edge blur. Defaults to true. */
  bottom?: boolean;
  /** Whether to render the left edge blur. Defaults to false. */
  left?: boolean;
  /** Whether to render the right edge blur. Defaults to false. */
  right?: boolean;
  /** Optional custom class name for the wrapper element. */
  className?: string;
}

/**
 * Vignette
 *
 * Renders fixed, frosted gradient edge blurs along viewport edges.
 * Helps media content scroll under top/bottom UI elements seamlessly.
 */
export const Vignette: React.FC<VignetteProps> = ({
  top = true,
  bottom = true,
  left = false,
  right = false,
  className = "",
}) => {
  return (
    <div className={`pointer-events-none fixed inset-0 z-[15] ${className}`.trim()}>
      {top ? <div className="vignette-top" aria-hidden="true" /> : null}
      {bottom ? <div className="vignette-bottom" aria-hidden="true" /> : null}
      {left ? <div className="vignette-left" aria-hidden="true" /> : null}
      {right ? <div className="vignette-right" aria-hidden="true" /> : null}
    </div>
  );
};

export default Vignette;
