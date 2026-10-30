export type WatchArtworkStatus = "queue" | "watching" | "seen";

/** Frame the supplied transparent artwork without modifying its source pixels. */
export function WatchStatusArtwork({
  status,
  className,
  user,
}: {
  status: WatchArtworkStatus;
  className?: string;
  user?: "Aaron" | "Electra";
}) {
  const artwork = {
    queue: { width: 1693, height: 929, viewBox: "200 30 1300 860" },
    watching: { width: 1774, height: 887, viewBox: "230 60 1300 780" },
    seen: { width: 1538, height: 1022, viewBox: "60 10 1410 960" },
  }[status];
  return (
    <svg
      className={className}
      viewBox={user ? `${user === "Aaron" ? 52 : 157} 8 108 136` : artwork.viewBox}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <image
        href={user ? `/avatars/${status}_new_button.png` : `/avatars/${status}-artwork-transparent.png`}
        width={user ? 314 : artwork.width}
        height={user ? 215 : artwork.height}
      />
    </svg>
  );
}
