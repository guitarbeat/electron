import React from "react";
import { useCardTilt } from "@/hooks/useCardTilt";

interface CardTiltShellProps {
  children: React.ReactNode;
  className?: string;
}

export const CardTiltSheen: React.FC = () => (
  <div className="card-tilt-sheen" aria-hidden="true" />
);

const CardTiltShell: React.FC<CardTiltShellProps> = ({
  children,
  className,
}) => {
  const tilt = useCardTilt();

  return (
    <div
      ref={tilt.ref}
      className={["card-tilt-wrap", className].filter(Boolean).join(" ")}
      onMouseEnter={tilt.onMouseEnter}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
    >
      {children}
    </div>
  );
};

export default CardTiltShell;
