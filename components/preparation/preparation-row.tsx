import Link from "next/link";
import type { Preparation } from "@/types";
import { formatMinutes, formatRelative, typeLabel } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Minimal list item: border and spacing, not another card (design-system 22). */
export function PreparationRow({
  preparation,
  showTime = true,
}: {
  preparation: Preparation;
  showTime?: boolean;
}) {
  return (
    <Link
      href={`/preparations/${preparation.id}`}
      className="hover:bg-surface-2 -mx-3 flex items-center gap-4 rounded-tight px-3 py-3.5 transition-colors duration-150"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.9375rem] font-medium">
          {preparation.title}
        </p>
        <p className="text-muted-foreground mt-0.5 truncate text-[0.8125rem]">
          {typeLabel(preparation.type)} ·{" "}
          {formatMinutes(preparation.availableMinutes)}
          {showTime && ` · ${formatRelative(preparation.createdAt)}`}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={cn(
            "numeral text-[0.9375rem]",
            preparation.status === "completed" && "text-muted-foreground",
          )}
        >
          {preparation.status === "completed"
            ? STATUS_LABELS.completed
            : `${preparation.progressPercent}%`}
        </p>
      </div>
    </Link>
  );
}
