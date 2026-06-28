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
        d="M12 20.5C12 20.5 3.5 14.5 3.5 8.5C3.5 6.015 5.515 4 8 4C9.573 4 10.965 4.8 11.75 6.015C11.875 6.208 12.125 6.208 12.25 6.015C13.035 4.8 14.427 4 16 4C18.485 4 20.5 6.015 20.5 8.5C20.5 14.5 12 20.5 12 20.5Z"
        fill="currentColor"
        fillOpacity="0.92"
      />
      <path
        d="M12 20.5C12 20.5 3.5 14.5 3.5 8.5C3.5 6.015 5.515 4 8 4C9.573 4 10.965 4.8 11.75 6.015C11.875 6.208 12.125 6.208 12.25 6.015C13.035 4.8 14.427 4 16 4C18.485 4 20.5 6.015 20.5 8.5C20.5 14.5 12 20.5 12 20.5Z"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="0.75"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 8.5C7.5 7.12 8.62 6 10 6"
        stroke="white"
        strokeOpacity="0.28"
        strokeWidth="1.1"
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
