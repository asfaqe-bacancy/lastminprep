"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import type { PreparationGoal, PreparationType } from "@/types";
import { ChoiceCard } from "./choice-card";
import { TimeSelector } from "./time-selector";
import { DocumentUpload, type PendingUpload } from "./document-upload";
import { ErrorState } from "@/components/common/error-state";
import { GOALS, PREPARATION_TYPES } from "@/lib/constants";
import { formatMinutes } from "@/lib/format";
import { cn } from "@/lib/utils";

const STEP_COUNT = 4;

export function NewPreparationFlow({
  initialType,
}: {
  initialType: PreparationType | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState(initialType ? 1 : 0);
  const [type, setType] = useState<PreparationType | null>(initialType);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [goal, setGoal] = useState<PreparationGoal | null>(null);
  const [files, setFiles] = useState<PendingUpload[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goals = GOALS.filter((entry) => type && entry.types.includes(type));

  const canAdvance = [
    type !== null,
    minutes !== null && minutes >= 5,
    goal !== null,
    files.length > 0,
  ][step];

  async function submit() {
    if (!type || !minutes || !goal) return;
    setSubmitting(true);
    setError(null);

    try {
      const created = await fetch("/api/preparations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          goal,
          availableMinutes: minutes,
          filenames: files.map((entry) => entry.file.name),
        }),
      });

      if (!created.ok) throw new Error(await readError(created));
      const { id } = (await created.json()) as { id: string };

      for (const entry of files) {
        const form = new FormData();
        form.set("preparationId", id);
        form.set("role", entry.role);
        form.set("file", entry.file);

        const uploaded = await fetch("/api/documents/upload", {
          method: "POST",
          body: form,
        });
        if (!uploaded.ok) throw new Error(await readError(uploaded));

        // Processing is kicked off but not awaited: the preparation screen
        // shows the stages live. `keepalive` keeps the request alive through
        // the navigation that follows.
        const { id: documentId } = (await uploaded.json()) as { id: string };
        void fetch(`/api/documents/${documentId}/process`, {
          method: "POST",
          keepalive: true,
        }).catch(() => {
          /* The processing screen surfaces failures from the status poll. */
        });
      }

      router.push(`/preparations/${id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <p className="eyebrow mb-7">
        Step {step + 1} of {STEP_COUNT}
      </p>

      <div key={step} className="animate-rise">
        {step === 0 && (
          <Step question="What are you preparing for?">
            <div
              role="radiogroup"
              aria-label="Preparation type"
              className="grid gap-3 sm:grid-cols-2"
            >
              {PREPARATION_TYPES.map((entry) => (
                <ChoiceCard
                  key={entry.value}
                  label={entry.label}
                  description={entry.description}
                  selected={type === entry.value}
                  onSelect={() => {
                    setType(entry.value);
                    if (goal && !GOALS.find((g) => g.value === goal)?.types.includes(entry.value)) {
                      setGoal(null);
                    }
                  }}
                  className="sm:min-h-[9rem]"
                />
              ))}
            </div>
          </Step>
        )}

        {step === 1 && (
          <Step question="How much time do you have?">
            <TimeSelector value={minutes} onChange={setMinutes} />
          </Step>
        )}

        {step === 2 && (
          <Step question="What do you want out of it?">
            <div
              role="radiogroup"
              aria-label="Goal"
              className="grid gap-3 sm:grid-cols-2"
            >
              {goals.map((entry) => (
                <ChoiceCard
                  key={entry.value}
                  label={entry.label}
                  description={entry.description}
                  selected={goal === entry.value}
                  onSelect={() => setGoal(entry.value)}
                />
              ))}
            </div>
          </Step>
        )}

        {step === 3 && (
          <Step
            question="What do you have?"
            note={
              type === "interview"
                ? "A resume and the job description make the questions much sharper."
                : "Notes, slides, past papers — whatever you'd be revising from."
            }
          >
            <DocumentUpload
              files={files}
              onChange={setFiles}
              allowRoles={type === "interview"}
            />
          </Step>
        )}
      </div>

      {error && (
        <ErrorState
          className="mt-6"
          title="Couldn't start that preparation"
          description={error}
          onRetry={submit}
        />
      )}

      {/* Sticky on mobile so the primary action stays in thumb reach */}
      <div className="liquid rounded-none border-x-0 border-b-0 fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-30 flex items-center justify-between gap-3 px-5 py-3 lg:static lg:mt-10 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
        <button
          type="button"
          onClick={() => setStep((current) => Math.max(0, current - 1))}
          disabled={step === 0 || submitting}
          className={cn(
            "press rounded-tight inline-flex h-11 items-center gap-1.5 px-3 text-sm font-medium transition-opacity",
            step === 0 ? "pointer-events-none opacity-0" : "text-muted-foreground",
          )}
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back
        </button>

        {step < STEP_COUNT - 1 ? (
          <button
            type="button"
            onClick={() => setStep((current) => current + 1)}
            disabled={!canAdvance}
            className="press bg-brand text-brand-foreground rounded-tight inline-flex h-11 items-center gap-2 px-5 text-sm font-medium shadow-soft disabled:opacity-40"
          >
            Continue
            <ArrowRight className="size-4" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!canAdvance || submitting}
            className="press bg-brand text-brand-foreground rounded-tight inline-flex h-11 items-center gap-2 px-5 text-sm font-medium shadow-soft disabled:opacity-40"
          >
            {submitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {submitting ? "Setting up" : "Prepare my plan"}
          </button>
        )}
      </div>

      {/* Quiet recap so the earlier answers stay visible */}
      {step > 0 && (
        <p className="text-muted-foreground mt-7 text-[0.8125rem] lg:mt-6">
          {[
            type && (type === "exam" ? "Exam" : "Interview"),
            minutes && formatMinutes(minutes),
            goal && GOALS.find((entry) => entry.value === goal)?.label,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
    </div>
  );
}

function Step({
  question,
  note,
  children,
}: {
  question: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h1 className="mb-1 text-[1.75rem] leading-tight font-medium sm:text-[2.125rem]">
        {question}
      </h1>
      {note && (
        <p className="text-muted-foreground mb-7 text-[0.9375rem] leading-relaxed">
          {note}
        </p>
      )}
      <div className={note ? "" : "mt-7"}>{children}</div>
    </section>
  );
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}
