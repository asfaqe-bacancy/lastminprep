"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2 } from "lucide-react";
import type { InterviewMessage, InterviewReport as Report } from "@/types";
import { InterviewReport } from "./interview-report";
import { ErrorState } from "@/components/common/error-state";
import { Meter } from "@/components/progress/meter";
import { ordinal } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The interview screen.
 *
 * One question at a time, no marking in between, and the transcript folded
 * away — the candidate is the focus, not the interviewer
 * (design-system section 12).
 */
export function InterviewStage({
  preparationId,
  initialMessages,
  initialReport,
  autoStart,
}: {
  preparationId: string;
  initialMessages: InterviewMessage[];
  initialReport: Report | null;
  autoStart: boolean;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [report, setReport] = useState(initialReport);
  const [total, setTotal] = useState(8);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const started = useRef(initialMessages.length > 0);

  const questions = messages.filter((message) => message.role === "interviewer");
  const answers = messages.filter((message) => message.role === "user");
  const current = questions[questions.length - 1];
  const awaitingAnswer =
    current !== undefined && answers.length < questions.length;

  useEffect(() => {
    if (!autoStart || started.current || report) return;
    started.current = true;
    void start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  async function start() {
    setStarting(true);
    setError(null);
    try {
      const response = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preparationId }),
      });
      const body = (await response.json()) as {
        messages?: InterviewMessage[];
        total?: number;
        report?: Report | null;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error ?? "Could not start the interview.");
      }
      setMessages(body.messages ?? []);
      setTotal(body.total ?? 8);
      if (body.report) setReport(body.report);
      inputRef.current?.focus();
    } catch (cause) {
      started.current = false;
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not start the interview.",
      );
    } finally {
      setStarting(false);
    }
  }

  async function answer() {
    const trimmed = draft.trim();
    if (!trimmed || busy) return;

    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/interview/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preparationId, answer: trimmed }),
      });
      const body = (await response.json()) as {
        done?: boolean;
        messages?: InterviewMessage[];
        total?: number;
        error?: string;
      };
      if (!response.ok) throw new Error(body.error ?? "That answer didn't send.");

      setMessages(body.messages ?? []);
      setTotal(body.total ?? total);
      setDraft("");
      router.refresh();

      if (body.done) await loadReport();
      else inputRef.current?.focus();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "That answer didn't send.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function loadReport() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/interview/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preparationId }),
      });
      const body = (await response.json()) as {
        report?: Report;
        error?: string;
      };
      if (!response.ok) throw new Error(body.error ?? "Could not write the report.");
      setReport(body.report ?? null);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not write the report.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (report) {
    return <InterviewReport report={report} preparationId={preparationId} />;
  }

  if (messages.length === 0) {
    return (
      <div>
        <p className="text-muted-foreground max-w-prose text-[0.9375rem] leading-relaxed">
          The questions come from your resume, the job description and your
          notes. You won&rsquo;t be marked as you go — you get a report at the
          end, like a real interview.
        </p>
        <button
          type="button"
          onClick={start}
          disabled={starting}
          className="press bg-brand text-brand-foreground rounded-panel mt-7 inline-flex h-12 items-center gap-2 px-6 text-[0.9375rem] font-medium shadow-soft disabled:opacity-60"
        >
          {starting && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {starting ? "Getting ready" : "Begin"}
        </button>
        {error && <ErrorState className="mt-6" description={error} onRetry={start} />}
      </div>
    );
  }

  return (
    <div>
      <Meter
        value={(answers.length / total) * 100}
        label={`Question ${Math.min(questions.length, total)} of ${total}`}
        className="mb-10"
      />

      {questions.length > 1 && (
        <div className="mb-8">
          <button
            type="button"
            onClick={() => setShowTranscript((value) => !value)}
            aria-expanded={showTranscript}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-[0.8125rem] transition-colors"
          >
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform duration-200",
                showTranscript && "rotate-180",
              )}
              aria-hidden
            />
            {showTranscript ? "Hide" : "Show"} what&rsquo;s been asked
          </button>

          {showTranscript && (
            <ol className="animate-rise mt-4 divide-y">
              {messages.map((message, index) => (
                <li key={message.id} className="py-3">
                  <p className="eyebrow mb-1">
                    {message.role === "interviewer"
                      ? `Question ${ordinal(countQuestionsUpTo(messages, index) - 1)}`
                      : "You"}
                  </p>
                  <p className="text-muted-foreground text-[0.875rem] leading-relaxed">
                    {message.content}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {awaitingAnswer && current && (
        <section key={current.id} className="animate-rise">
          <p className="eyebrow">Question {ordinal(questions.length - 1)}</p>
          <h2 className="mt-4 max-w-[28ch] text-[1.5rem] leading-snug font-medium sm:text-[1.875rem]">
            {current.content}
          </h2>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              answer();
            }}
            className="mt-8"
          >
            <label htmlFor="interview-answer" className="eyebrow mb-2 block">
              Your answer
            </label>
            <textarea
              id="interview-answer"
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  answer();
                }
              }}
              rows={6}
              placeholder="Say it the way you would out loud."
              className="border-input bg-surface rounded-panel focus:ring-ring/40 w-full resize-y border px-4 py-3.5 text-[0.9375rem] leading-relaxed outline-none transition-shadow focus:ring-2"
            />

            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={loadReport}
                disabled={busy}
                className="text-muted-foreground hover:text-foreground text-[0.8125rem] transition-colors disabled:opacity-60"
              >
                End and get my report
              </button>
              <button
                type="submit"
                disabled={busy || draft.trim().length === 0}
                className="press bg-brand text-brand-foreground rounded-tight inline-flex h-11 items-center gap-2 px-5 text-sm font-medium shadow-soft disabled:opacity-40"
              >
                {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
                {busy ? "Listening" : "Submit"}
              </button>
            </div>
          </form>
        </section>
      )}

      {!awaitingAnswer && (
        <div className="flex items-center gap-3">
          <Loader2 className="text-muted-foreground size-4 animate-spin" aria-hidden />
          <p className="text-muted-foreground text-[0.9375rem]">
            Thinking about what to ask next…
          </p>
        </div>
      )}

      {error && <ErrorState className="mt-6" description={error} onRetry={answer} />}
    </div>
  );
}

function countQuestionsUpTo(messages: InterviewMessage[], index: number): number {
  let count = 0;
  for (let position = 0; position <= index; position += 1) {
    if (messages[position].role === "interviewer") count += 1;
  }
  return count;
}
