"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { ErrorState } from "@/components/common/error-state";

/** Asks the server to read the material and write the plan. */
export function GeneratePlanButton({
  preparationId,
  label = "Build my plan",
}: {
  preparationId: string;
  label?: string;
}) {
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setWorking(true);
    setError(null);
    try {
      const response = await fetch(`/api/preparations/${preparationId}/plan`, {
        method: "POST",
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? "Could not build the plan.");
      }
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not build the plan.");
      setWorking(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={run}
        disabled={working}
        className="press bg-brand text-brand-foreground rounded-panel inline-flex h-12 items-center gap-2 px-6 text-[0.9375rem] font-medium shadow-soft disabled:opacity-60"
      >
        {working ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : null}
        {working ? "Reading your material" : label}
        {!working && <ArrowRight className="size-4" aria-hidden />}
      </button>
      {working && (
        <p className="text-muted-foreground mt-3 text-[0.8125rem]">
          Working out what matters most in the time you have…
        </p>
      )}
      {error && <ErrorState className="mt-4" description={error} onRetry={run} />}
    </div>
  );
}
