import { cn } from "@call-e-commonlot/ui/lib/utils";
import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      aria-label="CommonLot home"
      className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      href="/"
    >
      <svg aria-hidden="true" className="size-8 shrink-0" viewBox="0 0 32 32">
        <rect fill="currentColor" height="13" rx="4" width="13" x="2" y="2" />
        <rect
          fill="currentColor"
          height="13"
          opacity=".7"
          rx="4"
          width="13"
          x="17"
          y="2"
        />
        <rect
          fill="currentColor"
          height="13"
          opacity=".42"
          rx="4"
          width="13"
          x="9.5"
          y="17"
        />
      </svg>
      <span
        className={cn(
          "font-semibold text-lg tracking-[-0.025em]",
          compact && "sr-only"
        )}
      >
        CommonLot
      </span>
    </Link>
  );
}
