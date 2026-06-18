import React, { useRef, useEffect } from "react";
import "./MagicSlider.css";

interface MagicSliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  color?: string;
  ariaLabel?: string;
}

const MagicSlider: React.FC<MagicSliderProps> = ({
  value,
  min,
  max,
  onChange,
  color = "#f472b6",
  ariaLabel,
  className = "",
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const percentage = ((value - min) / (max - min)) * 100;

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.setProperty("--slider-percentage", `${percentage}%`);
      inputRef.current.style.setProperty("--slider-color", color);
    }
  }, [percentage, color]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  return (
    <div className={`magic-slider-wrapper ${className}`}>
      <input
        ref={inputRef}
        type="range"
        className="magic-slider"
        min={min}
        max={max}
        value={value}
        onChange={handleChange}
        aria-label={ariaLabel}
        {...props}
      />
      <div
        className="magic-slider__track-fill"
        style={{
          width: `${percentage}%`,
          backgroundColor: color,
        }}
        aria-hidden="true"
      />
    </div>
  );
};

export default MagicSlider;
