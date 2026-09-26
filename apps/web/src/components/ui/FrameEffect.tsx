import React from "react";

if (typeof document !== "undefined") {
  void import("./frame-effect.css");
}

export interface FrameEffectProps {
  children?: React.ReactNode;
  borderWidth?: string;
  color?: string;
  borderRadius?: string;
  zIndex?: number;
  className?: string;
}

/**
 * FrameEffect / ViewportFrame
 *
 * Implements the signature rounded viewport border frame from Aaron Woods'
 * personal website (https://woods.engineer).
 *
 * Geometry:
 * - Fixed full-viewport framing overlay (100dvh for mobile chrome adaptation)
 * - 7px solid border (responsive 5px on narrow screens)
 * - 20px rounded border edge via ::after pseudo-element with negative margin matching border width
 * - mix-blend-mode: difference for crisp, adaptive contrast over dark and light canvases
 * - pointer-events: none to guarantee zero interference with underlying interactions
 */
export const FrameEffect: React.FC<FrameEffectProps> = ({
  children,
  borderWidth,
  color,
  borderRadius,
  zIndex,
  className = "",
}) => {
  const customStyles: Record<string, string | number> = {};
  if (borderWidth) customStyles["--frame-border-width"] = borderWidth;
  if (color) customStyles["--frame-color"] = color;
  if (borderRadius) customStyles["--frame-border-radius"] = borderRadius;
  if (zIndex !== undefined) customStyles["--z-index-frame"] = zIndex;

  const frameElement = (
    <div
      className={`viewport-frame ${className}`.trim()}
      style={customStyles as React.CSSProperties}
      aria-hidden="true"
      data-testid="viewport-frame"
    />
  );

  if (!children) {
    return frameElement;
  }

  return (
    <div className="frame-effect-root">
      <div className="frame-effect-content">{children}</div>
      {frameElement}
    </div>
  );
};

export const ViewportFrame = FrameEffect;
export default FrameEffect;
