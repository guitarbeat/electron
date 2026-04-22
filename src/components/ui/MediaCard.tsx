import React from 'react';

interface MediaCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'visited' | 'highlighted' | 'watched';
  hover?: boolean;
}

const MediaCard: React.FC<MediaCardProps> = ({
  children,
  variant = 'default',
  hover = true,
  className = '',
  ...props
}) => {
  const classes = [
    'media-card',
    variant !== 'default' && `media-card--${variant}`,
    hover && 'media-card--hover',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

interface PosterWrapProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const PosterWrap: React.FC<PosterWrapProps> = ({ children, className = '', ...props }) => (
  <div className={`media-card__poster-wrap ${className}`.trim()} {...props}>
    {children}
  </div>
);

interface CoverProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Cover: React.FC<CoverProps> = ({ children, className = '', ...props }) => (
  <div className={`media-card__cover ${className}`.trim()} {...props}>
    {children}
  </div>
);

interface OverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Overlay: React.FC<OverlayProps> = ({ children, className = '', ...props }) => (
  <div className={`media-card__overlay ${className}`.trim()} {...props}>
    {children}
  </div>
);

interface TitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  as?: 'h2' | 'h3' | 'h4';
}

const Title: React.FC<TitleProps> = ({ children, as: Tag = 'h3', className = '', ...props }) => (
  <Tag className={`media-card__title ${className}`.trim()} {...props}>
    {children}
  </Tag>
);

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  position?: 'top-left' | 'top-right';
}

const Badge: React.FC<BadgeProps> = ({
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

const Actions: React.FC<ActionsProps> = ({ children, className = '', ...props }) => (
  <div className={`media-card__actions ${className}`.trim()} {...props}>
    {children}
  </div>
);

interface InfoProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Info: React.FC<InfoProps> = ({ children, className = '', ...props }) => (
  <div className={`media-card__info ${className}`.trim()} {...props}>
    {children}
  </div>
);

interface SubtextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

const Subtext: React.FC<SubtextProps> = ({ children, className = '', ...props }) => (
  <p className={`media-card__subtext ${className}`.trim()} {...props}>
    {children}
  </p>
);

export default Object.assign(MediaCard, {
  PosterWrap,
  Cover,
  Overlay,
  Title,
  Badge,
  Actions,
  Info,
  Subtext,
});
