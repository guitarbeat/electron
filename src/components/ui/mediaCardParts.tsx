import React from 'react';

interface PosterWrapProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const MediaCardPosterWrap: React.FC<PosterWrapProps> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`media-card__poster-wrap ${className}`.trim()} {...props}>
    {children}
  </div>
);

interface CoverProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const MediaCardCover: React.FC<CoverProps> = ({
  children,
  className = '',
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
  className = '',
  ...props
}) => (
  <div className={`media-card__overlay ${className}`.trim()} {...props}>
    {children}
  </div>
);

interface TitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  as?: 'h2' | 'h3' | 'h4';
}

export const MediaCardTitle: React.FC<TitleProps> = ({
  children,
  as: Tag = 'h3',
  className = '',
  ...props
}) => (
  <Tag className={`media-card__title ${className}`.trim()} {...props}>
    {children}
  </Tag>
);

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  position?: 'top-left' | 'top-right';
}

export const MediaCardBadge: React.FC<BadgeProps> = ({
  children,
  position = 'top-left',
  className = '',
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
  className = '',
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
  className = '',
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
  className = '',
  ...props
}) => (
  <p className={`media-card__subtext ${className}`.trim()} {...props}>
    {children}
  </p>
);
