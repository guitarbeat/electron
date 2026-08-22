import React from "react";
import { getStremioUrls, type StremioMediaObject } from "@/utils";

interface StremioButtonProps {
  movie: string | StremioMediaObject;
  variant?: "pill" | "icon" | "full";
  className?: string;
}

export const StremioIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="currentColor"
    className={`stremio-icon ${className}`}
    aria-hidden="true"
  >
    <path d="M 4 3 Q 4 2 5.5 3 L 20 11.2 Q 21.5 12 20 12.8 L 5.5 21 Q 4 22 4 21 Z" />
  </svg>
);

export const StremioButton: React.FC<StremioButtonProps> = ({
  movie,
  variant = "pill",
  className = "",
}) => {
  const urls = getStremioUrls(movie);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Stop propagation so parent card clicks don't open modals instead
    e.stopPropagation();
  };

  const movieTitle = typeof movie === "string" ? movie : movie.title;

  if (variant === "icon") {
    return (
      <a
        href={urls.appUrl}
        onClick={handleClick}
        className={`stremio-btn stremio-btn--icon ${className}`}
        title={`Open "${movieTitle}" in Stremio`}
        aria-label={`Open "${movieTitle}" in Stremio`}
        tabIndex={0}
      >
        <StremioIcon />
      </a>
    );
  }

  return (
    <a
      href={urls.appUrl}
      onClick={handleClick}
      className={`stremio-btn stremio-btn--${variant} ${className}`}
      title={
        urls.hasDirectImdbMatch
          ? `Launch "${movieTitle}" directly in Stremio`
          : `Search "${movieTitle}" in Stremio`
      }
      tabIndex={0}
    >
      <StremioIcon />
      <span className="stremio-btn__text">
        {variant === "full" ? "Watch on Stremio" : "Stremio"}
      </span>
    </a>
  );
};

export default StremioButton;
