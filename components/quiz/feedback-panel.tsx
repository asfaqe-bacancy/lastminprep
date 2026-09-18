import type { QuizAnswer, SourceCitation } from "@/types";
import { Prose } from "@/components/common/prose";
import { SourceReference } from "@/components/sources/source-reference";
import { VERDICT_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Marking, as a person would put it: what you got right first, then what to
 * add, then where it came from. No colourful badges, no score confetti
 * (design-system section 11).
 */
export function FeedbackPanel({
  answer,
  sources,
  className,
}: {
  answer: QuizAnswer;
  sources?: SourceCitation[];
  className?: string;
}) {
  const meta = VERDICT_META[answer.verdict];

  return (
    <div className={cn("animate-rise", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[1.0625rem] font-medium">{meta.lead}</p>
        <p
          className={cn(
            "numeral shrink-0 text-[0.8125rem]",
            answer.verdict === "correct" ? "text-brand-text" : "text-muted-foreground",
          )}
        >
          {meta.label}
        </p>
      </div>

      <Prose text={answer.feedback} className="mt-3" />

      {answer.missing.length > 0 && (
        <div className="mt-5">
          <p className="eyebrow mb-2">
            {answer.missing.length === 1 ? "One thing to add" : "Things to add"}
          </p>
          <ul className="space-y-1.5">
            {answer.missing.map((item) => (
              <li key={item} className="flex gap-2.5 text-[0.9375rem]">
                <span
                  aria-hidden
                  className="bg-brand mt-[0.55em] size-1 shrink-0 rounded-full"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {sources && sources.length > 0 && <SourceReference sources={sources} />}
    </div>
  );
}
