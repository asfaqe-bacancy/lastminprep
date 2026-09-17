import Link from "next/link";
import type { PreparationPlan } from "@/types";
import { SEGMENT_META } from "@/lib/constants";
import { formatMinutes, ordinal } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The minute-by-minute plan. Numbered sections rather than a row of icons
 * (design-system section 9).
 */
export function PlanTimeline({
  plan,
  preparationId,
  interactive = true,
  className,
}: {
  plan: PreparationPlan;
  preparationId?: string;
  interactive?: boolean;
  className?: string;
}) {
  return (
    <ol className={cn("divide-y", className)}>
      {plan.segments.map((segment, index) => {
        const meta = SEGMENT_META[segment.kind];
        const body = (
          <>
            <span className="text-muted-foreground numeral w-7 shrink-0 pt-0.5 text-[0.8125rem]">
              {ordinal(index)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.9375rem] font-medium">
                {meta.label}
              </span>
              <span className="text-muted-foreground mt-0.5 block text-[0.8125rem] leading-relaxed">
                {segment.description}
              </span>
            </span>
            <span className="numeral text-muted-foreground shrink-0 pt-0.5 text-[0.8125rem]">
              {formatMinutes(segment.minutes)}
            </span>
          </>
        );

        return (
          <li key={`${segment.kind}-${index}`}>
            {interactive && preparationId ? (
              <Link
                href={`/preparations/${preparationId}/${meta.href}`}
                className="hover:bg-surface-2 -mx-3 flex gap-3 rounded-tight px-3 py-3.5 transition-colors duration-150"
              >
                {body}
              </Link>
            ) : (
              <div className="flex gap-3 py-3.5">{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
