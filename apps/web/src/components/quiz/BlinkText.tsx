import React, { useEffect, useState } from "react";

const BLINK_COLORS = [
  "#ff0000",
  "#ff7700",
  "#ffff00",
  "#00cc00",
  "#0000ff",
  "#8b00ff",
];

interface BlinkTextProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const BlinkText: React.FC<BlinkTextProps> = ({ children, style = {} }) => {
  const [colorIdx, setColorIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setColorIdx((index) => (index + 1) % BLINK_COLORS.length),
      260,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <span
      className="quiz-retro-blink"
      style={{ color: BLINK_COLORS[colorIdx], ...style }}
    >
      {children}
    </span>
  );
};

export default BlinkText;
