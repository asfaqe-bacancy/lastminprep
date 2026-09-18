"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/lib/use-hydrated";

const OPTIONS = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
] as const;

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  // next-themes only knows the stored theme on the client.
  const hydrated = useHydrated();

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn(
        "border-hairline bg-surface-2 inline-flex items-center gap-0.5 rounded-full border p-0.5",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = hydrated && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            onClick={() => setTheme(value)}
            className={cn(
              "text-muted-foreground flex size-7 items-center justify-center rounded-full transition-colors duration-150 ease-[var(--ease-ios)]",
              active && "bg-surface text-foreground shadow-hairline",
            )}
          >
            <Icon className="size-3.5" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
