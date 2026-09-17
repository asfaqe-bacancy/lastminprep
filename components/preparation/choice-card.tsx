"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Large selectable card. The selected state is strong but subtle: a ring in
 * the accent colour plus a tick, never a filled block of colour.
 */
export function ChoiceCard({
  label,
  description,
  selected,
  onSelect,
  className,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "press border-hairline rounded-surface bg-surface relative flex flex-col items-start border p-5 text-left transition-shadow duration-200 ease-[var(--ease-ios)]",
        selected
          ? "ring-brand border-brand/40 shadow-soft ring-2"
          : "hover:border-border shadow-hairline",
        className,
      )}
    >
      <span className="flex w-full items-start justify-between gap-3">
        <span className="text-[1.0625rem] font-medium">{label}</span>
        <span
          aria-hidden
          className={cn(
            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-150",
            selected
              ? "bg-brand border-brand text-brand-foreground"
              : "border-border",
          )}
        >
          {selected && <Check className="size-3" strokeWidth={3} />}
        </span>
      </span>
      {description && (
        <span className="text-muted-foreground mt-2 text-[0.8125rem] leading-relaxed">
          {description}
        </span>
      )}
    </button>
  );
}
