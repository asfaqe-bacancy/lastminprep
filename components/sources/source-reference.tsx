"use client";

import { useState } from "react";
import { ArrowRight, FileText } from "lucide-react";
import type { SourceCitation } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * Sources read as references, not AI citations (design-system section 23).
 * Opening one shows the passage that was actually retrieved, which is what
 * makes the grounding checkable rather than a claim.
 */
export function SourceReference({
  sources,
  className,
}: {
  sources: SourceCitation[];
  className?: string;
}) {
  const [open, setOpen] = useState<SourceCitation | null>(null);

  if (sources.length === 0) return null;

  return (
    <>
      <div className={cn("mt-6", className)}>
        <p className="eyebrow mb-2.5">
          {sources.length === 1 ? "Source" : "Sources"}
        </p>
        <ul className="space-y-0.5">
          {sources.map((source) => (
            <li key={source.chunkId}>
              <button
                type="button"
                onClick={() => setOpen(source)}
                className="hover:bg-surface-2 group -mx-2 flex w-full items-center gap-2.5 rounded-tight px-2 py-2 text-left transition-colors duration-150"
              >
                <FileText
                  className="text-muted-foreground size-3.5 shrink-0"
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate text-[0.8125rem]">
                  {source.filename}
                  {source.pageNumber !== null && (
                    <span className="text-muted-foreground">
                      {" · "}Page {source.pageNumber}
                    </span>
                  )}
                </span>
                <ArrowRight
                  className="text-muted-foreground size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  aria-hidden
                />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <Sheet open={open !== null} onOpenChange={(next) => !next && setOpen(null)}>
        <SheetContent
          side="bottom"
          className="rounded-t-surface max-h-[80dvh] gap-0 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:mx-auto sm:max-w-xl"
        >
          <SheetHeader className="px-5 pb-1">
            <p className="eyebrow">Source</p>
            <SheetTitle className="mt-1 text-[1.0625rem]">
              {open?.filename}
            </SheetTitle>
            <SheetDescription>
              {open?.pageNumber !== null && open?.pageNumber !== undefined
                ? `Page ${open.pageNumber}`
                : "Page unknown"}
            </SheetDescription>
          </SheetHeader>

          <div className="overflow-y-auto px-5 pt-4">
            <blockquote className="border-brand/40 text-[0.9375rem] leading-[1.7] border-l-2 pl-4">
              {open?.snippet}
            </blockquote>
            <p className="text-muted-foreground mt-4 text-[0.75rem]">
              This is the passage retrieved from your document and given to the
              coach.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
