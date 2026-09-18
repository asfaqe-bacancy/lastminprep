import { redirect } from "next/navigation";
import { AuthForm } from "../auth-form";
import { signUp } from "../actions";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata = { title: "Create an account" };

export default async function SignUpPage(props: PageProps<"/signup">) {
  if (!isSupabaseConfigured()) redirect("/dashboard");

  const params = await props.searchParams;
  const raw = Array.isArray(params.next) ? params.next[0] : params.next;
  const next = raw?.startsWith("/") ? raw : "/dashboard";

  return <AuthForm mode="signup" action={signUp} next={next} googleEnabled />;
}
