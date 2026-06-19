import React from "react";

interface RadialFabToggleIconProps {
  isActive: boolean;
  size?: number;
}

/**
 * FAB toggle glyph: brand gem (nav ◈) at rest, morphs to close when the fan opens.
 */
const RadialFabToggleIcon: React.FC<RadialFabToggleIconProps> = ({
  isActive,
  size = 22,
}) => (
  <span
    className={`toggle__icon${isActive ? " toggle__icon--open" : ""}`}
    aria-hidden="true"
  >
    <svg
      className="toggle__icon-layer toggle__icon-gem"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 3.25L19.35 8.65L17.65 17.35L12 20.75L6.35 17.35L4.65 8.65L12 3.25Z"
        fill="currentColor"
        fillOpacity="0.94"
      />
      <path
        d="M12 8.15a3.85 3.85 0 1 0 0 7.7a3.85 3.85 0 0 0 0-7.7Z"
        fill="currentColor"
        fillOpacity="0.26"
      />
      <path
        d="M6.35 17.35L12 10.65l5.65 6.7"
        stroke="currentColor"
        strokeOpacity="0.42"
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.65 8.65L12 11.55l7.35-2.9"
        stroke="currentColor"
        strokeOpacity="0.28"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 3.25v8.3M12 11.55v9.2"
        stroke="currentColor"
        strokeOpacity="0.18"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
    </svg>
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
