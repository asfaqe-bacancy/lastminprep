import type { DocumentStatus } from "@/types";
import { cn } from "@/lib/utils";

const LABELS: Record<DocumentStatus, string> = {
  uploading: "Uploading",
  extracting: "Reading",
  chunking: "Preparing",
  embedding: "Preparing",
  indexing: "Almost ready",
  ready: "Ready",
  failed: "Failed",
};

export function DocumentStatusPill({ status }: { status: DocumentStatus }) {
  const working = status !== "ready" && status !== "failed";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.6875rem]",
        status === "failed"
          ? "border-destructive/30 text-destructive"
          : "border-hairline text-muted-foreground",
      )}
    >
      {working && (
        <span className="bg-brand animate-sheen size-1.5 rounded-full" aria-hidden />
      )}
      {LABELS[status]}
    </span>
  );
}
