import { cn } from "@/lib/utils";
import { clampPercent } from "@/lib/format";

/** A thin bar. Never a gradient, never animated on load. */
export function Meter({
  value,
  label,
  valueLabel,
  tone = "brand",
  className,
}: {
  value: number;
  label?: string;
  valueLabel?: string;
  tone?: "brand" | "neutral";
  className?: string;
}) {
  const percent = clampPercent(value);
  return (
    <div className={className}>
      {(label || valueLabel) && (
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          {label && <span className="text-sm">{label}</span>}
          {valueLabel && (
            <span className="text-muted-foreground numeral text-sm">
              {valueLabel}
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
        className="bg-muted h-1.5 w-full overflow-hidden rounded-full"
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-300 ease-[var(--ease-ios)]",
            tone === "brand" ? "bg-brand" : "bg-foreground/35",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
