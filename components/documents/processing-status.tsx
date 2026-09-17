"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import type { DocumentStatus } from "@/types";
import { PROCESSING_STAGES } from "@/lib/constants";
import { ErrorState } from "@/components/common/error-state";
import { cn } from "@/lib/utils";

interface DocumentProgress {
  id: string;
  filename: string;
  status: DocumentStatus;
  errorMessage: string | null;
}

const ORDER: DocumentStatus[] = [
  "uploading",
  "extracting",
  "chunking",
  "embedding",
  "indexing",
  "ready",
];

function rank(status: DocumentStatus): number {
  const index = ORDER.indexOf(status);
  return index === -1 ? 0 : index;
}

/**
 * Contextual progress, never a bare spinner (design-system section 20).
 * Polls each document's status and refreshes the page once everything is in.
 */
export function ProcessingStatus({
  documents: initial,
}: {
  documents: DocumentProgress[];
}) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initial);
  const [pollError, setPollError] = useState<string | null>(null);
  const refreshed = useRef(false);

  const failed = documents.filter((doc) => doc.status === "failed");
  const settled =
    documents.length > 0 &&
    documents.every((doc) => doc.status === "ready" || doc.status === "failed");

  useEffect(() => {
    if (settled) {
      if (!refreshed.current) {
        refreshed.current = true;
        router.refresh();
      }
      return;
    }

    let cancelled = false;
    const timer = setInterval(async () => {
      try {
        const next = await Promise.all(
          documents.map(async (doc) => {
            if (doc.status === "ready" || doc.status === "failed") return doc;
            const response = await fetch(`/api/documents/${doc.id}/status`, {
              cache: "no-store",
            });
            if (!response.ok) return doc;
            return (await response.json()) as DocumentProgress;
          }),
        );
        if (!cancelled) {
          setDocuments(next);
          setPollError(null);
        }
      } catch {
        if (!cancelled) {
          setPollError("Lost contact while preparing your material.");
        }
      }
    }, 1200);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [documents, settled, router]);

  // The slowest document decides which stage we're showing.
  const currentRank = documents.length
    ? Math.min(...documents.map((doc) => rank(doc.status)))
    : 0;

  return (
    <div>
      <h1 className="text-[1.75rem] leading-tight font-medium sm:text-[2.125rem]">
        Preparing your material
      </h1>
      <p className="text-muted-foreground mt-2 text-[0.9375rem]">
        {settled
          ? "Done. Building your plan next."
          : PROCESSING_STAGES[Math.min(currentRank, PROCESSING_STAGES.length - 1)]
              .running}
        …
      </p>

      <ol className="mt-8 space-y-0.5" aria-live="polite">
        {PROCESSING_STAGES.map((stage, index) => {
          const done = currentRank > index || settled;
          const active = !done && currentRank === index;
          return (
            <li
              key={stage.status}
              className={cn(
                "flex items-center gap-3 py-2.5 text-[0.9375rem] transition-colors",
                done || active ? "text-foreground" : "text-muted-foreground/60",
              )}
            >
              <span className="flex size-5 shrink-0 items-center justify-center">
                {done ? (
                  <Check className="text-brand-text size-4" strokeWidth={2.5} aria-hidden />
                ) : active ? (
                  <Loader2 className="text-brand-text size-4 animate-spin" aria-hidden />
                ) : (
                  <span className="bg-muted-foreground/30 size-1.5 rounded-full" />
                )}
              </span>
              {done ? stage.label : stage.running}
            </li>
          );
        })}
      </ol>

      <ul className="mt-8 divide-y">
        {documents.map((doc) => (
          <li key={doc.id} className="flex items-center gap-3 py-3">
            <span className="min-w-0 flex-1 truncate text-[0.9375rem]">
              {doc.filename}
            </span>
            <span
              className={cn(
                "shrink-0 text-[0.8125rem]",
                doc.status === "failed"
                  ? "text-destructive"
                  : "text-muted-foreground",
              )}
            >
              {doc.status === "ready"
                ? "Ready"
                : doc.status === "failed"
                  ? "Failed"
                  : "Working"}
            </span>
          </li>
        ))}
      </ul>

      {failed.length > 0 && (
        <ErrorState
          className="mt-6"
          title={
            failed.length === 1
              ? `We couldn't read ${failed[0].filename}`
              : `We couldn't read ${failed.length} of your files`
          }
          description={
            failed[0].errorMessage ??
            "The text may be scanned rather than selectable. Try a different PDF."
          }
          onRetry={() => router.refresh()}
          retryLabel="Refresh"
        />
      )}

      {pollError && <ErrorState className="mt-4" description={pollError} onRetry={() => router.refresh()} />}
    </div>
  );
}
