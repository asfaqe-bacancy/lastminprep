import type { PreparationGoal, PreparationType } from "@/types";
import { GOALS } from "@/lib/constants";

/** "45 min", "1 hr", "2 hr 30 min" — short and confident, never "45 MINUTES". */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return `${hours} hr`;
  return `${hours} hr ${rest} min`;
}

/** Clock face for the session timer: 45:00, 1:05:00. */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}

export function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function goalLabel(goal: PreparationGoal): string {
  return GOALS.find((g) => g.value === goal)?.label ?? "Preparation";
}

export function typeLabel(type: PreparationType): string {
  return type === "exam" ? "Exam" : "Interview";
}

/** "2 min ago", "Yesterday", "12 Sep" — relative near, absolute far. */
export function formatRelative(iso: string, now = new Date()): string {
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return then.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Two-digit editorial index: 01, 02, 03. */
export function ordinal(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export function clampPercent(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** Trim a retrieved chunk down to a quotable snippet. */
export function snippet(text: string, max = 240): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trimEnd()}…`;
}

/** Derive a readable title from a type + the documents the user gave us. */
export function derivePreparationTitle(
  type: PreparationType,
  filenames: string[],
): string {
  const source = filenames
    .map((name) => name.replace(/\.[^.]+$/, ""))
    .map((name) => name.replace(/[_-]+/g, " ").trim())
    .filter((name) => !/^(resume|cv|job ?description|jd)$/i.test(name))
    .sort((a, b) => b.length - a.length)[0];
  const subject = source
    ? source
        .split(/\s+/)
        .slice(0, 4)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "New";
  return `${subject} ${type === "exam" ? "Exam" : "Interview"}`;
}

/**
 * Minutes left in a started session, floored at zero. Returns null when the
 * preparation hasn't been started, so callers can show a budget instead.
 */
export function remainingMinutes(
  availableMinutes: number,
  startedAt: string | null,
  now = new Date(),
): number | null {
  if (!startedAt) return null;
  const elapsed = (now.getTime() - Date.parse(startedAt)) / 60_000;
  return Math.max(0, Math.round(availableMinutes - elapsed));
}
