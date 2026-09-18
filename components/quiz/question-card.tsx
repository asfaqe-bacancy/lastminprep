"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { QuizAnswer, QuizQuestion, SourceCitation } from "@/types";
import { FeedbackPanel } from "./feedback-panel";
import { ErrorState } from "@/components/common/error-state";
import { DIFFICULTY_LABELS } from "@/lib/constants";
import { ordinal } from "@/lib/format";

export interface QuestionResult {
  answer: QuizAnswer;
  sources: SourceCitation[];
}

/**
 * One question, a large answer area, one button. Nothing else on screen
 * (design-system section 11).
 */
export function QuestionCard({
  question,
  index,
  total,
  result,
  onSubmit,
  eyebrow,
}: {
  question: QuizQuestion;
  index?: number;
  total?: number;
  result?: QuestionResult;
  onSubmit: (answer: string) => Promise<void>;
  eyebrow?: string;
}) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (busy || result) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit(draft);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "That answer didn't send.",
      );
    } finally {
      setBusy(false);
    }
  }

  const label =
    eyebrow ??
    (index !== undefined && total !== undefined
      ? `Question ${ordinal(index)} of ${total}`
      : "Question");

  return (
    <section>
      <div className="flex items-baseline justify-between gap-4">
        <p className="eyebrow">{label}</p>
        <p className="text-muted-foreground text-[0.6875rem]">
          {question.topicName} · {DIFFICULTY_LABELS[question.difficulty]}
        </p>
      </div>

      <h2 className="mt-4 text-[1.375rem] leading-snug font-medium sm:text-[1.625rem]">
        {question.question}
      </h2>

      {result ? (
        <>
          <div className="mt-7">
            <p className="eyebrow mb-2">Your answer</p>
            <p className="text-[0.9375rem] leading-relaxed">
              {result.answer.userAnswer || (
                <span className="text-muted-foreground">
                  You left this blank.
                </span>
              )}
            </p>
          </div>
          <div className="mt-7 border-t pt-7">
            <FeedbackPanel answer={result.answer} sources={result.sources} />
          </div>
        </>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          className="mt-7"
        >
          <label htmlFor={`answer-${question.id}`} className="eyebrow mb-2 block">
            Your answer
          </label>
          <textarea
            id={`answer-${question.id}`}
            // Callers key this component by question id, so each new question
            // arrives as a fresh mount with an empty, focused box.
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              // Enter is a newline here: answers are several sentences long.
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                submit();
              }
            }}
            rows={5}
            placeholder="Answer in your own words."
            className="border-input bg-surface rounded-panel focus:ring-ring/40 w-full resize-y border px-4 py-3.5 text-[0.9375rem] leading-relaxed outline-none transition-shadow focus:ring-2"
          />

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-muted-foreground hidden text-[0.75rem] sm:block">
              ⌘↵ to submit
            </p>
            <button
              type="submit"
              disabled={busy}
              className="press bg-brand text-brand-foreground rounded-tight ml-auto inline-flex h-11 items-center gap-2 px-5 text-sm font-medium shadow-soft disabled:opacity-60"
            >
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {busy ? "Marking" : "Submit"}
            </button>
          </div>
        </form>
      )}

      {error && <ErrorState className="mt-5" description={error} onRetry={submit} />}
    </section>
  );
}
