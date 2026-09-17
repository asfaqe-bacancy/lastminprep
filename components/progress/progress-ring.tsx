import { cn } from "@/lib/utils";
import { clampPercent } from "@/lib/format";

/** Calm circular progress (design-system section 13). */
export function ProgressRing({
  value,
  size = 96,
  thickness = 6,
  label,
  caption,
  className,
}: {
  value: number;
  size?: number;
  thickness?: number;
  label?: string;
  caption?: string;
  className?: string;
}) {
  const percent = clampPercent(value);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  return (
    <div
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        role="img"
        aria-label={`${label ?? "Progress"}: ${percent} percent`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-brand transition-[stroke-dashoffset] duration-500 ease-[var(--ease-ios)]"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="numeral leading-none"
          style={{ fontSize: size * 0.26 }}
        >
          {percent}%
        </span>
        {caption && (
          <span className="text-muted-foreground mt-0.5 text-[0.6875rem]">
            {caption}
          </span>
        )}
      </div>
    </div>
  );
}
