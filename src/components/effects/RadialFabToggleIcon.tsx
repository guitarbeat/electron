import React from "react";

interface RadialFabToggleIconProps {
  isActive: boolean;
  size?: number;
}

const RadialFabToggleIcon: React.FC<RadialFabToggleIconProps> = ({
  isActive,
  size = 24,
}) => (
  <span
    className={`toggle__icon${isActive ? " toggle__icon--open" : ""}`}
    aria-hidden="true"
  >
    {/* Glassmorphic Sparkle Star — shown when closed */}
    <svg
      className="toggle__icon-layer toggle__icon-gem"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="halo-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="star-grad" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>

      {/* Orbital Glass Ring */}
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="url(#star-grad)"
        strokeWidth="1.2"
        strokeOpacity="0.45"
        strokeDasharray="2 2"
      />

      {/* Primary Four-pointed Star */}
      <path
        d="M12 2C12 2 13.2 8.8 13.2 12C13.2 15.2 12 22 12 22C12 22 10.8 15.2 10.8 12C10.8 8.8 12 2Z"
        fill="url(#star-grad)"
        filter="url(#halo-glow)"
      />
      <path
        d="M2 12C2 12 8.8 10.8 12 10.8C15.2 10.8 22 12 22 12C22 12 15.2 13.2 12 13.2C8.8 13.2 2 12 2 12Z"
        fill="url(#star-grad)"
        filter="url(#halo-glow)"
      />

      {/* Diagonal Sparkle Rays */}
      <path
        d="M6.5 6.5L17.5 17.5M17.5 6.5L6.5 17.5"
        stroke="#ffffff"
        strokeOpacity="0.65"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Luminous Center Core */}
      <circle cx="12" cy="12" r="1.8" fill="#ffffff" />
    </svg>

    {/* Close Cross (X) — shown when open */}
    <svg
      className="toggle__icon-layer toggle__icon-close"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7 7L17 17M17 7L7 17"
        stroke="#ffffff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);

export default RadialFabToggleIcon;
