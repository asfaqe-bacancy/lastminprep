import Link from "next/link";

/**
 * Shown only when Supabase is unconfigured, so nobody mistakes fixture data
 * for their own. Disappears the moment .env.local is filled in.
 */
export function DemoNotice() {
  return (
    <div className="border-hairline rounded-panel bg-surface-2 mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 border px-4 py-3">
      <p className="text-[0.8125rem]">
        <span className="font-medium">Preview data.</span>{" "}
        <span className="text-muted-foreground">
          No database is connected, so nothing you do here is saved.
        </span>
      </p>
      <Link
        href="/settings"
        className="text-brand-text text-[0.8125rem] font-medium underline-offset-4 hover:underline"
      >
        Connect one
      </Link>
    </div>
  );
}
