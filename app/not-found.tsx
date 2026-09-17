import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 text-center">
      <p className="eyebrow">Not found</p>
      <h1 className="mt-3 text-[1.75rem] leading-tight font-medium">
        There&rsquo;s nothing here
      </h1>
      <p className="text-muted-foreground mt-3 text-[0.9375rem] leading-relaxed">
        The page or preparation you were looking for doesn&rsquo;t exist, or
        isn&rsquo;t yours.
      </p>
      <Link
        href="/dashboard"
        className="press bg-brand text-brand-foreground rounded-tight mx-auto mt-7 inline-flex h-10 items-center px-4 text-sm font-medium"
      >
        Back to home
      </Link>
    </div>
  );
}
