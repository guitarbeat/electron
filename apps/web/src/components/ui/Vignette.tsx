import React from 'react';

if (typeof document !== 'undefined') {
  void import('./vignette.css');
}

export interface VignetteProps {
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
  className?: string;
}

export const Vignette: React.FC<VignetteProps> = ({
  top = true,
  bottom = true,
  left = false,
  right = false,
  className = '',
}) => {
  return (
    <div className={`pointer-events-none fixed inset-0 z-50 ${className}`}>
      {top && <div className="vignette-top" aria-hidden="true" />}
      {bottom && <div className="vignette-bottom" aria-hidden="true" />}
      {left && <div className="vignette-left" aria-hidden="true" />}
      {right && <div className="vignette-right" aria-hidden="true" />}
    </div>
  );
};

export default Vignette;
