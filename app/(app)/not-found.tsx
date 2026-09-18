import Link from "next/link";

/**
 * Not-found boundary inside the app shell, so a missing preparation keeps the
 * navigation around it instead of dropping the user onto a bare page.
 */
export default function AppNotFound() {
  return (
    <div className="py-16">
      <p className="eyebrow">Not found</p>
      <h1 className="mt-3 text-[1.75rem] leading-tight font-medium">
        There&rsquo;s nothing here
      </h1>
      <p className="text-muted-foreground mt-3 max-w-prose text-[0.9375rem] leading-relaxed">
        This preparation doesn&rsquo;t exist, or it isn&rsquo;t yours.
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Link
          href="/preparations"
          className="press bg-brand text-brand-foreground rounded-tight inline-flex h-10 items-center px-4 text-sm font-medium shadow-soft"
        >
          Your preparations
        </Link>
        <Link
          href="/dashboard"
          className="press border-hairline bg-surface rounded-tight inline-flex h-10 items-center border px-4 text-sm font-medium"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
