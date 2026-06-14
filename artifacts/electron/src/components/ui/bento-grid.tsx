import * as React from "react";
import { cn } from "@/lib/utils";

interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  rowHeight?: string;
}

const BentoGrid = React.forwardRef<HTMLDivElement, BentoGridProps>(
  ({ className, children, rowHeight = "18rem", style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("grid w-full grid-cols-1 gap-3 md:grid-cols-3", className)}
        style={{ gridAutoRows: rowHeight, ...style }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
BentoGrid.displayName = "BentoGrid";

interface BentoGridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  /** Background layer — fills the full card behind the text overlay */
  header?: React.ReactNode;
  icon?: React.ReactNode;
}

const BentoGridItem = React.forwardRef<HTMLDivElement, BentoGridItemProps>(
  ({ className, title, description, header, icon, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "group relative overflow-hidden rounded-xl border border-white/15 shadow-sm transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.02] hover:border-white/30",
          className
        )}
        style={{ minHeight: "8rem", ...style }}
        {...props}
      >
        {/* Background: fills entire card */}
        {header && (
          <div className="absolute inset-0 overflow-hidden rounded-xl">
            {header}
          </div>
        )}

        {/* Dark scrim so text is always readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent rounded-xl" />

        {/* Text overlay — pinned to bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3 transition-transform duration-200 group-hover:translate-y-[-2px]">
          <div className="flex items-center gap-1.5 font-sans text-sm font-bold text-white drop-shadow">
            {icon && <span className="text-base">{icon}</span>}
            {title}
          </div>
          <p className="mt-0.5 font-sans text-xs text-white/70 drop-shadow">
            {description}
          </p>
        </div>
      </div>
    );
  }
);
BentoGridItem.displayName = "BentoGridItem";

export { BentoGrid, BentoGridItem };
