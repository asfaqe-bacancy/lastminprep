"use client";

import { useState } from "react";
import { TIME_OPTIONS } from "@/lib/constants";
import { formatMinutes } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Time is the most important input in the product, so it gets big, confident
 * targets rather than a dropdown (design-system section 8).
 */
export function TimeSelector({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (minutes: number) => void;
}) {
  const isPreset = value !== null && TIME_OPTIONS.includes(value as never);
  const [custom, setCustom] = useState(!isPreset && value !== null);

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Available time"
        className="grid grid-cols-3 gap-2.5 sm:grid-cols-3"
      >
        {TIME_OPTIONS.map((minutes) => {
          const selected = !custom && value === minutes;
          return (
            <button
              key={minutes}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                setCustom(false);
                onChange(minutes);
              }}
              className={cn(
                "press border-hairline rounded-panel bg-surface numeral flex h-16 items-center justify-center border text-[1.0625rem] transition-shadow duration-200 ease-[var(--ease-ios)]",
                selected
                  ? "ring-brand border-brand/40 shadow-soft ring-2"
                  : "hover:border-border",
              )}
            >
              {formatMinutes(minutes)}
            </button>
          );
        })}
        <button
          type="button"
          role="radio"
          aria-checked={custom}
          onClick={() => setCustom(true)}
          className={cn(
            "press border-hairline rounded-panel bg-surface flex h-16 items-center justify-center border text-[0.9375rem] transition-shadow duration-200 ease-[var(--ease-ios)]",
            custom
              ? "ring-brand border-brand/40 shadow-soft ring-2"
              : "hover:border-border",
          )}
        >
          Custom
        </button>
      </div>

      {custom && (
        <div className="animate-rise mt-4 flex items-center gap-3">
          <label htmlFor="custom-minutes" className="text-[0.9375rem]">
            Minutes
          </label>
          <input
            id="custom-minutes"
            type="number"
            inputMode="numeric"
            min={5}
            max={480}
            value={value ?? ""}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (Number.isFinite(next)) onChange(next);
            }}
            className="border-input bg-surface rounded-tight numeral h-11 w-28 border px-3 text-[0.9375rem]"
          />
          <span className="text-muted-foreground text-[0.8125rem]">
            Between 5 and 480
          </span>
        </div>
      )}
    </div>
  );
}
