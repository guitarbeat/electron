import React from "react";
import { FilmIcon, StarIcon, TvIcon } from "../common/Icons.tsx";

interface PosterWrapProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const MediaCardPosterWrap = React.forwardRef<
  HTMLDivElement,
  PosterWrapProps
>(({ children, className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`media-card__poster-wrap ${className}`.trim()}
    {...props}
  >
    {children}
  </div>
));

MediaCardPosterWrap.displayName = "MediaCardPosterWrap";

interface CoverProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const MediaCardCover: React.FC<CoverProps> = ({
  children,
  className = "",
  ...props
}) => (
  <div className={`media-card__cover ${className}`.trim()} {...props}>
    {children}
  </div>
);

interface OverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const MediaCardOverlay: React.FC<OverlayProps> = ({
  children,
  className = "",
  ...props
}) => (
  <div className={`media-card__overlay ${className}`.trim()} {...props}>
    {children}
  </div>
);

interface TitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  as?: "h2" | "h3" | "h4";
}

export const MediaCardTitle: React.FC<TitleProps> = ({
  children,
  as: Tag = "h3",
  className = "",
  ...props
}) => (
  <Tag className={`media-card__title ${className}`.trim()} {...props}>
    {children}
  </Tag>
);

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  position?: "top-left" | "top-right";
}

export const MediaCardBadge: React.FC<BadgeProps> = ({
  children,
  position = "top-left",
  className = "",
  ...props
}) => (
  <div
    className={`media-card__badge media-card__badge--${position} ${className}`.trim()}
    {...props}
  >
    {children}
  </div>
);

interface ActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const MediaCardActions: React.FC<ActionsProps> = ({
  children,
  className = "",
  ...props
}) => (
  <div className={`media-card__actions ${className}`.trim()} {...props}>
    {children}
  </div>
);

interface InfoProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const MediaCardInfo: React.FC<InfoProps> = ({
  children,
  className = "",
  ...props
}) => (
  <div className={`media-card__info ${className}`.trim()} {...props}>
    {children}
  </div>
);

interface SubtextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export const MediaCardSubtext: React.FC<SubtextProps> = ({
  children,
  className = "",
  ...props
}) => (
  <p className={`media-card__subtext ${className}`.trim()} {...props}>
    {children}
  </p>
);

export const MediaCardRatingBadge: React.FC<{
  rating: string;
  className?: string;
}> = ({ rating, className = "" }) => (
  <div
    className={`media-card__rating-badge ${className}`.trim()}
    aria-label={`Rating: ${rating}`}
  >
    <StarIcon size={12} fill className="media-card__rating-badge-star" />
    <span className="media-card__rating-badge-score">{rating}</span>
  </div>
);

export const MediaCardSuccessBadge: React.FC<{
  eyebrow: string;
  title: string;
  icon?: React.ReactNode;
  className?: string;
}> = ({ eyebrow, title, icon, className = "" }) => (
  <div className={`media-card__success-badge ${className}`.trim()} aria-hidden>
    <span className="media-card__success-badge-icon">{icon}</span>
    <span className="media-card__success-badge-copy">
      <span className="media-card__success-badge-eyebrow">{eyebrow}</span>
      <span className="media-card__success-badge-title">{title}</span>
    </span>
  </div>
);

export const MediaCardStatusBadge: React.FC<{
  label: string;
  icon?: React.ReactNode;
  className?: string;
}> = ({ label, icon, className = "" }) => (
  <div className={`media-card__status-badge ${className}`.trim()}>
    {icon}
    {label}
  </div>
);

export const MediaCardTypeBadge: React.FC<{
  type: "movie" | "series";
  className?: string;
}> = ({ type, className = "" }) => (
  <div
    className={`media-card__type-badge media-card__type-badge--${type} ${className}`.trim()}
    aria-label={type === "series" ? "TV Series" : "Movie"}
  >
    <span className="media-card__type-badge-icon">
      {type === "series" ? <TvIcon size={12} /> : <FilmIcon size={12} />}
    </span>
    <span className="media-card__type-badge-label">
      {type === "series" ? "TV Series" : "Movie"}
    </span>
  </div>
);
