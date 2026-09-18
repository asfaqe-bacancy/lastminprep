"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export interface AuthState {
  error?: string;
  notice?: string;
}

function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  // Only same-site paths, so a crafted `next` can't bounce the user offsite.
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export async function signIn(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase isn't configured yet — see the README." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email address and password." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      error:
        error.message === "Invalid login credentials"
          ? "That email and password don't match."
          : error.message,
    };
  }

  redirect(safeNext(formData.get("next")));
}

export async function signUp(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase isn't configured yet — see the README." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!email || !password) {
    return { error: "Enter an email address and a password." };
  }
  if (password.length < 8) {
    return { error: "Use at least 8 characters for your password." };
  }

  const supabase = await createSupabaseServerClient();
  const origin = (await headers()).get("origin") ?? "";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: name || email.split("@")[0] },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) return { error: error.message };

  // With email confirmation switched on there is no session yet.
  if (!data.session) {
    return {
      notice: "Check your email for a confirmation link, then sign in.",
    };
  }

  redirect(safeNext(formData.get("next")));
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  if (!isSupabaseConfigured()) redirect("/login?error=unconfigured");

  const supabase = await createSupabaseServerClient();
  const origin = (await headers()).get("origin") ?? "";
  const next = safeNext(formData.get("next"));

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) redirect("/login?error=google");
  redirect(data.url);
}
