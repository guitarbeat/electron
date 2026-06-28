import React from "react";

interface RadialFabToggleIconProps {
  isActive: boolean;
  size?: number;
}

const RadialFabToggleIcon: React.FC<RadialFabToggleIconProps> = ({
  isActive,
  size = 22,
}) => (
  <span
    className={`toggle__icon${isActive ? " toggle__icon--open" : ""}`}
    aria-hidden="true"
  >
    {/* Sparkle — shown when closed */}
    <svg
      className="toggle__icon-layer toggle__icon-gem"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Four-point star */}
      <path
        d="M12 2.5 C12 2.5 13 9 13 12 C13 15 12 21.5 12 21.5 C12 21.5 11 15 11 12 C11 9 12 2.5 12 2.5 Z"
        fill="currentColor"
        fillOpacity="0.9"
      />
      <path
        d="M2.5 12 C2.5 12 9 11 12 11 C15 11 21.5 12 21.5 12 C21.5 12 15 13 12 13 C9 13 2.5 12 2.5 12 Z"
        fill="currentColor"
        fillOpacity="0.9"
      />
      {/* Diagonal rays — lighter */}
      <path
        d="M5.5 5.5 C5.5 5.5 10 10 12 12 C14 14 18.5 18.5 18.5 18.5"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M18.5 5.5 C18.5 5.5 14 10 12 12 C10 14 5.5 18.5 5.5 18.5"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Center dot */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" fillOpacity="0.6" />
    </svg>

    {/* Close X — shown when open */}
    <svg
      className="toggle__icon-layer toggle__icon-close"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.25 8.25l7.5 7.5M15.75 8.25l-7.5 7.5"
        stroke="currentColor"
        strokeWidth="2.15"
        strokeLinecap="round"
      />
    </svg>
  </span>
);

export default RadialFabToggleIcon;
