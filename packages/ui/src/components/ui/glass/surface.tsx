import { cn } from "@call-e-commonlot/ui/lib/utils";
import type { ComponentProps } from "react";

type GlassSurfaceProps = ComponentProps<"div"> & {
  strength?: "regular" | "strong";
};

function GlassSurface({
  className,
  strength = "regular",
  ...props
}: GlassSurfaceProps) {
  return (
    <div
      className={cn(
        "glass-surface",
        strength === "strong" && "glass-surface-strong",
        className
      )}
      data-slot="glass-surface"
      {...props}
    />
  );
}

export { GlassSurface };
