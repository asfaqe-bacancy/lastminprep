import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "@/lib/env";

/**
 * Supabase client for server components, server actions and route handlers.
 * Reads and refreshes the session from cookies. Uses the anon key, so Row
 * Level Security still applies — this client can only see the caller's rows.
 */
export async function createSupabaseServerClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase is not configured.");
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server components cannot set cookies. `proxy.ts` refreshes the
          // session instead, so this is safe to ignore.
        }
      },
    },
  });
}
