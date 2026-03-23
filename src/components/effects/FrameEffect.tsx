import React from 'react';

interface FrameEffectProps {
  children: React.ReactNode;
}

const FrameEffect: React.FC<FrameEffectProps> = ({ children }) => (
  <div className="frame-effect">
    <div className="frame-effect__content">{children}</div>
    <div className="frame-effect__overlay" aria-hidden="true">
      <div className="frame-effect__inner" />
    </div>
  </div>
);

export default FrameEffect;
