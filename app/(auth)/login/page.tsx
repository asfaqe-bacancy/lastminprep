import { redirect } from "next/navigation";
import { AuthForm } from "../auth-form";
import { signIn } from "../actions";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata = { title: "Sign in" };

export default async function LoginPage(props: PageProps<"/login">) {
  // With no backend there is nothing to sign in to — go straight to the app.
  if (!isSupabaseConfigured()) redirect("/dashboard");

  const params = await props.searchParams;
  const raw = Array.isArray(params.next) ? params.next[0] : params.next;
  const next = raw?.startsWith("/") ? raw : "/dashboard";

  return <AuthForm mode="signin" action={signIn} next={next} googleEnabled />;
}
