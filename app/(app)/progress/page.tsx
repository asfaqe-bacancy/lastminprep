import Link from "next/link";
import { PageHeader, SectionHeading } from "@/components/common/page-header";
import { DemoNotice } from "@/components/common/demo-notice";
import { EmptyState } from "@/components/common/empty-state";
import { ProgressRing } from "@/components/progress/progress-ring";
import { ScoreChart } from "@/components/progress/score-chart";
import { StatTile } from "@/components/progress/stat-tile";
import { WeakAreaList } from "@/components/progress/weak-area-list";
import { requireUser } from "@/lib/data/auth";
import { getProgressSnapshot } from "@/lib/data/progress";
import { formatMinutes } from "@/lib/format";
import { isDemoMode } from "@/lib/env";

export const metadata = { title: "Progress" };

export default async function ProgressPage() {
  await requireUser();
  const progress = await getProgressSnapshot();

  // Quiz answers are not the only evidence of work. Somebody who has built a
  // plan and read through topics has real progress, and gating the whole page
  // on marks hid it from them.
  const hasScores = progress.questionsAnswered > 0;
  const hasActivity =
    hasScores ||
    progress.preparationsCompleted > 0 ||
    progress.studyMinutes > 0 ||
    progress.weakTopics.length > 0;

  return (
    <>
      {isDemoMode() && <DemoNotice />}

      <PageHeader
        title="Progress"
        description="How you're doing across every preparation."
      />

      {!hasActivity ? (
        <EmptyState
          title="Nothing to show yet."
          description="Answer a few questions and this page starts filling in."
          action={{ href: "/preparations/new", label: "Start preparing" }}
        />
      ) : (
        <>
          <section className="border-hairline rounded-surface bg-surface mb-8 flex flex-wrap items-center gap-7 border p-6">
            {hasScores && (
              <ProgressRing
                value={progress.averageScore}
                size={104}
                caption="average"
              />
            )}
            <div className="min-w-[12rem] flex-1">
              <p className="text-[1.0625rem] font-medium">
                {!hasScores
                  ? "You haven't been tested yet."
                  : progress.averageScore >= 75
                    ? "You're in good shape."
                    : "Worth another pass."}
              </p>
              <p className="text-muted-foreground mt-1.5 text-[0.9375rem] leading-relaxed">
                {hasScores
                  ? `${progress.questionsAnswered} questions answered across ${progress.preparationsCompleted} completed preparations, and ${formatMinutes(progress.studyMinutes)} of preparation time set aside.`
                  : `${formatMinutes(progress.studyMinutes)} of preparation time set aside. A quick check is the fastest way to find out what hasn't stuck.`}
              </p>
              {!hasScores && (
                <Link
                  href="/preparations"
                  className="press bg-brand text-brand-foreground rounded-tight mt-4 inline-flex h-10 items-center px-4 text-sm font-medium shadow-soft"
                >
                  Take a quick check
                </Link>
              )}
            </div>
          </section>

          <section className="mb-9 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="Completed"
              value={progress.preparationsCompleted}
              hint="preparations"
            />
            <StatTile
              label="Questions"
              value={progress.questionsAnswered}
              hint="answered"
            />
            <StatTile
              label="Average"
              value={hasScores ? progress.averageScore : "—"}
              unit={hasScores ? "%" : undefined}
              hint={hasScores ? undefined : "nothing marked yet"}
            />
            <StatTile
              label="Time set aside"
              value={Math.round(progress.studyMinutes / 60)}
              unit="hr"
            />
          </section>

          {hasScores && progress.recentScores.length > 1 && (
            <section className="mb-9">
              <SectionHeading>Recent scores</SectionHeading>
              <div className="border-hairline rounded-panel bg-surface border p-4">
                <ScoreChart data={progress.recentScores} />
              </div>
            </section>
          )}

          <section>
            <SectionHeading>Topics to revisit</SectionHeading>
            {progress.weakTopics.length > 0 ? (
              <WeakAreaList topics={progress.weakTopics} />
            ) : (
              <p className="text-muted-foreground border-hairline rounded-panel border border-dashed px-5 py-6 text-[0.9375rem]">
                {hasScores
                  ? "Nothing is lagging behind right now."
                  : "Answer some questions and the weak spots show up here."}
              </p>
            )}
          </section>
        </>
      )}
    </>
  );
}
