import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Preparation } from "@/types";
import { Meter } from "@/components/progress/meter";
import { formatMinutes, typeLabel } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/constants";

/**
 * The one large, tactile surface on the dashboard. It answers "what should I
 * do next?" before anything else on the screen (design-system section 7).
 */
export function PreparationCard({ preparation }: { preparation: Preparation }) {
  const resumeHref =
    preparation.status === "completed"
      ? `/preparations/${preparation.id}/revision`
      : `/preparations/${preparation.id}`;

  return (
    <Link
      href={resumeHref}
      className="press border-hairline rounded-feature bg-surface group block border p-6 shadow-raised sm:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <p className="eyebrow">
          {typeLabel(preparation.type)} ·{" "}
          {formatMinutes(preparation.availableMinutes)}
        </p>
        <span className="border-hairline text-muted-foreground rounded-full border px-2.5 py-0.5 text-[0.6875rem]">
          {STATUS_LABELS[preparation.status]}
        </span>
      </div>

      <h2 className="mt-4 text-[1.5rem] leading-tight font-medium sm:text-[1.875rem]">
        {preparation.title}
      </h2>

      {preparation.plan?.headline && (
        <p className="text-muted-foreground mt-2 text-[0.9375rem] leading-relaxed">
          {preparation.plan.headline}
        </p>
      )}

      <Meter
        value={preparation.progressPercent}
        label="Prepared"
        valueLabel={`${preparation.progressPercent}%`}
        className="mt-7"
      />

      <p className="text-brand-text mt-7 inline-flex items-center gap-1.5 text-[0.9375rem] font-medium">
        {preparation.status === "completed"
          ? "See your review"
          : preparation.progressPercent > 0
            ? "Continue"
            : "Start"}
        <ArrowRight
          className="size-4 transition-transform duration-200 ease-[var(--ease-ios)] group-hover:translate-x-0.5"
          aria-hidden
        />
      </p>
    </Link>
  );
}
