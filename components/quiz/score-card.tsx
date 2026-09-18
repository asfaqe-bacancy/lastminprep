"use client";

import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import type { QuizAnswer } from "@/types";
import { ProgressRing } from "@/components/progress/progress-ring";

/**
 * Where a round landed. Numbers are small; the sentence does the work.
 */
export function ScoreCard({
  preparationId,
  results,
  onContinue,
  generating,
}: {
  preparationId: string;
  results: QuizAnswer[];
  onContinue: () => void;
  generating: boolean;
}) {
  const answered = results.length;
  const average =
    answered > 0
      ? Math.round(
          results.reduce((sum, result) => sum + result.score, 0) / answered,
        )
      : 0;
  const correct = results.filter((result) => result.verdict === "correct").length;

  return (
    <div>
      <div className="border-hairline rounded-surface bg-surface flex flex-wrap items-center gap-7 border p-6">
        <ProgressRing value={average} size={104} caption="average" />
        <div className="min-w-[12rem] flex-1">
          <p className="text-[1.0625rem] font-medium">
            {average >= 80
              ? "You know this material."
              : average >= 60
                ? "The shape is there; the detail isn't yet."
                : "Worth another pass before you go in."}
          </p>
          <p className="text-muted-foreground mt-1.5 text-[0.9375rem] leading-relaxed">
            {correct} of {answered} fully right
            {answered - correct > 0 &&
              `, ${answered - correct} with something missing`}
            .
          </p>
        </div>
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        <Link
          href={`/preparations/${preparationId}/weak-areas`}
          className="press bg-brand text-brand-foreground rounded-tight inline-flex h-11 items-center gap-2 px-5 text-sm font-medium shadow-soft"
        >
          See what to revisit
          <ArrowRight className="size-4" aria-hidden />
        </Link>
        <button
          type="button"
          onClick={onContinue}
          disabled={generating}
          className="press border-hairline bg-surface rounded-tight inline-flex h-11 items-center gap-2 border px-4 text-sm font-medium disabled:opacity-60"
        >
          {generating && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Keep going
        </button>
      </div>
    </div>
  );
}
