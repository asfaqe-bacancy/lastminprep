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

  const hasData = progress.questionsAnswered > 0;

  return (
    <>
      {isDemoMode() && <DemoNotice />}

      <PageHeader
        title="Progress"
        description="How you're doing across every preparation."
      />

      {!hasData ? (
        <EmptyState
          title="Nothing to show yet."
          description="Answer a few questions and this page starts filling in."
          action={{ href: "/preparations/new", label: "Start preparing" }}
        />
      ) : (
        <>
          <section className="border-hairline rounded-surface bg-surface mb-8 flex flex-wrap items-center gap-7 border p-6">
            <ProgressRing
              value={progress.averageScore}
              size={104}
              caption="average"
            />
            <div className="min-w-[12rem] flex-1">
              <p className="text-[1.0625rem] font-medium">
                {progress.averageScore >= 75
                  ? "You're in good shape."
                  : "Worth another pass."}
              </p>
              <p className="text-muted-foreground mt-1.5 text-[0.9375rem] leading-relaxed">
                {progress.questionsAnswered} questions answered across{" "}
                {progress.preparationsCompleted} completed preparations, and{" "}
                {formatMinutes(progress.studyMinutes)} of study time.
              </p>
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
            <StatTile label="Average" value={progress.averageScore} unit="%" />
            <StatTile
              label="Time studied"
              value={Math.round(progress.studyMinutes / 60)}
              unit="hr"
            />
          </section>

          {progress.recentScores.length > 1 && (
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
                Nothing is lagging behind right now.
              </p>
            )}
          </section>
        </>
      )}
    </>
  );
}
