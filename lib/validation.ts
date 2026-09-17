/**
 * Small hand-rolled validators.
 *
 * Deliberately not a schema library: the payloads are tiny and the PRD asks
 * for no unnecessary dependencies. Every route handler validates its input
 * here before touching the database.
 */

import type { DocumentRole, PreparationGoal, PreparationType } from "@/types";
import { GOALS, MAX_UPLOAD_BYTES } from "@/lib/constants";

export class ValidationError extends Error {}

export function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ValidationError("Expected a JSON object.");
  }
  return value as Record<string, unknown>;
}

export function requireString(
  value: unknown,
  field: string,
  { max = 4000, min = 1 }: { max?: number; min?: number } = {},
): string {
  if (typeof value !== "string") {
    throw new ValidationError(`${field} must be text.`);
  }
  const trimmed = value.trim();
  if (trimmed.length < min) throw new ValidationError(`${field} is required.`);
  if (trimmed.length > max) {
    throw new ValidationError(`${field} is too long (max ${max} characters).`);
  }
  return trimmed;
}

export function optionalString(
  value: unknown,
  field: string,
  options?: { max?: number },
): string | null {
  if (value === undefined || value === null || value === "") return null;
  return requireString(value, field, { ...options, min: 1 });
}

export function requirePreparationType(value: unknown): PreparationType {
  if (value === "exam" || value === "interview") return value;
  throw new ValidationError("Choose either an exam or an interview.");
}

export function requireGoal(value: unknown): PreparationGoal {
  if (GOALS.some((goal) => goal.value === value)) {
    return value as PreparationGoal;
  }
  throw new ValidationError("Choose what you want out of the session.");
}

export function requireMinutes(value: unknown): number {
  const minutes = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(minutes) || !Number.isInteger(minutes)) {
    throw new ValidationError("Available time must be a whole number.");
  }
  if (minutes < 5 || minutes > 480) {
    throw new ValidationError("Available time must be between 5 and 480 minutes.");
  }
  return minutes;
}

export function requireDocumentRole(value: unknown): DocumentRole {
  if (
    value === "material" ||
    value === "resume" ||
    value === "job_description"
  ) {
    return value;
  }
  return "material";
}

export function requirePdf(value: unknown): File {
  if (!(value instanceof File)) {
    throw new ValidationError("No file was received.");
  }
  if (value.size === 0) {
    throw new ValidationError(`${value.name} is empty.`);
  }
  if (value.size > MAX_UPLOAD_BYTES) {
    throw new ValidationError(`${value.name} is too large.`);
  }
  if (value.type !== "application/pdf" && !value.name.endsWith(".pdf")) {
    throw new ValidationError("Only PDF files are supported for now.");
  }
  return value;
}

export function requireStringArray(
  value: unknown,
  field: string,
  { max = 20 }: { max?: number } = {},
): string[] {
  if (!Array.isArray(value)) throw new ValidationError(`${field} must be a list.`);
  if (value.length > max) {
    throw new ValidationError(`${field} has too many entries.`);
  }
  return value.map((entry, index) =>
    requireString(entry, `${field}[${index}]`, { max: 300 }),
  );
}
