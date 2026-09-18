import Link from "next/link";
import { SectionHeading } from "@/components/common/page-header";
import { SessionHeader } from "@/components/preparation/session-header";
import { WeakAreaList } from "@/components/progress/weak-area-list";
import { QuizRunner } from "@/components/quiz/quiz-runner";
import { EmptyState } from "@/components/common/empty-state";
import { loadPreparationPage } from "@/lib/page-data";
import { getTopicPerformance } from "@/lib/data/progress";

export const metadata = { title: "Weak areas" };

export default async function WeakAreasPage(
  props: PageProps<"/preparations/[id]/weak-areas">,
) {
  const { id } = await props.params;
  const { preparation } = await loadPreparationPage(id);

  const performance = await getTopicPerformance(id);
  const weak = performance.filter((topic) => topic.score < 70);
  const strong = performance.filter((topic) => topic.score >= 70);

  return (
    <>
      <SessionHeader
        preparation={preparation}
        current="weak_areas"
        title="Topics to revisit"
      />

      {performance.length === 0 ? (
        <EmptyState
          title="Nothing measured yet."
          description="Answer a few questions and the gaps show up here."
          action={{ href: `/preparations/${id}/quiz`, label: "Start a quick check" }}
        />
      ) : (
        <>
          <section className="mb-10">
            <WeakAreaList topics={[...weak, ...strong]} />
          </section>

          {weak.length > 0 ? (
            <section className="border-t pt-9">
              <SectionHeading>Practise these</SectionHeading>
              <p className="text-muted-foreground mb-6 max-w-prose text-[0.9375rem] leading-relaxed">
                New questions, drawn from the parts of your material covering{" "}
                {weak
                  .slice(0, 3)
                  .map((topic) => topic.name.toLowerCase())
                  .join(", ")}
                .
              </p>
              <QuizRunner
                preparationId={id}
                initialQuestions={[]}
                initialResults={[]}
                focus="weak"
              />
            </section>
          ) : (
            <section className="border-t pt-9">
              <p className="text-[0.9375rem] leading-relaxed">
                Nothing is lagging behind. Worth spending the remaining time on
                a{" "}
                <Link
                  href={`/preparations/${id}/revision`}
                  className="text-brand-text font-medium underline-offset-4 hover:underline"
                >
                  final review
                </Link>
                .
              </p>
            </section>
          )}
        </>
      )}
    </>
  );
}
