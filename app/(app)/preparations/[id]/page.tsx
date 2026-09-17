import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/common/page-header";
import { DemoNotice } from "@/components/common/demo-notice";
import { ProcessingStatus } from "@/components/documents/processing-status";
import { DocumentList } from "@/components/documents/document-list";
import { PlanTimeline } from "@/components/preparation/plan-timeline";
import { TopicList } from "@/components/preparation/topic-list";
import { GeneratePlanButton } from "@/components/preparation/generate-plan-button";
import { Meter } from "@/components/progress/meter";
import { requireUser } from "@/lib/data/auth";
import { getPreparation, listTopics } from "@/lib/data/preparations";
import { listDocuments } from "@/lib/data/documents";
import { SEGMENT_META } from "@/lib/constants";
import { formatMinutes, goalLabel, typeLabel } from "@/lib/format";
import { isDemoMode } from "@/lib/env";

export async function generateMetadata(
  props: PageProps<"/preparations/[id]">,
) {
  const { id } = await props.params;
  const preparation = await getPreparation(id);
  return { title: preparation?.title ?? "Preparation" };
}

export default async function PreparationPage(
  props: PageProps<"/preparations/[id]">,
) {
  const user = await requireUser();
  const { id } = await props.params;

  const preparation = await getPreparation(id);
  if (!preparation) notFound();
  if (!isDemoMode() && preparation.userId !== user.id) notFound();

  const [documents, topics] = await Promise.all([
    listDocuments(id),
    listTopics(id),
  ]);

  const stillWorking = documents.some(
    (doc) => doc.status !== "ready" && doc.status !== "failed",
  );
  const readyDocuments = documents.filter((doc) => doc.status === "ready");

  if (stillWorking) {
    return (
      <>
        {isDemoMode() && <DemoNotice />}
        <ProcessingStatus
          documents={documents.map((doc) => ({
            id: doc.id,
            filename: doc.filename,
            status: doc.status,
            errorMessage: doc.errorMessage,
          }))}
        />
      </>
    );
  }

  const firstSegment = preparation.plan?.segments[0];

  return (
    <>
      {isDemoMode() && <DemoNotice />}

      <header className="mb-8">
        <p className="eyebrow">
          {formatMinutes(preparation.availableMinutes)} ·{" "}
          {typeLabel(preparation.type)} · {goalLabel(preparation.goal)}
        </p>
        <h1 className="mt-3 text-[2rem] leading-[1.1] font-medium sm:text-[2.5rem]">
          {preparation.title}
        </h1>
        {preparation.plan?.headline && (
          <p className="text-muted-foreground mt-3 max-w-prose text-[1.0625rem] leading-relaxed">
            {preparation.plan.headline}
          </p>
        )}
        {preparation.progressPercent > 0 && (
          <Meter
            value={preparation.progressPercent}
            label="Prepared"
            valueLabel={`${preparation.progressPercent}%`}
            className="mt-6 max-w-sm"
          />
        )}
      </header>

      {!preparation.plan ? (
        <section className="border-hairline rounded-surface bg-surface mb-9 border p-6">
          <h2 className="text-[1.0625rem] font-medium">
            {readyDocuments.length > 0
              ? "Your material is ready"
              : "Nothing to work from yet"}
          </h2>
          <p className="text-muted-foreground mt-2 max-w-prose text-[0.9375rem] leading-relaxed">
            {readyDocuments.length > 0
              ? `We've read ${readyDocuments.length} ${readyDocuments.length === 1 ? "document" : "documents"}. Next we work out what fits into ${formatMinutes(preparation.availableMinutes)}.`
              : "Add a PDF and we'll work out what to focus on."}
          </p>
          <div className="mt-6">
            {readyDocuments.length > 0 ? (
              <GeneratePlanButton preparationId={preparation.id} />
            ) : (
              <Link
                href="/preparations/new"
                className="press border-hairline bg-surface rounded-tight inline-flex h-10 items-center px-4 text-sm font-medium"
              >
                Add material
              </Link>
            )}
          </div>
        </section>
      ) : (
        <>
          {topics.length > 0 && (
            <section className="mb-9">
              <SectionHeading>Your focus</SectionHeading>
              <TopicList topics={topics} />
            </section>
          )}

          <section className="mb-9">
            <SectionHeading>
              <span className="numeral">
                {formatMinutes(preparation.plan.totalMinutes)}
              </span>
            </SectionHeading>
            <PlanTimeline
              plan={preparation.plan}
              preparationId={preparation.id}
            />
          </section>

          {firstSegment && (
            <div className="mb-10">
              <Link
                href={`/preparations/${preparation.id}/${SEGMENT_META[firstSegment.kind].href}`}
                className="press bg-brand text-brand-foreground rounded-panel inline-flex h-12 items-center gap-2 px-6 text-[0.9375rem] font-medium shadow-soft"
              >
                {preparation.progressPercent > 0 ? "Continue" : "Start"}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          )}
        </>
      )}

      {documents.length > 0 && (
        <section>
          <SectionHeading>Material</SectionHeading>
          <DocumentList documents={documents} />
        </section>
      )}
    </>
  );
}
