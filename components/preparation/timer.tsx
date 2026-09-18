"use client";

import { useEffect, useState } from "react";
import { formatClock, formatMinutes } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Time is the product, so it is shown plainly and calmly: no flashing, no
 * exclamation marks, just a number that gets quieter company as it shrinks
 * (design-system section 16).
 */
export function Timer({
  availableMinutes,
  startedAt,
  className,
}: {
  availableMinutes: number;
  startedAt: string | null;
  className?: string;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!startedAt) return;

    const tick = () => setNow(Date.now());
    // The first value is painted on the next task rather than during the
    // effect, so the server-rendered markup stays the one React hydrates.
    const immediate = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);

    return () => {
      clearTimeout(immediate);
      clearInterval(timer);
    };
  }, [startedAt]);

  if (!startedAt) {
    return (
      <div className={cn("text-right", className)}>
        <p className="numeral text-[1.125rem] leading-none">
          {formatMinutes(availableMinutes)}
        </p>
        <p className="text-muted-foreground mt-1 text-[0.6875rem]">to work with</p>
      </div>
    );
  }

  const elapsed = now === null ? 0 : (now - Date.parse(startedAt)) / 1000;
  const remaining = Math.max(0, availableMinutes * 60 - elapsed);
  const low = remaining > 0 && remaining < 5 * 60;
  const done = remaining <= 0;

  return (
    <div className={cn("text-right", className)}>
      <p
        className={cn(
          "numeral text-[1.125rem] leading-none tabular-nums",
          low && "text-brand-text",
        )}
        // Announcing every second would be unusable with a screen reader.
        aria-live="off"
      >
        {now === null ? formatMinutes(availableMinutes) : formatClock(remaining)}
      </p>
      <p className="text-muted-foreground mt-1 text-[0.6875rem]">
        {done ? "time's up" : "remaining"}
      </p>
    </div>
  );
}
