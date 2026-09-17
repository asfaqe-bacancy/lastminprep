import Link from "next/link";
import { cn } from "@/lib/utils";

/** Empty states earn their space by saying what to do next (design-system 21). */
export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-hairline rounded-surface flex flex-col items-center border border-dashed px-6 py-14 text-center",
        className,
      )}
    >
      <p className="text-[1.0625rem] font-medium">{title}</p>
      {description && (
        <p className="text-muted-foreground mt-2 max-w-[28ch] text-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <Link
          href={action.href}
          className="press bg-brand text-brand-foreground rounded-tight mt-6 inline-flex h-10 items-center px-4 text-sm font-medium shadow-soft"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
