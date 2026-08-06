/**
 * FabToggleIcon — animated sparkle-to-X icon for the FAB toggle button.
 * Self-contained SVG with CSS class-driven transitions.
 */
import React from "react";

interface FabToggleIconProps {
  isActive: boolean;
  size?: number;
}

const FabToggleIcon: React.FC<FabToggleIconProps> = ({
  isActive,
  size = 24,
}) => (
  <span
    className={`toggle__icon${isActive ? " toggle__icon--open" : ""}`}
    aria-hidden="true"
  >
    {/* Sparkle star — shown when closed */}
    <svg
      className="toggle__icon-layer toggle__icon-gem"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="fab-halo-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="fab-star-grad" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>

      <circle cx="12" cy="12" r="9" stroke="url(#fab-star-grad)" strokeWidth="1.2" strokeOpacity="0.45" strokeDasharray="2 2" />
      <path d="M 12 2 Q 12 12 22 12 Q 12 12 12 22 Q 12 12 2 12 Q 12 12 12 2 Z" fill="url(#fab-star-grad)" filter="url(#fab-halo-glow)" />
      <path d="M 6.5 6.5 L 17.5 17.5 M 17.5 6.5 L 6.5 17.5" stroke="#ffffff" strokeOpacity="0.65" strokeWidth="1" strokeLinecap="round" />
      <circle cx="12" cy="12" r="1.8" fill="#ffffff" />
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
      <path d="M 7 7 L 17 17 M 17 7 L 7 17" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
);

export default FabToggleIcon;
