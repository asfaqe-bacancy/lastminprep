/**
 * Environment access in one place.
 *
 * The app is built so that it renders end to end *before* credentials exist:
 * when Supabase or Gemini is unconfigured we fall back to `lib/demo/fixtures`
 * for reads and surface a clear setup notice instead of crashing.
 *
 * Secret values are only read from server components, server actions and route
 * handlers. Nothing here is imported into a `"use client"` module except
 * `isSupabaseConfigured` / `isDemoMode`, which rely on NEXT_PUBLIC_* only.
 */

function publicValue(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("your-")) return null;
  return trimmed;
}

export const supabaseUrl = publicValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const supabaseAnonKey = publicValue(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/** True when the app has no backend and is running on fixture data. */
export function isDemoMode(): boolean {
  return !isSupabaseConfigured();
}

/** Server-only. Throws rather than silently calling Gemini without a key. */
export function requireGeminiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local — see README.md.",
    );
  }
  return key;
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

/** Server-only. Needed for document processing and vector writes. */
export function requireServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local — see README.md.",
    );
  }
  return key;
}

export function requireSupabaseUrl(): string {
  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not set. Add it to .env.local — see README.md.",
    );
  }
  return supabaseUrl;
}
