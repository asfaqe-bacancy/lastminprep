import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CrashPrepBoard } from "@/types";
import { formatMinutes } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Last-minute triage (PRD section 18).
 *
 * The tiers are ranked by typography and a small star count rather than
 * colour, so it reads as an editorial priority list and not a warning panel.
 */
export function CrashBoard({
  board,
  preparationId,
}: {
  board: CrashPrepBoard;
  preparationId: string;
}) {
  const populated = board.tiers.filter((tier) => tier.topics.length > 0);

  return (
    <div className="animate-rise">
      <p className="max-w-[38ch] text-[1.25rem] leading-snug font-medium sm:text-[1.5rem]">
        {board.headline}
      </p>

      <div className="mt-10 space-y-10">
        {populated.map((tier) => (
          <section key={tier.priority}>
            <div className="mb-4 flex items-baseline gap-3">
              <h2
                className={cn(
                  "font-medium",
                  tier.priority === "must_know"
                    ? "text-[1.0625rem]"
                    : "text-[0.9375rem]",
                )}
              >
                {tier.label}
              </h2>
              <span
                className={cn(
                  "text-[0.75rem] tracking-[0.15em]",
                  tier.priority === "must_know"
                    ? "text-brand-text"
                    : "text-muted-foreground",
                )}
                aria-label={`${tier.stars} out of 5 priority`}
              >
                {"★".repeat(tier.stars)}
                <span className="opacity-30">{"★".repeat(5 - tier.stars)}</span>
              </span>
            </div>

            <ol className="divide-y">
              {tier.topics.map((topic) => (
                <li key={topic.name} className="flex gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "font-medium",
                        tier.priority === "must_know"
                          ? "text-[1.0625rem]"
                          : "text-[0.9375rem]",
                      )}
                    >
                      {topic.name}
                    </p>
                    <p className="text-muted-foreground mt-1 max-w-prose text-[0.8125rem] leading-relaxed">
                      {topic.why}
                    </p>
                  </div>
                  <span className="numeral text-muted-foreground shrink-0 pt-0.5 text-[0.8125rem]">
                    {formatMinutes(topic.minutes)}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <div className="mt-11 flex flex-wrap gap-3 border-t pt-8">
        <Link
          href={`/preparations/${preparationId}/learn`}
          className="press bg-brand text-brand-foreground rounded-tight inline-flex h-11 items-center gap-2 px-5 text-sm font-medium shadow-soft"
        >
          Start with the first one
          <ArrowRight className="size-4" aria-hidden />
        </Link>
        <Link
          href={`/preparations/${preparationId}/revision`}
          className="press border-hairline bg-surface rounded-tight inline-flex h-11 items-center border px-4 text-sm font-medium"
        >
          Skip to the final review
        </Link>
      </div>
    </div>
  );
}
