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
    queue: {
      width: 1693,
      height: 929,
      viewBox: "200 30 1300 860",
      aaronViewBox: "200 30 670 860",
      electraViewBox: "830 30 670 860",
    },
    watching: {
      width: 1774,
      height: 887,
      viewBox: "230 60 1300 780",
      aaronViewBox: "230 60 670 780",
      electraViewBox: "860 60 670 780",
    },
    seen: {
      width: 1538,
      height: 1022,
      viewBox: "60 10 1410 960",
      aaronViewBox: "60 10 715 960",
      electraViewBox: "755 10 715 960",
    },
  }[status];

  const resolvedViewBox =
    user === "Aaron"
      ? artwork.aaronViewBox
      : user === "Electra"
        ? artwork.electraViewBox
        : artwork.viewBox;

  return (
    <svg
      className={className}
      viewBox={resolvedViewBox}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <image
        href={`/avatars/${status}-artwork-transparent.png`}
        width={artwork.width}
        height={artwork.height}
      />
    </svg>
  );
}

