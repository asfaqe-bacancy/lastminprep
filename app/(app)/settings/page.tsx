import { PageHeader, SectionHeading } from "@/components/common/page-header";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { requireUser } from "@/lib/data/auth";
import { isGeminiConfigured, isSupabaseConfigured } from "@/lib/env";
import { cn } from "@/lib/utils";

export const metadata = { title: "Settings" };

function ConfigRow({
  label,
  ready,
  detail,
}: {
  label: string;
  ready: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <p className="text-[0.9375rem]">{label}</p>
        <p className="text-muted-foreground mt-0.5 text-[0.8125rem] leading-relaxed">
          {detail}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full border px-2.5 py-0.5 text-[0.6875rem]",
          ready
            ? "border-hairline text-muted-foreground"
            : "border-caution/40 text-caution",
        )}
      >
        {ready ? "Connected" : "Not set"}
      </span>
    </div>
  );
}

export default async function SettingsPage() {
  const user = await requireUser();
  const supabaseReady = isSupabaseConfigured();
  const geminiReady = isGeminiConfigured();

  return (
    <>
      <PageHeader title="Settings" />

      <section className="mb-9">
        <SectionHeading>Account</SectionHeading>
        <div className="border-hairline rounded-panel bg-surface divide-y border px-4">
          <div className="flex items-center justify-between gap-4 py-3.5">
            <p className="text-[0.9375rem]">Name</p>
            <p className="text-muted-foreground text-[0.9375rem]">{user.name}</p>
          </div>
          <div className="flex items-center justify-between gap-4 py-3.5">
            <p className="text-[0.9375rem]">Email</p>
            <p className="text-muted-foreground truncate text-[0.9375rem]">
              {user.email || "—"}
            </p>
          </div>
        </div>
      </section>

      <section className="mb-9">
        <SectionHeading>Appearance</SectionHeading>
        <div className="border-hairline rounded-panel bg-surface flex items-center justify-between border px-4 py-3.5">
          <p className="text-[0.9375rem]">Theme</p>
          <ThemeToggle />
        </div>
      </section>

      <section className="mb-9">
        <SectionHeading>Connections</SectionHeading>
        <div className="border-hairline rounded-panel bg-surface divide-y border px-4">
          <ConfigRow
            label="Supabase"
            ready={supabaseReady}
            detail="Stores your preparations, documents and the vectors behind search."
          />
          <ConfigRow
            label="Gemini"
            ready={geminiReady}
            detail="Writes your plan, asks the questions and marks your answers."
          />
        </div>

        {(!supabaseReady || !geminiReady) && (
          <div className="border-hairline rounded-panel bg-surface-2 mt-3 border px-4 py-4">
            <p className="text-[0.9375rem] font-medium">Finish setting up</p>
            <p className="text-muted-foreground mt-1.5 text-[0.8125rem] leading-relaxed">
              Copy <code className="font-mono text-[0.8125rem]">.env.example</code>{" "}
              to <code className="font-mono text-[0.8125rem]">.env.local</code>,
              fill in the values, apply the SQL in{" "}
              <code className="font-mono text-[0.8125rem]">
                supabase/migrations
              </code>
              , then restart the dev server. The README has the full sequence.
            </p>
            {!supabaseReady && (
              <p className="text-muted-foreground mt-2.5 text-[0.8125rem]">
                Until Supabase is connected the app runs on preview data and
                nothing is saved.
              </p>
            )}
          </div>
        )}
      </section>

      {supabaseReady && (
        <section>
          <form action="/auth/sign-out" method="post">
            <button
              type="submit"
              className="press border-hairline rounded-tight text-muted-foreground hover:text-foreground h-10 border px-4 text-sm font-medium"
            >
              Sign out
            </button>
          </form>
        </section>
      )}
    </>
  );
}
