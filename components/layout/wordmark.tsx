import Link from "next/link";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

/**
 * The mark is two stacked bars that read as a countdown rather than a logo —
 * no sparkle, no brain (design-system section 18).
 */
export function Wordmark({
  className,
  href = "/dashboard",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-2.5 rounded-tight -m-1 p-1 font-medium tracking-[-0.02em]",
        className,
      )}
    >
      <span
        aria-hidden
        className="bg-ink flex size-7 flex-col items-center justify-center gap-[3px] rounded-[9px]"
      >
        <span className="bg-brand h-[3px] w-3.5 rounded-full" />
        <span className="bg-ink-foreground/45 h-[3px] w-2 rounded-full" />
      </span>
      <span className="text-[0.975rem]">{APP_NAME}</span>
    </Link>
  );
}
