import React from "react";

export const MoviesEmptyIllustration: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <svg
    viewBox="0 0 200 200"
    className={`y2k-illustration ${className}`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="movieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f472b6" />
        <stop offset="50%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#38bdf8" />
      </linearGradient>
      <linearGradient id="cdGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
        <stop offset="50%" stopColor="rgba(255,255,255,0.6)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* Grid Background */}
    <g className="y2k-grid" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="1">
      <path d="M 0,150 L 200,150 M 0,165 L 200,165 M 0,185 L 200,185" />
      <path d="M 100,150 L 20,200 M 100,150 L 60,200 M 100,150 L 100,200 M 100,150 L 140,200 M 100,150 L 180,200" />
    </g>

    {/* Sparkles */}
    <path
      className="y2k-sparkle"
      d="M30,50 Q40,50 40,40 Q40,50 50,50 Q40,50 40,60 Q40,50 30,50 Z"
      fill="#f472b6"
      filter="url(#glow)"
    />
    <path
      className="y2k-sparkle"
      d="M160,80 Q165,80 165,75 Q165,80 170,80 Q165,80 165,85 Q165,80 160,80 Z"
      fill="#38bdf8"
      filter="url(#glow)"
      style={{ animationDelay: "0.5s" }}
    />

    {/* CD / DVD Disc */}
    <g className="y2k-disc">
      <circle
        cx="100"
        cy="90"
        r="45"
        fill="url(#movieGrad)"
        filter="url(#glow)"
        opacity="0.8"
      />
      <circle
        cx="100"
        cy="90"
        r="45"
        fill="none"
        stroke="url(#cdGrad)"
        strokeWidth="2"
      />
      <circle
        cx="100"
        cy="90"
        r="15"
        fill="#090d16"
        stroke="url(#cdGrad)"
        strokeWidth="2"
      />
      <circle
        cx="100"
        cy="90"
        r="5"
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1"
      />
      <path
        d="M 100,45 A 45,45 0 0,1 145,90"
        fill="none"
        stroke="rgba(255,255,255,0.8)"
        strokeWidth="1"
        opacity="0.5"
      />
      <path
        d="M 55,90 A 45,45 0 0,0 100,135"
        fill="none"
        stroke="rgba(255,255,255,0.8)"
        strokeWidth="1"
        opacity="0.5"
      />
    </g>
  </svg>
);

export const PlacesEmptyIllustration: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <svg
    viewBox="0 0 200 200"
    className={`y2k-illustration ${className}`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="placesGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2dd4bf" />
        <stop offset="100%" stopColor="#a78bfa" />
      </linearGradient>
      <filter id="glowPlaces">
        <feGaussianBlur stdDeviation="5" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* Grid Background */}
    <g className="y2k-grid" stroke="rgba(45, 212, 191, 0.2)" strokeWidth="1">
      <path d="M 0,150 L 200,150 M 0,165 L 200,165 M 0,185 L 200,185" />
      <path d="M 100,150 L 20,200 M 100,150 L 60,200 M 100,150 L 100,200 M 100,150 L 140,200 M 100,150 L 180,200" />
    </g>

    {/* Sparkles */}
    <path
      className="y2k-sparkle"
      d="M150,40 Q160,40 160,30 Q160,40 170,40 Q160,40 160,50 Q160,40 150,40 Z"
      fill="#2dd4bf"
      filter="url(#glowPlaces)"
    />
    <path
      className="y2k-sparkle"
      d="M40,110 Q45,110 45,105 Q45,110 50,110 Q45,110 45,115 Q45,110 40,110 Z"
      fill="#a78bfa"
      filter="url(#glowPlaces)"
      style={{ animationDelay: "0.3s" }}
    />

    {/* Wireframe Globe */}
    <g
      className="y2k-globe"
      fill="none"
      stroke="url(#placesGrad)"
      strokeWidth="2"
      filter="url(#glowPlaces)"
    >
      <circle cx="100" cy="85" r="45" opacity="0.8" />
      <ellipse cx="100" cy="85" rx="45" ry="18" opacity="0.6" />
      <ellipse cx="100" cy="85" rx="18" ry="45" opacity="0.6" />
      <path d="M 55,85 L 145,85" opacity="0.5" />
      <path d="M 100,40 L 100,130" opacity="0.5" />
    </g>

    {/* Abstract UI Window */}
    <g className="y2k-window" transform="translate(120, 100)">
      <rect
        x="0"
        y="0"
        width="40"
        height="30"
        rx="3"
        fill="rgba(13, 31, 38, 0.8)"
        stroke="#2dd4bf"
        strokeWidth="1"
        filter="url(#glowPlaces)"
      />
      <rect x="0" y="0" width="40" height="8" rx="3" fill="#2dd4bf" />
      <circle cx="33" cy="4" r="2" fill="#090d16" />
      <line x1="5" y1="15" x2="35" y2="15" stroke="#a78bfa" strokeWidth="1" />
      <line x1="5" y1="20" x2="25" y2="20" stroke="#a78bfa" strokeWidth="1" />
    </g>
  </svg>
);
