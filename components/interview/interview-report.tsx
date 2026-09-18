import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { InterviewReport as Report } from "@/types";
import { Prose } from "@/components/common/prose";
import { Meter } from "@/components/progress/meter";
import { ordinal } from "@/lib/format";

/**
 * The closing report. Scores are there, but the comments are the point
 * (PRD section 17).
 */
export function InterviewReport({
  report,
  preparationId,
}: {
  report: Report;
  preparationId: string;
}) {
  return (
    <div className="animate-rise">
      <header className="mb-8">
        <p className="eyebrow">Interview summary</p>
        <p className="text-muted-foreground mt-3 text-[0.9375rem]">
          {report.questionsAnswered} question
          {report.questionsAnswered === 1 ? "" : "s"} answered
        </p>
        <Prose text={report.summary} size="large" className="mt-4" />
      </header>

      <section className="mb-9 divide-y">
        {report.scores.map((score) => (
          <div key={score.label} className="py-5 first:pt-0">
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-[0.9375rem] font-medium">{score.label}</p>
              <p className="numeral text-[1.125rem]">
                {score.score}
                <span className="text-muted-foreground text-[0.8125rem] font-normal">
                  /{score.outOf}
                </span>
              </p>
            </div>
            <Meter
              value={(score.score / score.outOf) * 100}
              className="mt-3 mb-3"
            />
            <p className="text-muted-foreground text-[0.9375rem] leading-relaxed">
              {score.comment}
            </p>
          </div>
        ))}
      </section>

      {report.strengths.length > 0 && (
        <section className="mb-9">
          <h2 className="eyebrow mb-3">What worked</h2>
          <ul className="space-y-2">
            {report.strengths.map((strength) => (
              <li key={strength} className="flex gap-2.5 text-[0.9375rem]">
                <span
                  aria-hidden
                  className="bg-brand mt-[0.55em] size-1 shrink-0 rounded-full"
                />
                {strength}
              </li>
            ))}
          </ul>
        </section>
      )}

      {report.areasToRevise.length > 0 && (
        <section className="mb-9">
          <h2 className="mb-3 text-[0.9375rem] font-medium">Areas to revise</h2>
          <ol className="divide-y">
            {report.areasToRevise.map((area, index) => (
              <li key={area.topic} className="flex gap-3 py-3.5">
                <span className="text-muted-foreground numeral w-7 shrink-0 pt-0.5 text-[0.8125rem]">
                  {ordinal(index)}
                </span>
                <div className="min-w-0">
                  <p className="text-[0.9375rem] font-medium">{area.topic}</p>
                  <p className="text-muted-foreground mt-0.5 text-[0.8125rem] leading-relaxed">
                    {area.why}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/preparations/${preparationId}/revision`}
          className="press bg-brand text-brand-foreground rounded-tight inline-flex h-11 items-center gap-2 px-5 text-sm font-medium shadow-soft"
        >
          Final review
          <ArrowRight className="size-4" aria-hidden />
        </Link>
        <Link
          href={`/preparations/${preparationId}/weak-areas`}
          className="press border-hairline bg-surface rounded-tight inline-flex h-11 items-center border px-4 text-sm font-medium"
        >
          Practise these
        </Link>
      </div>
    </div>
  );
}
