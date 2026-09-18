"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { AuthState } from "./actions";
import { signInWithGoogle } from "./actions";

/**
 * Sign in and sign up share a form. Deliberately plain: this screen is not
 * where the product makes its case.
 */
export function AuthForm({
  mode,
  action,
  next,
  googleEnabled,
}: {
  mode: "signin" | "signup";
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  next: string;
  googleEnabled: boolean;
}) {
  const [state, submit, pending] = useActionState(action, {});
  const isSignUp = mode === "signup";

  return (
    <div>
      <h1 className="text-[1.75rem] leading-tight font-medium">
        {isSignUp ? "Create your account" : "Welcome back"}
      </h1>
      <p className="text-muted-foreground mt-2 text-[0.9375rem]">
        {isSignUp
          ? "So your preparations and progress are there next time."
          : "Pick up where you left off."}
      </p>

      <form action={submit} className="mt-8 space-y-4">
        <input type="hidden" name="next" value={next} />

        {isSignUp && (
          <Field
            id="name"
            name="name"
            label="Name"
            type="text"
            autoComplete="name"
          />
        )}

        <Field
          id="email"
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
        />

        <Field
          id="password"
          name="password"
          label="Password"
          type="password"
          autoComplete={isSignUp ? "new-password" : "current-password"}
          hint={isSignUp ? "At least 8 characters" : undefined}
          required
        />

        {state.error && (
          <p role="alert" className="text-destructive text-[0.8125rem]">
            {state.error}
          </p>
        )}
        {state.notice && (
          <p role="status" className="text-[0.8125rem]">
            {state.notice}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="press bg-brand text-brand-foreground rounded-tight flex h-11 w-full items-center justify-center gap-2 text-sm font-medium shadow-soft disabled:opacity-60"
        >
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {isSignUp ? "Create account" : "Sign in"}
        </button>
      </form>

      {googleEnabled && (
        <>
          <div className="my-6 flex items-center gap-3">
            <span className="bg-border h-px flex-1" />
            <span className="text-muted-foreground text-[0.75rem]">or</span>
            <span className="bg-border h-px flex-1" />
          </div>

          <form action={signInWithGoogle}>
            <input type="hidden" name="next" value={next} />
            <button
              type="submit"
              className="press border-hairline bg-surface rounded-tight flex h-11 w-full items-center justify-center border text-sm font-medium"
            >
              Continue with Google
            </button>
          </form>
        </>
      )}

      <p className="text-muted-foreground mt-7 text-center text-[0.8125rem]">
        {isSignUp ? "Already have an account? " : "No account yet? "}
        <Link
          href={isSignUp ? "/login" : "/signup"}
          className="text-foreground font-medium underline-offset-4 hover:underline"
        >
          {isSignUp ? "Sign in" : "Create one"}
        </Link>
      </p>
    </div>
  );
}

function Field({
  id,
  name,
  label,
  type,
  autoComplete,
  hint,
  required,
}: {
  id: string;
  name: string;
  label: string;
  type: string;
  autoComplete?: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[0.8125rem]">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="border-input bg-surface rounded-tight focus:ring-ring/40 h-11 w-full border px-3 text-[0.9375rem] outline-none transition-shadow focus:ring-2"
      />
      {hint && (
        <p className="text-muted-foreground mt-1.5 text-[0.75rem]">{hint}</p>
      )}
    </div>
  );
}
