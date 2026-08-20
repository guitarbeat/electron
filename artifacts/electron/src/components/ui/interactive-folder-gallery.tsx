import { useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/utils";

export interface GalleryPhoto {
  id: string | number;
  image: string;
}

const defaultPhotos: GalleryPhoto[] = [
  {
    id: 1,
    image:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 2,
    image:
      "https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 3,
    image:
      "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 4,
    image:
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 5,
    image:
      "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?q=80&w=800&auto=format&fit=crop",
  },
];

export interface InteractiveFolderGalleryProps {
  photos?: GalleryPhoto[];
  folderName?: string;
  dragHintText?: string;
  className?: string;
  /**
   * Accent color used for the glow, folder tab gradient, and photo border
   * highlights. Defaults to the CSS variable `--color-accent` so it
   * automatically tracks the active app theme (movies pink / places teal).
   */
  accentColor?: string;
}

function FolderBackBody({ isFolderOpen }: { isFolderOpen: boolean }) {
  return (
    <motion.div
      className="absolute bottom-6 w-80 h-56 drop-shadow-2xl"
      animate={{ opacity: isFolderOpen ? 0 : 1, scale: isFolderOpen ? 0.9 : 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
    >
      {/* Tab — accent-tinted so it reads as "this tab belongs to the app" */}
      <div
        className="absolute top-0 left-0 w-32 h-10 rounded-t-xl border-t border-l border-r"
        style={{
          background: `linear-gradient(to top, var(--color-surface-1), color-mix(in srgb, var(--gallery-accent) 18%, var(--color-surface-2)))`,
          borderColor: "var(--color-border)",
        }}
      />
      {/* Body */}
      <div
        className="absolute top-8 left-0 right-0 bottom-0 rounded-b-xl rounded-tr-xl border"
        style={{
          background: "var(--gradient-card)",
          borderColor: "var(--color-border)",
          boxShadow:
            "inset 0 0 40px rgba(0,0,0,0.55), var(--chrome-shadow-soft)",
        }}
      />
      {/* Inner depth layer */}
      <div
        className="absolute top-10 left-2 right-2 bottom-2 rounded-lg pointer-events-none"
        style={{ background: "var(--color-surface-0)", opacity: 0.7 }}
      />
      {/* Accent glow edge along the top of the folder body */}
      <div
        className="absolute top-8 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(to right, transparent, color-mix(in srgb, var(--gallery-accent) 60%, transparent), transparent)`,
        }}
      />
    </motion.div>
  );
}

function PhotoStack({
  photos,
  isFolderOpen,
  hoverFolder,
  setIsFolderOpen,
  setHoverFolder,
}: {
  photos: GalleryPhoto[];
  isFolderOpen: boolean;
  hoverFolder: boolean;
  setIsFolderOpen: (v: boolean) => void;
  setHoverFolder: (v: boolean) => void;
}) {
  return (
    <div className="absolute bottom-10 z-10 flex justify-center">
      {photos.map((photo, i) => {
        const offset = i - 2;

        const stackY = hoverFolder ? offset * -10 - 40 : offset * -5;
        const stackX = hoverFolder ? offset * 30 : offset * 3;
        const stackRotate = hoverFolder ? offset * 8 : offset * 3;
        const stackScale = 1 - Math.abs(offset) * 0.03;

        const openY = -130;
        const openX = offset * 130;
        const openRotate = 0;
        const openScale = 1.05;

        return (
          <motion.div
            key={photo.id}
            drag={isFolderOpen}
            dragSnapToOrigin
            onDragEnd={(_e, info) => {
              if (info.offset.y > 100 && isFolderOpen) {
                setIsFolderOpen(false);
                setHoverFolder(false);
              }
            }}
            className={cn(
              "absolute bottom-0 w-56 h-72 rounded-xl overflow-hidden origin-bottom",
              isFolderOpen
                ? "cursor-grab active:cursor-grabbing pointer-events-auto"
                : "pointer-events-none",
            )}
            style={{
              // Accent-tinted border instead of plain white/20
              border: `1px solid color-mix(in srgb, var(--gallery-accent) 35%, var(--color-border))`,
              boxShadow:
                "0 20px 40px rgba(0,0,0,0.5), var(--chrome-shadow-soft)",
            }}
            animate={
              !isFolderOpen
                ? {
                    y: stackY,
                    x: stackX,
                    rotate: stackRotate,
                    scale: stackScale,
                    zIndex: i + 10,
                  }
                : {
                    y: openY,
                    x: openX,
                    rotate: openRotate,
                    scale: openScale,
                    zIndex: 50,
                  }
            }
            whileHover={
              isFolderOpen
                ? {
                    scale: openScale + 0.05,
                    zIndex: 100,
                    // Subtle glow on hover matching the app accent
                    filter: `drop-shadow(0 0 12px color-mix(in srgb, var(--gallery-accent) 40%, transparent))`,
                  }
                : {}
            }
            whileDrag={
              isFolderOpen
                ? { scale: openScale + 0.1, rotate: 5, zIndex: 150 }
                : {}
            }
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          >
            <img
              src={photo.image}
              alt="Gallery item"
              className="w-full h-full object-cover pointer-events-none"
            />
            {/* Subtle gradient overlay so photos don't clash with the dark UI */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.32) 100%)",
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

function FolderFrontCover({
  isFolderOpen,
  hoverFolder,
  setHoverFolder,
  setIsFolderOpen,
  folderName,
  accentColor,
}: {
  isFolderOpen: boolean;
  hoverFolder: boolean;
  setHoverFolder: (v: boolean) => void;
  setIsFolderOpen: (v: boolean) => void;
  folderName: string;
  accentColor: string;
}) {
  return (
    <motion.div
      className="absolute bottom-0 w-[340px] h-44 cursor-pointer z-20 pointer-events-auto"
      style={{
        transformOrigin: "bottom",
        // Use the app's deep drop-shadow token for the lift effect
        filter: hoverFolder
          ? `drop-shadow(0 -18px 36px color-mix(in srgb, var(--gallery-accent) 22%, transparent))`
          : "drop-shadow(0 -12px 24px rgba(0,0,0,0.7))",
      }}
      animate={{
        opacity: isFolderOpen ? 0 : 1,
        rotateX: hoverFolder ? -25 : 0,
        y: hoverFolder ? 10 : 0,
        pointerEvents: isFolderOpen ? "none" : "auto",
      }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      onMouseEnter={() => setHoverFolder(true)}
      onMouseLeave={() => setHoverFolder(false)}
      onClick={() => setIsFolderOpen(true)}
    >
      <div
        className="w-full h-full rounded-2xl relative overflow-hidden flex items-end justify-center pb-8"
        style={{
          // Align with the modal's own glassmorphism panel surface
          background: "var(--chrome-surface)",
          border: `1px solid var(--color-border)`,
          boxShadow: "var(--chrome-shadow)",
        }}
      >
        {/* Chrome top-highlight matching the modal's own chrome line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "var(--chrome-highlight-top)" }}
        />

        {/* Subtle accent glow swept across the cover surface */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 60% 40% at 50% 100%, color-mix(in srgb, var(--gallery-accent) 12%, transparent), transparent)`,
          }}
        />

        {/* Folder name label — uses the app's chrome pill style */}
        <div
          className="relative px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 backdrop-blur-md"
          style={{
            background:
              "color-mix(in srgb, var(--color-surface-0) 80%, transparent)",
            border: `1px solid color-mix(in srgb, var(--gallery-accent) 30%, var(--color-border))`,
            boxShadow: `0 0 14px color-mix(in srgb, var(--gallery-accent) 18%, transparent)`,
          }}
        >
          {/* Small accent dot — matches the app's badge / pill aesthetic */}
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{
              background: accentColor,
              boxShadow: `0 0 6px ${accentColor}`,
            }}
          />
          <span
            className="text-sm font-semibold tracking-[var(--letter-spacing-wider)]"
            style={{
              color: "var(--color-text-primary)",
              fontFamily: "var(--font-body)",
              textTransform: "uppercase",
              fontSize: "0.72rem",
            }}
          >
            {folderName}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function DragHint({
  isFolderOpen,
  dragHintText,
}: {
  isFolderOpen: boolean;
  dragHintText: string;
}) {
  return (
    <motion.div
      animate={{ opacity: isFolderOpen ? 1 : 0, y: isFolderOpen ? 0 : 50 }}
      transition={{ type: "spring", stiffness: 280, damping: 28 }}
      className="absolute bottom-10 pointer-events-none"
      style={{
        padding: "0.6rem 1.5rem",
        borderRadius: "999px",
        // Matches the app's floating pill / chrome pill pattern
        background:
          "color-mix(in srgb, var(--color-surface-1) 72%, transparent)",
        border: `1px solid color-mix(in srgb, var(--gallery-accent) 25%, var(--color-border))`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        color: "var(--color-text-secondary)",
        fontFamily: "var(--font-body)",
        fontSize: "var(--font-size-xs)",
        fontWeight: 600,
        letterSpacing: "var(--letter-spacing-eyebrow)",
        textTransform: "uppercase",
      }}
    >
      {dragHintText}
    </motion.div>
  );
}

export function InteractiveFolderGallery({
  photos = defaultPhotos,
  folderName = "Photography.gallery",
  dragHintText = "Drag any photo down to close",
  className,
  accentColor = "var(--color-accent)",
}: InteractiveFolderGalleryProps) {
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const [hoverFolder, setHoverFolder] = useState(false);

  return (
    <div
      className={cn("w-full py-32 relative", className)}
      // Inform child inline styles of the resolved accent via a local custom
      // property so they can derive alpha-faded variants from it.
      style={{ ["--gallery-accent" as string]: accentColor }}
    >
      <div className="relative w-full min-h-[500px] flex flex-col items-center justify-center">
        {/* ── Folder shell ─────────────────────────────────────────────── */}
        <div className="relative w-[400px] h-[500px] flex justify-center pointer-events-none z-0">
          {/* Folder back body — uses the app's surface-1 token */}
          <FolderBackBody isFolderOpen={isFolderOpen} />

          {/* ── Photo stack ──────────────────────────────────────────── */}
          <PhotoStack
            photos={photos}
            isFolderOpen={isFolderOpen}
            hoverFolder={hoverFolder}
            setIsFolderOpen={setIsFolderOpen}
            setHoverFolder={setHoverFolder}
          />

          {/* ── Folder front cover ───────────────────────────────────── */}
          <FolderFrontCover
            isFolderOpen={isFolderOpen}
            hoverFolder={hoverFolder}
            setHoverFolder={setHoverFolder}
            setIsFolderOpen={setIsFolderOpen}
            folderName={folderName}
            accentColor={accentColor}
          />
        </div>

        {/* ── Drag-to-close hint ───────────────────────────────────────── */}
        <DragHint isFolderOpen={isFolderOpen} dragHintText={dragHintText} />
      </div>
    </div>
  );
}

export { InteractiveFolderGallery as Component };
