"use client";

import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

/** Every failure gets a plain sentence and a way forward (user-flows 10). */
export function ErrorState({
  title = "That didn't work",
  description,
  onRetry,
  retryLabel = "Try again",
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-panel border-destructive/25 bg-destructive/5 border px-5 py-4",
        className,
      )}
    >
      <p className="text-[0.9375rem] font-medium">{title}</p>
      {description && (
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          {description}
        </p>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="press border-hairline bg-surface rounded-tight mt-3 inline-flex h-9 items-center gap-1.5 border px-3 text-sm font-medium"
        >
          <RotateCcw className="size-3.5" aria-hidden />
          {retryLabel}
        </button>
      )}
    </div>
  );
}
