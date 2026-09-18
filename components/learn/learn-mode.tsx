"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { QuizQuestion, SourceCitation, Topic } from "@/types";
import { Prose } from "@/components/common/prose";
import { SourceReference } from "@/components/sources/source-reference";
import { ErrorState } from "@/components/common/error-state";
import {
  QuestionCard,
  type QuestionResult,
} from "@/components/quiz/question-card";
import { AskPanel } from "@/components/coach/ask-panel";
import { PRIORITY_META } from "@/lib/constants";
import { formatMinutes, ordinal } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Explanation {
  explanation: string;
  keyIdea: string;
  remember: string;
  covered: boolean;
  sources: SourceCitation[];
}

type Mode = "normal" | "simpler" | "example";

/**
 * Learn mode reads like an article, not a chat (design-system section 10):
 * the topic is a heading, the explanation is body copy, and the source sits
 * underneath as a reference.
 *
 * This component owns only the topic rail. Each topic's content lives in
 * `TopicPanel`, keyed by topic id, so switching topics remounts it with clean
 * state instead of clearing half a dozen values by hand.
 */
export function LearnMode({
  preparationId,
  topics,
  minutes,
}: {
  preparationId: string;
  topics: Topic[];
  minutes: number;
}) {
  const [selected, setSelected] = useState<Topic | null>(topics[0] ?? null);

  if (topics.length === 0) {
    return (
      <p className="text-muted-foreground border-hairline rounded-panel border border-dashed px-5 py-6 text-[0.9375rem]">
        This preparation has no topics yet. Build the plan first and they&rsquo;ll
        appear here.
      </p>
    );
  }

  return (
    <div className="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
      {/* A list on desktop, a scrollable row on mobile */}
      <nav aria-label="Topics" className="mb-8 lg:mb-0">
        <ul className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-0">
          {topics.map((topic, index) => {
            const active = selected?.id === topic.id;
            return (
              <li key={topic.id} className="shrink-0 lg:shrink">
                <button
                  type="button"
                  onClick={() => setSelected(topic)}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "flex w-full items-baseline gap-2.5 rounded-tight px-3 py-2.5 text-left text-[0.875rem] whitespace-nowrap transition-colors duration-150 lg:whitespace-normal",
                    active
                      ? "bg-surface-2 text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="numeral text-[0.6875rem] opacity-60">
                    {ordinal(index)}
                  </span>
                  <span className="min-w-0">{topic.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="min-w-0">
        {selected && (
          <TopicPanel
            key={selected.id}
            preparationId={preparationId}
            topic={selected}
          />
        )}

        <section className="mt-12 border-t pt-9">
          <h3 className="mb-4 text-[0.9375rem] font-medium">
            Ask something of your own
          </h3>
          <AskPanel
            preparationId={preparationId}
            suggestions={
              selected
                ? [
                    `Why does ${selected.name.toLowerCase()} matter?`,
                    `What's the most common mistake with ${selected.name.toLowerCase()}?`,
                  ]
                : []
            }
          />
        </section>

        <p className="text-muted-foreground mt-8 text-[0.75rem]">
          You have {formatMinutes(minutes)} in total for this preparation.
        </p>
      </div>
    </div>
  );
}

function TopicPanel({
  preparationId,
  topic,
}: {
  preparationId: string;
  topic: Topic;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("normal");
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [questionResult, setQuestionResult] = useState<QuestionResult | null>(
    null,
  );
  const [askingForQuestion, setAskingForQuestion] = useState(false);

  // `mode` and `attempt` are part of the request, so changing either re-runs
  // it. State is only written from the async callbacks, never from the effect
  // body itself.
  useEffect(() => {
    let cancelled = false;

    fetch("/api/learn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preparationId, topic: topic.name, mode }),
    })
      .then(async (response) => {
        const body = (await response.json()) as Explanation & {
          error?: string;
        };
        if (!response.ok) {
          throw new Error(body.error ?? "Could not explain that topic.");
        }
        return body;
      })
      .then((body) => {
        if (cancelled) return;
        setExplanation(body);
        setError(null);
        setPending(false);
        // Studying a topic moves the progress figure.
        if (body.covered) router.refresh();
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not explain that topic.",
        );
        setPending(false);
      });

    return () => {
      cancelled = true;
    };
  }, [preparationId, topic.name, mode, attempt, router]);

  function changeMode(next: Mode) {
    setMode(next);
    setPending(true);
    setError(null);
  }

  function retry() {
    setAttempt((value) => value + 1);
    setPending(true);
    setError(null);
  }

  async function askMeAQuestion() {
    setAskingForQuestion(true);
    setError(null);
    try {
      const response = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preparationId,
          topics: [topic.name],
          count: 1,
        }),
      });
      const body = (await response.json()) as {
        questions?: QuizQuestion[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error ?? "Could not write a question.");
      }
      setQuestion(body.questions?.[0] ?? null);
      setQuestionResult(null);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not write a question.",
      );
    } finally {
      setAskingForQuestion(false);
    }
  }

  async function submitAnswer(answer: string) {
    if (!question) return;
    const response = await fetch("/api/quiz/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: question.id, answer }),
    });
    const body = (await response.json()) as QuestionResult & {
      error?: string;
    };
    if (!response.ok) throw new Error(body.error ?? "Could not mark that.");

    setQuestionResult({
      answer: body.answer,
      sources: body.sources ?? question.sources,
    });
    router.refresh();
  }

  return (
    <>
      <article>
        <header className="mb-6">
          <h2 className="text-[1.5rem] leading-tight font-medium sm:text-[1.875rem]">
            {topic.name}
          </h2>
          <p className="text-muted-foreground mt-2 text-[0.8125rem]">
            {PRIORITY_META[topic.priority].label}
            {topic.estimatedMinutes !== null &&
              ` · about ${formatMinutes(topic.estimatedMinutes)}`}
          </p>
        </header>

        {pending ? (
          <ReadingSkeleton />
        ) : error ? (
          <ErrorState description={error} onRetry={retry} />
        ) : explanation ? (
          <>
            <Prose text={explanation.explanation} size="large" />

            {explanation.covered && explanation.keyIdea && (
              <div className="border-hairline rounded-panel bg-surface-2 mt-7 border px-5 py-4">
                <p className="eyebrow mb-1.5">Key idea</p>
                <p className="text-[0.9375rem] leading-relaxed">
                  {explanation.keyIdea}
                </p>
              </div>
            )}

            {explanation.covered && explanation.remember && (
              <div className="mt-5">
                <p className="eyebrow mb-1.5">Remember</p>
                <p className="text-[0.9375rem] leading-relaxed">
                  {explanation.remember}
                </p>
              </div>
            )}

            <SourceReference sources={explanation.sources} />

            {explanation.covered && (
              <div className="mt-8 flex flex-wrap gap-2 border-t pt-6">
                <Action
                  label="Explain simpler"
                  active={mode === "simpler"}
                  onClick={() => changeMode("simpler")}
                />
                <Action
                  label="Give an example"
                  active={mode === "example"}
                  onClick={() => changeMode("example")}
                />
                <Action
                  label={askingForQuestion ? "Thinking" : "Ask me a question"}
                  busy={askingForQuestion}
                  onClick={askMeAQuestion}
                />
              </div>
            )}
          </>
        ) : null}
      </article>

      {question && (
        <div className="border-hairline rounded-surface bg-surface mt-9 border p-6">
          <QuestionCard
            key={question.id}
            question={question}
            eyebrow="Quick check"
            result={questionResult ?? undefined}
            onSubmit={submitAnswer}
          />
        </div>
      )}
    </>
  );
}

function Action({
  label,
  onClick,
  active,
  busy,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={cn(
        "press border-hairline rounded-full border px-3.5 py-2 text-[0.8125rem] transition-colors duration-150 disabled:opacity-60",
        active ? "bg-surface-2 font-medium" : "bg-surface hover:border-border",
      )}
    >
      {busy && (
        <Loader2 className="mr-1.5 inline size-3 animate-spin" aria-hidden />
      )}
      {label}
    </button>
  );
}

function ReadingSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-label="Reading your material">
      {[98, 100, 94, 100, 88, 0, 96, 92, 70].map((width, index) =>
        width === 0 ? (
          <div key={index} className="h-3" />
        ) : (
          <div
            key={index}
            className="bg-muted animate-pulse h-4 rounded-full"
            style={{ width: `${width}%` }}
          />
        ),
      )}
    </div>
  );
}
