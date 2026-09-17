"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "@/lib/env";

/** Browser client. Only ever sees NEXT_PUBLIC_* values. */
export function createSupabaseBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase is not configured.");
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
