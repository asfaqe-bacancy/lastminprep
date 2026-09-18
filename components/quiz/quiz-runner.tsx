"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import type { QuizQuestion, QuizResult } from "@/types";
import { QuestionCard, type QuestionResult } from "./question-card";
import { ScoreCard } from "./score-card";
import { ErrorState } from "@/components/common/error-state";
import { Meter } from "@/components/progress/meter";

/**
 * Runs a round of questions: ask, mark, move on, then show where it landed.
 *
 * Questions are generated on demand rather than up front, so somebody with
 * fifteen minutes isn't kept waiting for ten questions they'll never reach.
 */
export function QuizRunner({
  preparationId,
  initialQuestions,
  initialResults,
  focus = "plan",
  topics,
}: {
  preparationId: string;
  initialQuestions: QuizQuestion[];
  initialResults: QuizResult[];
  focus?: "plan" | "weak";
  topics?: string[];
}) {
  const router = useRouter();
  const [questions, setQuestions] = useState(initialQuestions);
  const [results, setResults] = useState<Map<string, QuestionResult>>(
    () =>
      new Map(
        initialResults.map((result) => [
          result.question.id,
          { answer: result.answer, sources: result.question.sources },
        ]),
      ),
  );
  const [index, setIndex] = useState(() => {
    const answered = new Set(initialResults.map((result) => result.question.id));
    const next = initialQuestions.findIndex(
      (question) => !answered.has(question.id),
    );
    return next === -1 ? Math.max(0, initialQuestions.length - 1) : next;
  });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const question = questions[index];
  const answeredCount = results.size;
  const current = question ? results.get(question.id) : undefined;

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const response = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preparationId, focus, topics, count: 5 }),
      });
      const body = (await response.json()) as {
        questions?: QuizQuestion[];
        error?: string;
      };
      if (!response.ok) throw new Error(body.error ?? "Could not write questions.");

      const fresh = body.questions ?? [];
      setQuestions((current) => {
        const next = [...current, ...fresh];
        setIndex(current.length);
        return next;
      });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not write questions.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function submit(answer: string) {
    if (!question) return;

    const response = await fetch("/api/quiz/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: question.id, answer }),
    });
    const body = (await response.json()) as QuestionResult & { error?: string };
    if (!response.ok) throw new Error(body.error ?? "Could not mark that.");

    setResults((current) =>
      new Map(current).set(question.id, {
        answer: body.answer,
        sources: body.sources ?? question.sources,
      }),
    );
    // Keeps the dashboard's progress figure honest as you go.
    router.refresh();
  }

  if (finished || (questions.length === 0 && !generating)) {
    const scored = questions
      .map((entry) => results.get(entry.id))
      .filter((entry): entry is QuestionResult => Boolean(entry));

    if (questions.length === 0) {
      return (
        <div>
          <p className="text-muted-foreground text-[0.9375rem] leading-relaxed">
            {focus === "weak"
              ? "Questions here target the topics you've scored lowest on."
              : "Questions are written from the documents you uploaded, and marked against them."}
          </p>
          <button
            type="button"
            onClick={generate}
            disabled={generating}
            className="press bg-brand text-brand-foreground rounded-panel mt-6 inline-flex h-12 items-center gap-2 px-6 text-[0.9375rem] font-medium shadow-soft disabled:opacity-60"
          >
            {generating && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {generating ? "Writing questions" : "Start"}
            {!generating && <ArrowRight className="size-4" aria-hidden />}
          </button>
          {error && <ErrorState className="mt-5" description={error} onRetry={generate} />}
        </div>
      );
    }

    return (
      <ScoreCard
        preparationId={preparationId}
        results={scored.map((entry) => entry.answer)}
        onContinue={() => {
          setFinished(false);
          void generate();
        }}
        generating={generating}
      />
    );
  }

  return (
    <div>
      <Meter
        value={(answeredCount / Math.max(questions.length, 1)) * 100}
        label={`${answeredCount} of ${questions.length} answered`}
        className="mb-9"
      />

      {question && (
        <QuestionCard
          key={question.id}
          question={question}
          index={index}
          total={questions.length}
          result={current}
          onSubmit={submit}
        />
      )}

      {current && (
        <div className="mt-9 flex flex-wrap items-center gap-3 border-t pt-7">
          {index < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setIndex((value) => value + 1)}
              className="press bg-brand text-brand-foreground rounded-tight inline-flex h-11 items-center gap-2 px-5 text-sm font-medium shadow-soft"
            >
              Next question
              <ArrowRight className="size-4" aria-hidden />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={generate}
                disabled={generating}
                className="press bg-brand text-brand-foreground rounded-tight inline-flex h-11 items-center gap-2 px-5 text-sm font-medium shadow-soft disabled:opacity-60"
              >
                {generating && (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                )}
                {generating ? "Writing more" : "More questions"}
              </button>
              <button
                type="button"
                onClick={() => setFinished(true)}
                className="press border-hairline bg-surface rounded-tight inline-flex h-11 items-center px-4 text-sm font-medium"
              >
                See how it went
              </button>
            </>
          )}
        </div>
      )}

      {error && <ErrorState className="mt-5" description={error} onRetry={generate} />}
    </div>
  );
}
