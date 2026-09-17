import "server-only";

import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEMO_PROFILE } from "@/lib/demo/fixtures";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
}

/** Never trust a client-supplied user id — always resolve it from the session. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (isDemoMode()) {
    return { ...DEMO_PROFILE };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();

  const fallbackName =
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split("@")[0] ??
    "there";

  return {
    id: user.id,
    email: user.email ?? "",
    name: profile?.name || fallbackName,
  };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
