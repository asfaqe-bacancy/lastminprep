import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  unit,
  hint,
  className,
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-hairline rounded-panel bg-surface border px-4 py-3.5",
        className,
      )}
    >
      <p className="text-muted-foreground text-[0.8125rem]">{label}</p>
      <p className="numeral mt-1.5 text-[1.625rem] leading-none">
        {value}
        {unit && (
          <span className="text-muted-foreground ml-1 text-sm font-normal tracking-normal">
            {unit}
          </span>
        )}
      </p>
      {hint && (
        <p className="text-muted-foreground mt-1.5 text-[0.75rem]">{hint}</p>
      )}
    </div>
  );
}
