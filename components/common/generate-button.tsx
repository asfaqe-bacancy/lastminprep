"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { ErrorState } from "@/components/common/error-state";
import { cn } from "@/lib/utils";

/**
 * Asks the server to generate something from the user's material, then
 * refreshes so the page renders the stored result.
 *
 * The working label matters: "Reading your material" says what is happening,
 * where a spinner alone would not (design-system section 20).
 */
export function GenerateButton({
  endpoint,
  label,
  workingLabel,
  note,
  variant = "primary",
  className,
}: {
  endpoint: string;
  label: string;
  workingLabel: string;
  note?: string;
  variant?: "primary" | "quiet";
  className?: string;
}) {
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setWorking(true);
    setError(null);
    try {
      const response = await fetch(endpoint, { method: "POST" });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? "That didn't work.");
      }
      router.refresh();
      // Left as working until the refreshed page replaces this button.
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That didn't work.");
      setWorking(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={run}
        disabled={working}
        className={cn(
          "press rounded-panel inline-flex h-12 items-center gap-2 px-6 text-[0.9375rem] font-medium disabled:opacity-60",
          variant === "primary"
            ? "bg-brand text-brand-foreground shadow-soft"
            : "border-hairline bg-surface border",
        )}
      >
        {working && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {working ? workingLabel : label}
        {!working && variant === "primary" && (
          <ArrowRight className="size-4" aria-hidden />
        )}
      </button>

      {working && note && (
        <p className="text-muted-foreground mt-3 text-[0.8125rem]">{note}</p>
      )}
      {error && <ErrorState className="mt-4" description={error} onRetry={run} />}
    </div>
  );
}
