"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="py-16">
      <h1 className="text-[1.75rem] leading-tight font-medium">
        That didn&rsquo;t load
      </h1>
      <p className="text-muted-foreground mt-3 max-w-prose text-[0.9375rem] leading-relaxed">
        {error.message ||
          "Something went wrong while loading this screen. Nothing you've done has been lost."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="press border-hairline bg-surface rounded-tight mt-7 inline-flex h-10 items-center gap-1.5 border px-4 text-sm font-medium"
      >
        <RotateCcw className="size-3.5" aria-hidden />
        Try again
      </button>
    </div>
  );
}
