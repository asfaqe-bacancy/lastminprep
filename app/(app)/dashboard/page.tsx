import Link from "next/link";
import { SectionHeading } from "@/components/common/page-header";
import { DemoNotice } from "@/components/common/demo-notice";
import { EmptyState } from "@/components/common/empty-state";
import { PreparationCard } from "@/components/preparation/preparation-card";
import { PreparationRow } from "@/components/preparation/preparation-row";
import { TypeChoice } from "@/components/preparation/type-choice";
import { StatTile } from "@/components/progress/stat-tile";
import { requireUser } from "@/lib/data/auth";
import { listPreparations } from "@/lib/data/preparations";
import { getProgressSnapshot } from "@/lib/data/progress";
import { formatMinutes, greeting, remainingMinutes } from "@/lib/format";
import { isDemoMode } from "@/lib/env";

export const metadata = { title: "Home" };

export default async function DashboardPage() {
  const user = await requireUser();
  const [preparations, progress] = await Promise.all([
    listPreparations(),
    getProgressSnapshot(),
  ]);

  const active = preparations.find(
    (prep) => prep.status === "active" || prep.status === "ready",
  );
  const recent = preparations.filter((prep) => prep.id !== active?.id).slice(0, 4);
  const left = active
    ? remainingMinutes(active.availableMinutes, active.startedAt)
    : null;

  return (
    <>
      {isDemoMode() && <DemoNotice />}

      {/* The screen leads with time, because time is the product */}
      <header className="mb-8">
        <p className="text-muted-foreground text-[0.9375rem]">
          {greeting()}, {user.name}
        </p>
        {active && left !== null ? (
          <>
            <p className="mt-4 text-[0.9375rem]">You have</p>
            <p className="numeral mt-1 text-[3.25rem] leading-none sm:text-[4rem]">
              {formatMinutes(left)}
            </p>
            <p className="text-muted-foreground mt-2 text-[0.9375rem]">
              left on {active.title}. Here&rsquo;s what matters most.
            </p>
          </>
        ) : (
          <p className="mt-3 text-[1.75rem] leading-tight font-medium sm:text-[2.125rem]">
            {active
              ? "Your plan is ready when you are."
              : "Ready for your next preparation?"}
          </p>
        )}
      </header>

      {active ? (
        <section className="mb-10">
          <PreparationCard preparation={active} />
        </section>
      ) : (
        <section className="mb-10">
          <SectionHeading>Start a preparation</SectionHeading>
          <TypeChoice />
        </section>
      )}

      {active && (
        <section className="mb-10">
          <SectionHeading>Start something new</SectionHeading>
          <TypeChoice />
        </section>
      )}

      <section className="mb-10">
        <SectionHeading
          action={
            recent.length > 0 ? (
              <Link
                href="/preparations"
                className="text-muted-foreground hover:text-foreground text-[0.8125rem] transition-colors"
              >
                All
              </Link>
            ) : undefined
          }
        >
          Recent
        </SectionHeading>

        {recent.length > 0 ? (
          <div className="divide-y">
            {recent.map((preparation) => (
              <PreparationRow key={preparation.id} preparation={preparation} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No preparations yet."
            description="Your first one takes less than a minute to set up."
            action={{ href: "/preparations/new", label: "Start preparing" }}
          />
        )}
      </section>

      <section>
        <SectionHeading
          action={
            <Link
              href="/progress"
              className="text-muted-foreground hover:text-foreground text-[0.8125rem] transition-colors"
            >
              Details
            </Link>
          }
        >
          Progress
        </SectionHeading>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="Completed"
            value={progress.preparationsCompleted}
            hint="preparations"
          />
          <StatTile label="Questions" value={progress.questionsAnswered} hint="answered" />
          <StatTile
            label="Average"
            value={progress.averageScore}
            unit="%"
            hint="on quick checks"
          />
          <StatTile
            label="Time studied"
            value={Math.round(progress.studyMinutes / 60)}
            unit="hr"
            hint="all preparations"
          />
        </div>

        {progress.weakTopics.length > 0 && (
          <p className="text-muted-foreground mt-4 text-[0.8125rem]">
            Weakest right now:{" "}
            <span className="text-foreground">
              {progress.weakTopics
                .slice(0, 3)
                .map((topic) => topic.name)
                .join(", ")}
            </span>
          </p>
        )}
      </section>
    </>
  );
}
