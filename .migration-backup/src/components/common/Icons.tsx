import React from "react";

interface IconProps {
  className?: string;
  style?: React.CSSProperties;
  size?: number | string;
}

const getIconStyles = (
  size?: number | string,
  style?: React.CSSProperties,
): React.CSSProperties => {
  if (!size) {
    const nextStyle = { ...(style || {}) };
    const hasWidth = nextStyle.width !== undefined;
    const hasHeight = nextStyle.height !== undefined;

    if (!hasWidth && !hasHeight) {
      nextStyle.width = "1.25rem";
      nextStyle.height = "1.25rem";
      return nextStyle;
    }

    if (hasWidth && !hasHeight) {
      nextStyle.height = nextStyle.width;
      return nextStyle;
    }

    if (!hasWidth && hasHeight) {
      nextStyle.width = nextStyle.height;
      return nextStyle;
    }

    return nextStyle;
  }

  const sizePx = typeof size === "number" ? `${size}px` : size;
  return { width: sizePx, height: sizePx, ...style };
};

interface StrokeIconProps extends IconProps {
  children: React.ReactNode;
}

const StrokeIcon: React.FC<StrokeIconProps> = ({
  className = "",
  style,
  size,
  children,
}) => (
  <svg
    className={className}
    style={getIconStyles(size, style)}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    {children}
  </svg>
);

const path = (d: string) => (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
);

export const CheckIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>{path("M5 13l4 4L19 7")}</StrokeIcon>
);

export const TrashIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    {path(
      "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
    )}
  </StrokeIcon>
);

export const EyeIcon: React.FC<IconProps> = (props: IconProps) => (
  <StrokeIcon {...props}>
    {path("M15 12a3 3 0 11-6 0 3 3 0 016 0z")}
    {path(
      "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
    )}
  </StrokeIcon>
);

export const EditIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    {path(
      "M16.862 4.487a2.1 2.1 0 113.03 2.91L9.65 18.001l-4.15 1.12 1.267-4.018L16.862 4.487z",
    )}
    {path("M15.5 5.75l2.75 2.75")}
  </StrokeIcon>
);

export const NoteIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    {path("M8 4h8a2 2 0 012 2v8l-4 4H8a2 2 0 01-2-2V6a2 2 0 012-2z")}
    {path("M14 18v-4h4")}
    {path("M9 9h6")}
    {path("M9 12h4")}
  </StrokeIcon>
);

export const MessageIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    {path("M7 8h10M7 12h7")}
    {path(
      "M5 5h14a2 2 0 012 2v8a2 2 0 01-2 2H9l-4 3v-3H5a2 2 0 01-2-2V7a2 2 0 012-2z",
    )}
  </StrokeIcon>
);

export const BrainIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    {path(
      "M9.5 5.5a2.5 2.5 0 015 0V6a2.5 2.5 0 012 4.002V10.5a2.5 2.5 0 01-2 4.45V15a3 3 0 01-6 0",
    )}
    {path("M9.5 6a2.5 2.5 0 00-2 4.002V10.5a2.5 2.5 0 002 4.45V15a3 3 0 006 0")}
    {path("M12 4v16")}
  </StrokeIcon>
);

export const SpinIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    {path("M12 3a9 9 0 109 9")}
    {path("M12 3v5")}
    {path("M12 12l4.5-2.5")}
    {path("M18 3v5h-5")}
  </StrokeIcon>
);

export const MagicWandIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    {path(
      "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
    )}
  </StrokeIcon>
);

export const QuickActionsIcon: React.FC<IconProps> = ({
  className = "w-6 h-6",
  style,
  size,
}) => (
  <svg
    className={className}
    style={getIconStyles(size, style)}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="4.75"
      y="5"
      width="14.5"
      height="3.2"
      rx="1.6"
      fill="currentColor"
      opacity="0.96"
    />
    <rect
      x="7.1"
      y="10.4"
      width="9.8"
      height="3.2"
      rx="1.6"
      fill="currentColor"
      opacity="0.76"
    />
    <rect
      x="4.75"
      y="15.8"
      width="14.5"
      height="3.2"
      rx="1.6"
      fill="currentColor"
      opacity="0.96"
    />
  </svg>
);

export const PlusIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>{path("M12 6v6m0 0v6m0-6h6m-6 0H6")}</StrokeIcon>
);

export const ShareIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    {path("M8.75 12a3.25 3.25 0 110-6.5 3.25 3.25 0 010 6.5z")}
    {path("M15.25 18.5a3.25 3.25 0 110-6.5 3.25 3.25 0 010 6.5z")}
    {path("M14.5 8.25l-4 2.5")}
    {path("M10.5 13.25l4 2.5")}
  </StrokeIcon>
);

export const ArrowLeftIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>{path("M10 19l-7-7m0 0l7-7m-7 7h18")}</StrokeIcon>
);

export const CrossIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>{path("M6 18L18 6M6 6l12 12")}</StrokeIcon>
);

export const StarIcon: React.FC<IconProps & { fill?: boolean }> = ({
  fill = false,
  ...props
}) => (
  <svg
    {...props}
    style={getIconStyles(props.size, props.style)}
    viewBox="0 0 24 24"
    fill={fill ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth={2}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
    />
  </svg>
);

export const PlayIcon: React.FC<IconProps> = (props) => (
  <svg
    {...props}
    style={getIconStyles(props.size, props.style)}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M8 5v14l11-7z" />
  </svg>
);

export const BookmarkIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    {path("M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z")}
  </StrokeIcon>
);

export const LockIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    <rect
      x="5"
      y="11"
      width="14"
      height="10"
      rx="2"
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
    />
    {path("M8 11V7a4 4 0 018 0v4")}
  </StrokeIcon>
);

export const LogoutIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    {path("M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4")}
    <polyline
      points="16,17 21,12 16,7"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <line
      x1="21"
      y1="12"
      x2="9"
      y2="12"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      fill="none"
    />
  </StrokeIcon>
);

export const SoundOnIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    {path("M11 5L6 9H3v6h3l5 4V5z")}
    {path("M15.54 8.46a5 5 0 010 7.07")}
    {path("M17.66 6.34a8 8 0 010 11.32")}
  </StrokeIcon>
);

export const SoundOffIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    {path("M11 5L6 9H3v6h3l5 4V5z")}
    {path("M23 9l-6 6")}
    {path("M17 9l6 6")}
  </StrokeIcon>
);

export const Spinner: React.FC<IconProps> = ({
  className = "w-6 h-6",
  style,
  size,
}) => (
  <svg
    className={`animate-spin ${className}`}
    style={getIconStyles(size, style)}
    fill="none"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);
