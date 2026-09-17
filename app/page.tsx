import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Wordmark } from "@/components/layout/wordmark";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Meter } from "@/components/progress/meter";
import { ordinal } from "@/lib/format";
import { isDemoMode } from "@/lib/env";

const STEPS = [
  {
    title: "Give it your material",
    body: "Notes, slides, past papers, a resume, a job description. Whatever you actually have.",
  },
  {
    title: "Say how long you have",
    body: "Fifteen minutes before a viva or three hours the night before. The plan changes accordingly.",
  },
  {
    title: "Work through what matters",
    body: "Read the important parts, get questioned on them, find the gaps, close them.",
  },
];

export default function LandingPage() {
  const demo = isDemoMode();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4 sm:px-7">
        <Wordmark href="/" />
        <div className="flex items-center gap-3">
          <ThemeToggle className="hidden sm:inline-flex" />
          <Link
            href={demo ? "/dashboard" : "/login"}
            className="text-muted-foreground hover:text-foreground rounded-tight px-2 py-1.5 text-sm transition-colors"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 sm:px-7">
        {/* Hero — no gradients, no jargon, no badges (design-system section 6) */}
        <section className="pt-14 pb-16 sm:pt-24 sm:pb-24">
          <h1 className="max-w-[18ch] text-[2.5rem] leading-[1.04] font-medium tracking-[-0.03em] sm:text-[4rem] lg:text-[4.5rem]">
            You don&rsquo;t need more time.
            <span className="text-muted-foreground block">
              You need a better way to use it.
            </span>
          </h1>

          <p className="text-muted-foreground mt-7 max-w-[46ch] text-[1.0625rem] leading-relaxed sm:text-[1.1875rem]">
            Upload what you need to know. Tell us how much time you have.
            We&rsquo;ll help you focus on what matters.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/preparations/new"
              className="press bg-brand text-brand-foreground rounded-panel inline-flex h-12 items-center gap-2 px-6 text-[0.9375rem] font-medium shadow-soft"
            >
              Start preparing
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/dashboard"
              className="press border-hairline bg-surface rounded-panel inline-flex h-12 items-center px-5 text-[0.9375rem] font-medium"
            >
              See it working
            </Link>
          </div>
        </section>

        {/* One tactile look at the product, rather than a feature grid */}
        <section aria-label="A preparation in progress" className="pb-20">
          <div className="border-hairline rounded-hero bg-surface-2 border p-4 sm:p-7">
            <div className="border-hairline rounded-feature bg-surface border p-6 shadow-raised sm:p-9">
              <p className="eyebrow">Interview · 45 minutes</p>
              <p className="mt-4 text-[1.5rem] leading-tight font-medium sm:text-[2rem]">
                React Native Interview
              </p>
              <p className="text-muted-foreground mt-2 text-[0.9375rem]">
                Architecture first, then performance. Skip tooling.
              </p>
              <Meter
                value={68}
                label="Prepared"
                valueLabel="68%"
                className="mt-7 max-w-sm"
              />
              <ul className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {[
                  "Architecture",
                  "Performance",
                  "State management",
                  "Offline-first",
                ].map((topic, index) => (
                  <li key={topic} className="flex items-baseline gap-3">
                    <span className="text-muted-foreground numeral text-[0.8125rem]">
                      {ordinal(index)}
                    </span>
                    <span className="text-[0.9375rem]">{topic}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-t py-16 sm:py-20">
          <h2 className="text-[1.5rem] font-medium sm:text-[1.875rem]">
            How it works
          </h2>
          <ol className="mt-9 grid gap-9 sm:grid-cols-3 sm:gap-7">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <p className="text-muted-foreground numeral text-[0.8125rem]">
                  {ordinal(index)}
                </p>
                <h3 className="mt-2 text-[1.0625rem] font-medium">
                  {step.title}
                </h3>
                <p className="text-muted-foreground mt-2 text-[0.9375rem] leading-relaxed">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-t py-16 sm:py-20">
          <p className="max-w-[34ch] text-[1.5rem] leading-snug font-medium sm:text-[2rem]">
            Fifteen minutes is enough to be ready for the right three things.
          </p>
          <Link
            href="/preparations/new"
            className="press bg-brand text-brand-foreground rounded-panel mt-8 inline-flex h-12 items-center gap-2 px-6 text-[0.9375rem] font-medium shadow-soft"
          >
            Start preparing
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-7">
        <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-4 border-t pt-6 text-[0.8125rem]">
          <p>PrepSprint</p>
          <ThemeToggle className="sm:hidden" />
        </div>
      </footer>
    </div>
  );
}
