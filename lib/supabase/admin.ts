import "server-only";

import { createClient } from "@supabase/supabase-js";
import { requireServiceRoleKey, requireSupabaseUrl } from "@/lib/env";

/**
 * Service-role client. Bypasses RLS, so it is only used by the document
 * pipeline (writing chunks and embeddings) and always after the caller's
 * ownership of the parent record has been checked.
 *
 * `server-only` makes importing this from a client component a build error.
 */
export function createSupabaseAdminClient() {
  return createClient(requireSupabaseUrl(), requireServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
