import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PREPARATION_TYPES } from "@/lib/constants";

/** The two large entry points from the dashboard (PRD section 6). */
export function TypeChoice() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {PREPARATION_TYPES.map((type) => (
        <Link
          key={type.value}
          href={`/preparations/new?type=${type.value}`}
          className="press border-hairline rounded-surface bg-surface group flex flex-col justify-between border p-5 shadow-soft sm:min-h-[8.5rem]"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-[1.0625rem] font-medium">
              {type.label} preparation
            </p>
            <ArrowUpRight
              className="text-muted-foreground group-hover:text-brand-text size-4 shrink-0 transition-colors"
              aria-hidden
            />
          </div>
          <p className="text-muted-foreground mt-3 text-[0.8125rem] leading-relaxed">
            {type.description}
          </p>
        </Link>
      ))}
    </div>
  );
}
