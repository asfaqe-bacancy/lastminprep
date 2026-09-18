import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { PlanSegmentKind, Preparation } from "@/types";
import { SEGMENT_META } from "@/lib/constants";
import { formatMinutes, typeLabel } from "@/lib/format";
import { Timer } from "./timer";
import { cn } from "@/lib/utils";

/**
 * Shared chrome for the working screens: where you are, how long is left, and
 * a quiet way to move between the segments of the plan.
 */
export function SessionHeader({
  preparation,
  current,
  title,
}: {
  preparation: Preparation;
  current: PlanSegmentKind;
  title?: string;
}) {
  const segments = preparation.plan?.segments ?? [];
  const meta = SEGMENT_META[current];

  return (
    <header className="mb-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href={`/preparations/${preparation.id}`}
            className="text-muted-foreground hover:text-foreground -ml-1.5 inline-flex items-center gap-1 rounded-tight py-1 pr-2 pl-1 text-[0.8125rem] transition-colors"
          >
            <ChevronLeft className="size-3.5" aria-hidden />
            {preparation.title}
          </Link>
          <p className="eyebrow mt-3">
            {meta.label} · {typeLabel(preparation.type)}
          </p>
          <h1 className="mt-2 text-[1.75rem] leading-tight font-medium sm:text-[2.125rem]">
            {title ?? meta.label}
          </h1>
        </div>

        <Timer
          availableMinutes={preparation.availableMinutes}
          startedAt={preparation.startedAt}
          className="shrink-0 pt-1"
        />
      </div>

      {segments.length > 1 && (
        <nav aria-label="Plan segments" className="mt-6 -mx-1">
          <ul className="flex flex-wrap gap-1">
            {segments.map((segment) => {
              const segmentMeta = SEGMENT_META[segment.kind];
              const active = segment.kind === current;
              return (
                <li key={segment.kind}>
                  <Link
                    href={`/preparations/${preparation.id}/${segmentMeta.href}`}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-8 items-center gap-1.5 rounded-full px-3 text-[0.8125rem] transition-colors duration-150",
                      active
                        ? "bg-surface-2 text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {segmentMeta.label}
                    <span className="text-muted-foreground numeral text-[0.6875rem]">
                      {formatMinutes(segment.minutes)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
}
